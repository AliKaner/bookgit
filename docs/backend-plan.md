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

- **Auth**: Supabase Auth (email/password + OAuth). `auth.users` otomatik.
- **ORM**: Drizzle — type-safe queries, migration yönetimi, connection pooling via `DATABASE_URL`.
- **RLS**: Public kitaplar herkes okuyabilir, private sadece sahibi. Diğer tablolar `user_id = auth.uid()`.
- **State**: Zustand istemci tarafında, server'dan hydrate edilir.

---

## 2. Varlık Haritası (Güncellenmiş)

```
auth.users
  └─ profiles (public kullanıcı profili)
  └─ books
       ├─ visibility: public | private
       ├─ genres  (N:M  →  book_genres)
       ├─ tags    (N:M  →  book_tags)
       ├─ chapters (ağaç + canon bayrağı)
       ├─ characters + character_details
       ├─ dictionary_entries
       ├─ world_entries
       ├─ notes
       └─ book_stats (word count cache vb.)

genres  (global enum tablo)
tags    (user bazlı, reusable)

[Anasayfa]  ←  public books + search + genre/tag filtre
```

---

## 3. Drizzle Schema

### 3.1 Genre Enum + Tablo

Genre'lar sabit bir küme — hem Postgres `enum` hemde lookup tablo olabilir. Lookup tablo tercih edildi: yeni genre eklemek için migration gerekmez, UI'de kolayca listeleyin.

```ts
// src/db/schema/genres.ts
export const genreEnum = pgEnum('genre_type', [
  'fantasy',
  'sci_fi',
  'mystery',
  'thriller',
  'romance',
  'historical',
  'horror',
  'adventure',
  'literary_fiction',
  'young_adult',
  'childrens',
  'biography',
  'self_help',
  'poetry',
  'graphic_novel',
  'dystopia',
  'paranormal',
  'crime',
]);

// Opsiyonel: lookup tablo (admin ekleyebilsin diye)
export const genres = pgTable('genres', {
  id:    serial('id').primaryKey(),
  slug:  genreEnum('slug').notNull().unique(),
  label: text('label').notNull(),       // "Fantastik", "Bilim Kurgu" vb.
  emoji: text('emoji'),                 // 🧙 🚀 🔍
});
```

### 3.2 Tags

Tag'ler kullanıcı tarafından serbest girişle oluşturulur, kitaplar arasında yeniden kullanılabilir.

```ts
// src/db/schema/tags.ts
export const tags = pgTable('tags', {
  id:     uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  name:   text('name').notNull(),
}, (t) => ({
  uniqueUserTag: unique().on(t.userId, t.name), // aynı user aynı tag'i iki kez oluşturamaz
}));
```

### 3.3 Books (Güncellenmiş)

```ts
// src/db/schema/books.ts
export const visibilityEnum = pgEnum('visibility', ['public', 'private']);

export const books = pgTable('books', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  title:        text('title').notNull(),
  description:  text('description'),
  coverColor:   text('cover_color').default('#1a1a2e'),
  coverImageUrl: text('cover_image_url'),          // Supabase Storage URL
  visibility:   visibilityEnum('visibility').notNull().default('private'),
  language:     text('language').default('tr'),     // dil kodu (tr, en, fr…)
  parentBookId: uuid('parent_book_id').references((): AnyPgColumn => books.id),
  // Full-text search vektörü (otomatik güncellenir, aşağıda trigger var)
  searchVector: tsvector('search_vector'),
  createdAt:    timestamp('created_at').defaultNow(),
  updatedAt:    timestamp('updated_at').defaultNow(),
}, (t) => ({
  searchIdx:    index('books_search_idx').using('gin', t.searchVector),
  userIdx:      index('books_user_idx').on(t.userId),
  visibilityIdx: index('books_visibility_idx').on(t.visibility),
}));

// N:M: Book ↔ Genre
export const bookGenres = pgTable('book_genres', {
  bookId:  uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  genreId: integer('genre_id').notNull().references(() => genres.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.bookId, t.genreId] }),
}));

// N:M: Book ↔ Tag
export const bookTags = pgTable('book_tags', {
  bookId: uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  tagId:  uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.bookId, t.tagId] }),
}));
```

### 3.4 Chapters — Git Ağaç Yapısı

