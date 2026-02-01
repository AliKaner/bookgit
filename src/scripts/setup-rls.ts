
import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('Enabling RLS on tables...');
    await sql`alter table public.profiles enable row level security`;
    await sql`alter table public.books enable row level security`;
    await sql`alter table public.chapters enable row level security`;

    console.log('Creating Policies for Profiles...');
    await sql`drop policy if exists "Public profiles are viewable by everyone" on public.profiles`;
    await sql`create policy "Public profiles are viewable by everyone" on public.profiles for select using (true)`;
    
    await sql`drop policy if exists "Users can update own profile" on public.profiles`;
    await sql`create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id)`;

    await sql`drop policy if exists "Users can insert their own profile" on public.profiles`;
    await sql`create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id)`;


    console.log('Creating Policies for Books...');
    // READ: Public books are visible to everyone. Private books visible to author.
    await sql`drop policy if exists "Books are viewable by everyone" on public.books`;
    await sql`drop policy if exists "Users can see their own books" on public.books`;
    await sql`drop policy if exists "Public books are viewable by everyone" on public.books`;
    
    await sql`create policy "Public books are viewable by everyone" on public.books for select using (is_public = true)`;
    await sql`create policy "Users can see their own books" on public.books for select using (auth.uid() = author_id)`;

    // INSERT: Authenticated users can create books.
    await sql`drop policy if exists "Users can create books" on public.books`;
    await sql`create policy "Users can create books" on public.books for insert with check (auth.uid() = author_id)`;

    // UPDATE: Only author can update.
    await sql`drop policy if exists "Users can update own books" on public.books`;
    await sql`create policy "Users can update own books" on public.books for update using (auth.uid() = author_id)`;


    console.log('Creating Policies for Chapters...');
    // READ: Visible if the book is visible (public or owned by viewer)
    // This requires a join or subquery, but RLS on Supabase supports efficient joins? 
    // Simplified: Public chapters (if book is public) or Own chapters.
    // Ideally we check book visibility. 
    // "exists (select 1 from books where books.id = chapters.book_id and (books.is_public = true or books.author_id = auth.uid()))"
    
    await sql`drop policy if exists "Chapters are viewable" on public.chapters`;
    await sql`create policy "Chapters are viewable" on public.chapters for select using (
      exists (
        select 1 from public.books 
        where books.id = chapters.book_id 
        and (books.is_public = true or books.author_id = auth.uid())
      )
    )`;

    // INSERT: Authenticated users can add chapters (create branches).
    // They become the author of the chapter.
    await sql`drop policy if exists "Users can insert chapters" on public.chapters`;
    await sql`create policy "Users can insert chapters" on public.chapters for insert with check (auth.uid() = author_id)`;

    // UPDATE: Only chapter author can update.
    await sql`drop policy if exists "Users can update own chapters" on public.chapters`;
    await sql`create policy "Users can update own chapters" on public.chapters for update using (auth.uid() = author_id)`;

    console.log('RLS Setup Completed!');
  } catch (err) {
    console.error('Error setting up RLS:', err);
  } finally {
    await sql.end();
  }
}

main();
