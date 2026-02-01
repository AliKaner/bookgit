
import { pgTable, uuid, text, boolean, jsonb, integer, timestamp, foreignKey, pgPolicy } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().notNull(), // Links to auth.users
  username: text('username').unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
})

export const books = pgTable('books', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  authorId: uuid('author_id').references(() => profiles.id).notNull(),
  isPublic: boolean('is_public').default(true).notNull(),
  originalBookId: uuid('original_book_id'), // Self-reference for forking
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return [
    foreignKey({
      columns: [table.originalBookId],
      foreignColumns: [table.id],
      name: 'books_original_book_id_fkey'
    }),
    pgPolicy("Public books are viewable by everyone", {
      for: "select",
      to: ["public"],
      using: sql`${table.isPublic} = true`,
    })
  ]
})

export const chapters = pgTable('chapters', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookId: uuid('book_id').references(() => books.id, { onDelete: 'cascade' }).notNull(),
  parentChapterId: uuid('parent_chapter_id'), // Self-reference
  authorId: uuid('author_id').references(() => profiles.id).notNull(), // Who wrote this branch/chapter
  title: text('title').notNull(),
  content: jsonb('content').notNull(),
  isCanonical: boolean('is_canonical').default(false).notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    parentChapterRef: foreignKey({
      columns: [table.parentChapterId],
      foreignColumns: [table.id],
      name: 'chapters_parent_chapter_id_fkey'
    })
  }
})
