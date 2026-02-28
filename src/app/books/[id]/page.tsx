import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BookEditorPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Verify book access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: book } = await supabase
    .from("books")
    .select("id, user_id, title, visibility")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!book) redirect("/books");

  // Private books: only owner
  if (book.visibility === "private" && book.user_id !== user.id) {
    redirect("/books");
  }

  // Redirect to editor with book context in search params
  redirect(`/editor?bookId=${id}`);
}