```ts
export const chapters = pgTable('chapters', {
  id:              uuid('id').primaryKey().defaultRandom(),
  bookId:          uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  parentChapterId: uuid('parent_chapter_id').references((): AnyPgColumn => chapters.id),
  title:           text('title').notNull(),
  content:         text('content').default(''),
  order:           integer('order').notNull().default(0),
  isCanon:         boolean('is_canon').notNull().default(false),
  createdAt:       timestamp('created_at').defaultNow(),
  updatedAt:       timestamp('updated_at').defaultNow(),
});

// DB kısıtı: bir parent altında maks 1 canon
// CREATE UNIQUE INDEX unique_canon_per_parent
//   ON chapters (book_id, parent_chapter_id)
//   WHERE is_canon = true;
```

### 3.5 Characters, Dictionary, World, Notes

_(Önceki planla aynı — `sourceXId` fork referansları korunuyor)_

### 3.6 Book Stats (cache tablo)

Anasayfada word count, chapter count vb. göstermek için her sorguda join yerine cache:

```ts
export const bookStats = pgTable('book_stats', {
  bookId:       uuid('book_id').primaryKey().references(() => books.id, { onDelete: 'cascade' }),
  wordCount:    integer('word_count').default(0),
  chapterCount: integer('chapter_count').default(0),
  branchCount:  integer('branch_count').default(0),   // toplam dal sayısı
  updatedAt:    timestamp('updated_at').defaultNow(),
});
```

### 3.7 Book Likes / Reactions (Ekstra)

Public kitaplar için:

```ts
export const bookLikes = pgTable('book_likes', {
  bookId: uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.bookId, t.userId] }),
}));
```

---

## 4. Full-Text Search (Postgres)

Supabase'in yerleşik Postgres FTS'i kullanılır — harici servis gerekmez.

### 4.1 `tsvector` Trigger (SQL)

`books.search_vector` kolonunu title + description + tag adları üzerinden otomatik günceller:

```sql
CREATE OR REPLACE FUNCTION update_book_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('turkish', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('turkish', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER books_search_vector_update
  BEFORE INSERT OR UPDATE OF title, description
  ON books
  FOR EACH ROW EXECUTE FUNCTION update_book_search_vector();
```

> **Not**: Tag adları için ayrı bir `refresh_book_search_vector(book_id)` fonksiyonu çağrılır (tag eklenince).

### 4.2 Drizzle ile Arama Sorgusu

```ts
// src/db/queries/search.ts
export async function searchPublicBooks(query: string, options?: {
  genre?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}) {
  const tsQuery = sql`plainto_tsquery('turkish', ${query})`;

  return db
    .select({
      id: books.id,
      title: books.title,
      description: books.description,
      coverColor: books.coverColor,
      coverImageUrl: books.coverImageUrl,
      authorId: books.userId,
      wordCount: bookStats.wordCount,
      rank: sql<number>`ts_rank(${books.searchVector}, ${tsQuery})`,
    })
    .from(books)
    .leftJoin(bookStats, eq(bookStats.bookId, books.id))
    .leftJoin(bookGenres, eq(bookGenres.bookId, books.id))
    .leftJoin(genres, eq(genres.id, bookGenres.genreId))
    .where(and(
      eq(books.visibility, 'public'),
      query ? sql`${books.searchVector} @@ ${tsQuery}` : undefined,
      options?.genre ? eq(genres.slug, options.genre as any) : undefined,
    ))
    .orderBy(desc(sql`ts_rank(${books.searchVector}, ${tsQuery})`))
    .limit(options?.limit ?? 20)
    .offset(options?.offset ?? 0);
}
```

---

## 5. Anasayfa Feed & RLS

### RLS Politikaları (Güncellenmiş)

```sql
-- books: sahip her şeyi görebilir, public kitaplar herkes okuyabilir
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner full access" ON books
  USING (user_id = auth.uid());

CREATE POLICY "public books readable by all" ON books
  FOR SELECT
  USING (visibility = 'public');

-- Diğer tablolar (chapters, characters vb.) visibility'e göre DEĞİL,
-- book sahipliğine göre korunur (public kitabın chapter'larını guest okuyabilmemeli)
-- Okuma erişimi için ayrı bir "read_access" politikası eklenebilir:
CREATE POLICY "public book chapters readable" ON chapters
  FOR SELECT
  USING (
    book_id IN (SELECT id FROM books WHERE visibility = 'public')
    OR
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );
```

