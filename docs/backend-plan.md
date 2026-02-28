# Backend Plan: Supabase + Drizzle ORM

> Durum: Ön planlama belgesi  
> Stack: **Next.js 14 + Supabase (Auth + Postgres) + Drizzle ORM**

---

## 1. Genel Mimari

```
Browser (Zustand store)
    ↕ Server Actions / API Routes
Drizzle ORM  ←→  Supabase Postgres
Supabase Auth  →  Row Level Security (RLS)
```

- **Auth**: Supabase Auth (email/password veya OAuth). `auth.users` tablosu otomatik gelir.
- **ORM**: Drizzle — type-safe queries, migration yönetimi, Supabase Postgres'e direkt bağlantı (connection pooling: `SUPABASE_DB_URL`).
- **RLS**: Her tabloda `user_id = auth.uid()` politikaları → kullanıcı sadece kendi verisini okur/yazar.
- **State**: Zustand store tamamen istemci tarafında kalacak; server'dan hydrate edilecek.

---

## 2. Varlık Haritası

```
auth.users
  └─ books (bir kullanıcının kitapları)
       ├─ chapters (ağaç yapısı — dallanma)
       ├─ characters (karakter listesi)
       │    └─ character_details
       ├─ dictionary_entries
       ├─ world_entries
       └─ notes

users (public profil — auth.users mirror)
  └─ character_library (kullanıcı seviyesi global karakterler)
  └─ world_library
  └─ dictionary_library
```

---

## 3. Drizzle Schema

### `books`
```ts
export const books = pgTable('books', {
  id:             uuid('id').primaryKey().defaultRandom(),
  userId:         uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  title:          text('title').notNull(),
  description:    text('description'),
  coverColor:     text('cover_color').default('#1a1a2e'),
  // Devam kitabı: kaynak kitaba referans
  parentBookId:   uuid('parent_book_id').references((): AnyPgColumn => books.id),
  createdAt:      timestamp('created_at').defaultNow(),
  updatedAt:      timestamp('updated_at').defaultNow(),
});
```

### `chapters` — Git ağaç yapısı
```ts
export const chapters = pgTable('chapters', {
  id:               uuid('id').primaryKey().defaultRandom(),
  bookId:           uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  parentChapterId:  uuid('parent_chapter_id').references((): AnyPgColumn => chapters.id),
  title:            text('title').notNull(),
  content:          text('content').default(''),
  order:            integer('order').notNull().default(0),   // sibling sırası
  // Git main/master mantığı: bu dal "canon" mu?
  isCanon:          boolean('is_canon').notNull().default(false),
  createdAt:        timestamp('created_at').defaultNow(),
  updatedAt:        timestamp('updated_at').defaultNow(),
});
```

> **Canon kural**: Her `parentChapterId` grubunda en fazla **1** `isCanon = true` olabilir.  
> Uygulama katmanında enforced. İsteğe bağlı Postgres `UNIQUE PARTIAL INDEX` ile de kısıtlanabilir.

```sql
-- Opsiyonel DB kısıtı:
CREATE UNIQUE INDEX unique_canon_per_parent
  ON chapters (book_id, parent_chapter_id)
  WHERE is_canon = true;
```

### `characters`
```ts
export const characters = pgTable('characters', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  userId:             uuid('user_id').notNull().references(() => authUsers.id),
  // null = kullanıcı kütüphanesi (global), dolu = o kitaba ait
  bookId:             uuid('book_id').references(() => books.id, { onDelete: 'cascade' }),
  // Başka kitaptan "fork" edildiyse kaynak
  sourceCharacterId:  uuid('source_character_id').references((): AnyPgColumn => characters.id),
  name:               text('name').notNull(),
  role:               text('role').default(''),
  color:              text('color').default('blue'),
  createdAt:          timestamp('created_at').defaultNow(),
});

export const characterDetails = pgTable('character_details', {
  id:           uuid('id').primaryKey().defaultRandom(),
  characterId:  uuid('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  key:          text('key').notNull(),
  value:        text('value').notNull(),
});
```

