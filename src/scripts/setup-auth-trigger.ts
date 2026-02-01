
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
    console.log('Creating handle_new_user function...');
    // Note: We use public.profiles, ensuring it exists.
    await sql`
      create or replace function public.handle_new_user()
      returns trigger
      language plpgsql
      security definer set search_path = public
      as $$
      begin
        insert into public.profiles (id, username, full_name, avatar_url)
        values (
          new.id,
          new.raw_user_meta_data->>'username',
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'avatar_url'
        );
        return new;
      end;
      $$;
    `;

    console.log('Creating on_auth_user_created trigger...');
    // Drop first to allow re-running
    await sql`drop trigger if exists on_auth_user_created on auth.users`;
    await sql`
      create trigger on_auth_user_created
        after insert on auth.users
        for each row execute procedure public.handle_new_user();
    `;
    console.log('Trigger setup completed!');
  } catch (err) {
    console.error('Error setting up trigger:', err);
  } finally {
    await sql.end();
  }
}

main();