### Anasayfa Sorgusu

```ts
// src/app/page.tsx  (Server Component)
const featuredBooks = await db
  .select({ ...bookFields, genreSlug: genres.slug, genreLabel: genres.label })
  .from(books)
  .leftJoin(bookStats, eq(bookStats.bookId, books.id))
  .leftJoin(bookGenres, eq(bookGenres.bookId, books.id))
  .leftJoin(genres, eq(genres.id, bookGenres.genreId))
  .where(eq(books.visibility, 'public'))
  .orderBy(desc(books.createdAt))
  .limit(24);
```

---

## 6. Canon Branch Mantığı

```
Bölüm 1 (canon ✓)
  ├─ Bölüm 2A — Köyü terk et  (canon ✓)  ← ana hikaye
  └─ Bölüm 2B — Köyde kal    (canon ✗)  ← alternatif dal
```

Canon seçimi: transaction ile kardeşleri `false` yap, seçiliyi `true` yap.  
Preview ve export sadece canon path'i izler.

---

## 7. Kitaplar Arası Aktarım (Devam Kitabı)

Karakter, dünya ve sözlük `source*Id` foreign key ile fork edilir.  
Bölümler kopyalanmaz; devam kitabı boş başlar.

---

## 8. Ekstra Düşünülenler

| Özellik | Tablo / Yaklaşım | Öncelik |
|---------|-----------------|---------|
| Yazar profili sayfası (`/u/username`) | `profiles` tablosu, `username` unique | 🟠 |
| Kitap kapak görseli | Supabase Storage bucket `covers/` | 🟠 |
| Okuma ilerlemesi (reader mode) | `reading_progress(user_id, book_id, chapter_id)` | 🟡 |
| Beğeni / Like | `book_likes` (yukarıda tanımlı) | 🟡 |
| Kitap serisi gruplama | `series(id, title, user_id)` + `series_books(series_id, book_id, order)` | 🟡 |
| Chapter word count cache | Her chapter kaydedilince `bookStats` güncelle (Server Action içinde) | 🟡 |
| Yorum / Feedback | `book_comments(book_id, user_id, content, created_at)` | 🟢 |
| Embed / Share link | Public kitap için `/read/[book_id]` route | 🟢 |
| Real-time co-writing | Supabase Realtime channel per chapter | 🟢 |

---

## 9. Drizzle Kurulum Adımları

```bash
npm install drizzle-orm @supabase/supabase-js postgres
npm install -D drizzle-kit

# drizzle.config.ts
# schema: './src/db/schema/**'
# dialect: 'postgresql'
# dbCredentials: { url: process.env.DATABASE_URL }

npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## 10. Sonraki Adımlar (Güncellenmiş)

| # | Adım | Öncelik |
|---|------|---------|
| 1 | Supabase projesi + env değişkenleri | 🔴 |
| 2 | Drizzle schema dosyaları (genres, tags, books + yeni alanlar) | 🔴 |
| 3 | `generate && migrate` | 🔴 |
| 4 | FTS trigger SQL'ini migration'a ekle | 🔴 |
| 5 | RLS politikaları (public + owner) | 🔴 |
| 6 | Supabase Auth: login/register sayfaları | 🔴 |
| 7 | Kitap oluşturma dialog: title, description, visibility, genre seç, tag ekle | 🟠 |
| 8 | Anasayfa: public kitap grid + arama input + genre filtre | 🟠 |
| 9 | Server Actions: chapter CRUD + debounced content save | 🟠 |
| 10 | Server Actions: character/world/dictionary CRUD | 🟠 |
| 11 | Canon branch UI + `setCanon` action | 🟠 |
| 12 | `/books` — kullanıcının kendi kitapları (private + public) | 🟠 |
| 13 | Devam kitabı fork dialog | 🟡 |
| 14 | Book Stats cache güncelleme | 🟡 |
| 15 | Yazar profil sayfası + beğeni | 🟡 |
| 16 | Kitap kapağı yükleme (Supabase Storage) | 🟡 |
| 17 | Real-time, seri, yorum | 🟢 |
