import { pgTable, uuid, text, jsonb, boolean, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("role", ["owner", "contributor", "reader"]);
export const contributionStatusEnum = pgEnum("contribution_status", ["pending", "accepted", "rejected"]);

// Profiles (linked to auth.users)
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // References auth.users.id
  username: text("username").unique().notNull(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Books
export const books = pgTable("books", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  authorId: uuid("author_id").references(() => profiles.id).notNull(),
  coverUrl: text("cover_url"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chapters (Adjacency List)
export const chapters = pgTable("chapters", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id").references(() => books.id, { onDelete: 'cascade' }).notNull(),
  parentChapterId: uuid("parent_chapter_id"), // Self-reference defined below to avoid circular dependency issues in some versions
  authorId: uuid("author_id").references(() => profiles.id).notNull(),
  title: text("title").notNull(),
  content: jsonb("content").notNull(), // Using JSONB for rich text content
  isCanonical: boolean("is_canonical").default(false).notNull(),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Book Members
export const bookMembers = pgTable("book_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id").references(() => books.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  role: roleEnum("role").default("reader").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Contributions
export const contributions = pgTable("contributions", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id").references(() => books.id, { onDelete: 'cascade' }).notNull(),
  chapterId: uuid("chapter_id").references(() => chapters.id).notNull(), // The proposed chapter
  authorId: uuid("author_id").references(() => profiles.id).notNull(),
  status: contributionStatusEnum("status").default("pending").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});
