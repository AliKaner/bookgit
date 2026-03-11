"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendInviteEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/utils";

// ─── Search Users ────────────────────────────────────────────────
export async function searchUsers(query: string) {
  if (!query || query.trim().length < 2) return { data: [] };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const search = `%${query.trim()}%`;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url, email")
    .or(`display_name.ilike.${search},email.ilike.${search},username.ilike.${search}`)
    .neq("id", user.id) // exclude self
    .limit(10);

  if (error) return { error: error.message };
  return { data: data ?? [] };
}

// ─── Invite Collaborator ─────────────────────────────────────────
export async function inviteCollaborator(
  bookId: string,
  opts: { userId?: string; email?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Verify caller is book owner
  const { data: book } = await supabase
    .from("books")
    .select("id, user_id, title")
    .eq("id", bookId)
    .eq("user_id", user.id)
    .single();

  if (!book) return { error: "Only the book owner can invite collaborators" };

  let targetUserId = opts.userId || null;
  let targetEmail = opts.email || null;

  // If inviting by email, check if there's an existing user with that email
  if (targetEmail && !targetUserId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", targetEmail)
      .single();

    if (profile) {
      targetUserId = profile.id;
    }
  }

  // If inviting by userId, get their email
  if (targetUserId && !targetEmail) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", targetUserId)
      .single();

    if (profile) {
      targetEmail = profile.email;
    }
  }

  // Can't invite yourself or the owner
  if (targetUserId === book.user_id) {
    return { error: "You cannot invite the book owner" };
  }

  // Check if they are already invited/accepted
  const { data: existingCollab } = await supabase
    .from("book_collaborators")
    .select("status")
    .eq("book_id", bookId)
    .or(targetUserId ? `user_id.eq.${targetUserId}` : `email.eq.${targetEmail}`)
    .in("status", ["pending", "accepted"])
    .single();

  if (existingCollab) {
    return { error: `User is already ${existingCollab.status}` };
  }

  // If there's a rejected invite, we can just delete it and re-invite, or just create a new one (since we don't have unique constraint on status, but we do have unique on user/book). 
  // Wait, we have UNIQUE(book_id, user_id). If they rejected, we should UPDATE the existing one to pending.
  const { data: rejectedCollab } = await supabase
    .from("book_collaborators")
    .select("id")
    .eq("book_id", bookId)
    .or(targetUserId ? `user_id.eq.${targetUserId}` : `email.eq.${targetEmail}`)
    .eq("status", "rejected")
    .single();

  if (rejectedCollab) {
    const { data: collab, error } = await supabase
      .from("book_collaborators")
      .update({ status: "pending", invited_by: user.id })
      .eq("id", rejectedCollab.id)
      .select()
      .single();
    if (error) return { error: error.message };

    const { data: inviter } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();

    if (targetUserId) {
      await supabase.from("notifications").insert({
        user_id: targetUserId,
        type: "collab_invite",
        title: "New Collaboration Invite",
        message: `${inviter?.display_name || 'Someone'} invited you to collaborate on "${book.title}"`,
        data: { inviteId: collab.id, bookId }
      });
    }

    // Send email invite
    if (targetEmail) {
      const siteUrl = getSiteUrl();
      await sendInviteEmail({
        to: targetEmail,
        inviterName: inviter?.display_name || 'Someone',
        bookTitle: book.title || 'A book',
        inviteId: collab.id,
        siteUrl
      }).catch(console.error);
    }

    revalidatePath("/books");
    return { success: true, collaborator: collab };
  }

  // Not rejected, so we just insert new
  const { data: collab, error } = await supabase
    .from("book_collaborators")
    .insert({
      book_id: bookId,
      user_id: targetUserId,
      email: targetEmail,
      role: "editor",
      status: "pending",
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "This user has already been invited" };
    }
    return { error: error.message };
  }

  const { data: inviter } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();

  if (targetUserId) {
    await supabase.from("notifications").insert({
      user_id: targetUserId,
      type: "collab_invite",
      title: "New Collaboration Invite",
      message: `${inviter?.display_name || 'Someone'} invited you to collaborate on "${book.title}"`,
      data: { inviteId: collab.id, bookId }
    });
  }

  // Send email invite
  if (targetEmail) {
    const siteUrl = getSiteUrl();
    await sendInviteEmail({
      to: targetEmail,
      inviterName: inviter?.display_name || 'Someone',
      bookTitle: book.title || 'A book',
      inviteId: collab.id,
      siteUrl
    }).catch(console.error);
  }

  revalidatePath("/books");
  return { success: true, collaborator: collab };
}

// ─── Get Book Collaborators ──────────────────────────────────────
export async function getBookCollaborators(bookId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("book_collaborators")
    .select(`
      *,
      profile:profiles!book_collaborators_user_id_fkey(id, display_name, username, avatar_url, email),
      inviter:profiles!book_collaborators_invited_by_fkey(display_name)
    `)
    .eq("book_id", bookId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  return { data: data ?? [] };
}

// ─── Respond to Invite ───────────────────────────────────────────
export async function respondToInvite(inviteId: string, accept: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("book_collaborators")
    .update({ status: accept ? "accepted" : "rejected" })
    .eq("id", inviteId)
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (error) return { error: error.message };

  revalidatePath("/books");
  revalidatePath("/editor");
  return { success: true };
}

// ─── Get My Pending Invites ──────────────────────────────────────
export async function getMyInvites() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  const { data, error } = await supabase
    .from("book_collaborators")
    .select(`
      *,
      book:books(id, title, cover_color, cover_image_url),
      inviter:profiles!book_collaborators_invited_by_fkey(display_name, avatar_url)
    `)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, data: [] };
  return { data: data ?? [] };
}

// ─── Remove Collaborator ─────────────────────────────────────────
export async function removeCollaborator(bookId: string, collaboratorId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Verify caller is book owner
  const { data: book } = await supabase
    .from("books")
    .select("user_id")
    .eq("id", bookId)
    .eq("user_id", user.id)
    .single();

  if (!book) return { error: "Only the book owner can remove collaborators" };

  const { error } = await supabase
    .from("book_collaborators")
    .delete()
    .eq("id", collaboratorId)
    .eq("book_id", bookId);

  if (error) return { error: error.message };

  revalidatePath("/books");
  return { success: true };
}

// ─── Get Collaborated Books ──────────────────────────────────────
export async function getCollaboratedBooks() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: collabs } = await supabase
    .from("book_collaborators")
    .select("book_id")
    .eq("user_id", user.id)
    .eq("status", "accepted");

  if (!collabs?.length) return [];

  const bookIds = collabs.map(c => c.book_id);

  const { data } = await supabase
    .from("books")
    .select(`
      *,
      genres:book_genres(genre:genres(*)),
      tags:book_tags(tag:tags(*)),
      stats:book_stats(*),
      profile:profiles(display_name, username, avatar_url),
      series:series(*)
    `)
    .in("id", bookIds)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return data ?? [];
}