### `dictionary_entries`
```ts
export const dictionaryEntries = pgTable('dictionary_entries', {
  id:              uuid('id').primaryKey().defaultRandom(),
  userId:          uuid('user_id').notNull().references(() => authUsers.id),
  bookId:          uuid('book_id').references(() => books.id, { onDelete: 'cascade' }),
  sourceEntryId:   uuid('source_entry_id').references((): AnyPgColumn => dictionaryEntries.id),
  word:            text('word').notNull(),
  meaning:         text('meaning').default(''),
  color:           text('color').default('blue'),
  createdAt:       timestamp('created_at').defaultNow(),
});
```

### `world_entries`
```ts
export const worldEntries = pgTable('world_entries', {
  id:              uuid('id').primaryKey().defaultRandom(),
  userId:          uuid('user_id').notNull().references(() => authUsers.id),
  bookId:          uuid('book_id').references(() => books.id, { onDelete: 'cascade' }),
  sourceEntryId:   uuid('source_entry_id').references((): AnyPgColumn => worldEntries.id),
  label:           text('label').notNull(),
  value:           text('value').default(''),
  createdAt:       timestamp('created_at').defaultNow(),
});
```

### `notes`
```ts
export const notes = pgTable('notes', {
  id:         uuid('id').primaryKey().defaultRandom(),
  bookId:     uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  title:      text('title').notNull(),
  content:    text('content').default(''),
  createdAt:  timestamp('created_at').defaultNow(),
  updatedAt:  timestamp('updated_at').defaultNow(),
});
```

---

## 4. Canon Branch Mantığı (git main ↔ isCanon)

Mevcut uygulamada bölümler dallanabiliyor. Hangi dal **"canonical hikaye"** olduğunu seçmek için:

```
Bölüm 1 (canon ✓)
  ├─ Bölüm 2A — Köyü terk et  (canon ✓)  ← ana hikaye devam
  └─ Bölüm 2B — Köyde kal    (canon ✗)  ← alternatif dal
        └─ Bölüm 3B          (canon ✗)
```

- **UI**: Her dal node'unda "Canona al" butonu (◎ simgesi). Tıklandığında aynı `parentChapterId`'ye sahip kardeş bölümlerin `isCanon` değeri `false` yapılır, bu bölüm `true` olur.
- **Server Action**:
  ```ts
  async function setCanon(bookId: string, chapterId: string, parentId: string | null) {
    await db.transaction(async tx => {
      // 1. Aynı parent'ın tüm kardeşlerini false yap
      await tx.update(chapters)
        .set({ isCanon: false })
        .where(and(eq(chapters.bookId, bookId), eq(chapters.parentChapterId, parentId)));
      // 2. Seçili bölümü canon yap
      await tx.update(chapters)
        .set({ isCanon: true })
        .where(eq(chapters.id, chapterId));
    });
  }
  ```
