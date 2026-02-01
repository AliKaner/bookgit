-- Enable RLS on books table
alter table "books" enable row level security;

-- Allow public access to books
create policy "Public books are viewable by everyone"
on "books"
for select
to public
using (is_public = true);