- **Önizleme**: `BookPreview` bileşeni sadece `isCanon = true` olan dalı takip eder (şu an aktif bölümü takip ediyor, backend'e geçince bu SQL sorgusuyla yapılır).
- **İhracat / Print**: Sadece canon path kullanılır.

---

## 5. Kitaplar Arası Aktarım (Devam Kitabı)

Devam kitabı oluştururken:

```
Kitap A (ana kitap)          Kitap B (devam kitabı)
  characters: [Ali, Fatma]  →  characters: [Ali*, Fatma*]  (*fork)
  world: [Kalat Şehri]      →  world: [Kalat Şehri*]
  dictionary: [Rünler]      →  dictionary: [Rünler*]
  chapters: (kopyalanmaz)      chapters: (boş başlar)
```

### Fork İşlemi
```ts
async function createSequelBook(sourceBookId: string, userId: string, options: {
  importCharacters: boolean;
  importWorld: boolean;
  importDictionary: boolean;
}) {
  return await db.transaction(async tx => {
    // 1. Yeni kitabı oluştur
    const [newBook] = await tx.insert(books).values({
      userId, title: 'Devam Kitabı', parentBookId: sourceBookId,
    }).returning();

    // 2. Seçili varlıkları fork et (source referansıyla kopyala)
    if (options.importCharacters) {
      const sourceChars = await tx.select().from(characters)
        .where(eq(characters.bookId, sourceBookId));
      for (const char of sourceChars) {
        const [newChar] = await tx.insert(characters).values({
          userId, bookId: newBook.id,
          sourceCharacterId: char.id,  // orijinale iz
          name: char.name, role: char.role, color: char.color,
        }).returning();
        // Details da kopyalanır
        const details = await tx.select().from(characterDetails)
          .where(eq(characterDetails.characterId, char.id));
        if (details.length) {
          await tx.insert(characterDetails).values(
            details.map(d => ({ characterId: newChar.id, key: d.key, value: d.value }))
          );
        }
      }
    }
    // world ve dictionary için aynı pattern...
    return newBook;
  });
}
```

### Fork görünümü (UI)
- Karakter panelinde fork'lanmış karakterler yanında küçük "↗ Kitap A" badge'i
- Kaynak karaktere "git ile kıyasla" butonu (ileride)

---

## 6. Row Level Security (RLS) Politikaları

```sql
-- books
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own books" ON books
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- chapters (book üzerinden)
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chapters via book ownership" ON chapters
  USING (book_id IN (SELECT id FROM books WHERE user_id = auth.uid()));

-- characters (book üzerinden veya user_id direkt)
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "characters own" ON characters
  USING (user_id = auth.uid());
```

---

## 7. Drizzle Kurulum Adımları

```bash
# 1. Bağımlılıklar
npm install drizzle-orm @supabase/supabase-js postgres
npm install -D drizzle-kit

# 2. Supabase client
# src/lib/supabase.ts  →  createClient() ile browser/server client'ları

# 3. Drizzle config
# drizzle.config.ts  →  connectionString: process.env.DATABASE_URL

# 4. Schema dosyaları
# src/db/schema/books.ts
# src/db/schema/chapters.ts
# src/db/schema/characters.ts
# ... vb.

# 5. Migration
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## 8. Zustand → Server Hydration Stratejisi

Şu an store tamamen client-side (localStorage'da bile yok). Geçiş:

1. **Next.js Server Component** → page yüklenince aktif kitabın verisini fetch et → `<HydrateStore data={...}>` client componenti ile store'u doldur.
2. **Optimistic updates**: Kullanıcı yazar → Zustand anında güncellenir → arka planda `updateChapterContent()` server action tetiklenir.
3. **Debounce**: İçerik değişimi için 1-2sn debounce (her tuş vuruşunda DB'ye yazma).

```ts
// Örnek Server Action
'use server'
export async function updateChapterContent(id: string, content: string) {
  const supabase = createServerClient(); // auth cookie'li
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  await db.update(chapters)
    .set({ content, updatedAt: new Date() })
    .where(and(
      eq(chapters.id, id),
      // chapter'ın sahibi bu user mı? (subquery)
      inArray(chapters.bookId,
        db.select({ id: books.id }).from(books).where(eq(books.userId, user.id))
      )
    ));
}
```

---

## 9. Sonraki Adımlar (Sıralı)

| # | Adım | Öncelik |
|---|------|---------|
| 1 | Supabase projesi oluştur, env değişkenlerini ekle | 🔴 Kritik |
| 2 | `src/db/schema/` dosyalarını yaz (Drizzle) | 🔴 Kritik |
| 3 | `drizzle-kit generate && migrate` ile tabloları oluştur | 🔴 Kritik |
| 4 | Supabase Auth: login/register sayfaları | 🔴 Kritik |
| 5 | RLS politikalarını uygula | 🔴 Kritik |
| 6 | Server Actions: chapter CRUD | 🟠 Yüksek |
| 7 | Server Actions: character/world/dictionary CRUD | 🟠 Yüksek |
| 8 | Canon branch: `setCanon` action + UI butonu | 🟠 Yüksek |
| 9 | Kitap listesi sayfası (`/books`) | 🟠 Yüksek |
| 10 | Devam kitabı oluşturma: fork dialog | 🟡 Orta |
| 11 | Karakter kütüphanesi (book-agnostic) | 🟡 Orta |
| 12 | Real-time işbirliği (Supabase Realtime) | 🟢 İleri |
