import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  integer,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core"

/** enums */
export const roleEnum = pgEnum("role", ["user", "moderator", "admin"])
export const moderationStatusEnum = pgEnum("moderation_status", ["ok", "needs_fix", "hidden"])
export const reportTargetTypeEnum = pgEnum("report_target_type", ["post", "comment", "user"])
export const reportReasonEnum = pgEnum("report_reason", [
  "spam",
  "malware",
  "hate",
  "harassment",
  "copyright",
  "other",
])
export const reportStatusEnum = pgEnum("report_status", ["open", "reviewing", "resolved", "rejected"])
export const verificationStatusEnum = pgEnum("verification_status", ["pending", "approved", "rejected"])

/**
 * profiles
 * id references auth.users.id (UUID)
 */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(), // matches auth.users.id
    name: text("name"),
    email: text("email"), // optional mirror for convenience
    avatarUrl: text("avatar_url"),

    role: roleEnum("role").notNull().default("user"),
    isVerified: boolean("is_verified").notNull().default(false),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedById: uuid("verified_by_id"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index("profiles_email_idx").on(t.email),
    verifiedByIdx: index("profiles_verified_by_idx").on(t.verifiedById),
  })
)

/** posts */
export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id").notNull(), // references profiles.id

    title: varchar("title", { length: 160 }).notNull(),
    content: text("content").notNull(),

    playStoreUrl: text("play_store_url"),
    googleGroupUrl: text("google_group_url"),

    moderationStatus: moderationStatusEnum("moderation_status").notNull().default("ok"),

    isDeleted: boolean("is_deleted").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedById: uuid("deleted_by_id"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    authorIdx: index("posts_author_idx").on(t.authorId),
    moderationIdx: index("posts_moderation_idx").on(t.moderationStatus),
    createdIdx: index("posts_created_idx").on(t.createdAt),
  })
)

/** comments */
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id").notNull(),
    authorId: uuid("author_id").notNull(),

    content: text("content").notNull(),

    isDeleted: boolean("is_deleted").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedById: uuid("deleted_by_id"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    postIdx: index("comments_post_idx").on(t.postId),
    authorIdx: index("comments_author_idx").on(t.authorId),
  })
)

/** tags */
export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 48 }).notNull(),
    slug: varchar("slug", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugUniq: uniqueIndex("tags_slug_uniq").on(t.slug),
  })
)

/** post_tags (m2m) */
export const postTags = pgTable(
  "post_tags",
  {
    postId: uuid("post_id").notNull(),
    tagId: uuid("tag_id").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.tagId] }),
    postIdx: index("post_tags_post_idx").on(t.postId),
    tagIdx: index("post_tags_tag_idx").on(t.tagId),
  })
)

/** likes (one like per user per post) */
export const postLikes = pgTable(
  "post_likes",
  {
    postId: uuid("post_id").notNull(),
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.userId] }),
    userIdx: index("post_likes_user_idx").on(t.userId),
  })
)

/** saves (bookmarks) */
export const postSaves = pgTable(
  "post_saves",
  {
    postId: uuid("post_id").notNull(),
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.userId] }),
    userIdx: index("post_saves_user_idx").on(t.userId),
  })
)

/** reports */
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id").notNull(),

    targetType: reportTargetTypeEnum("target_type").notNull(),

    postId: uuid("post_id"),
    commentId: uuid("comment_id"),
    targetUserId: uuid("target_user_id"),

    reason: reportReasonEnum("reason").notNull(),
    message: text("message"),

    status: reportStatusEnum("status").notNull().default("open"),
    resolvedById: uuid("resolved_by_id"),
    resolutionNote: text("resolution_note"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("reports_status_idx").on(t.status),
    reporterIdx: index("reports_reporter_idx").on(t.reporterId),
    postIdx: index("reports_post_idx").on(t.postId),
    commentIdx: index("reports_comment_idx").on(t.commentId),
    targetUserIdx: index("reports_target_user_idx").on(t.targetUserId),
  })
)

/** verification requests */
export const verificationRequests = pgTable(
  "verification_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),

    playStoreDeveloperUrl: text("play_store_developer_url"),
    proofMessage: text("proof_message").notNull(),

    status: verificationStatusEnum("status").notNull().default("pending"),

    reviewedById: uuid("reviewed_by_id"),
    reviewNote: text("review_note"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("verification_requests_user_idx").on(t.userId),
    statusIdx: index("verification_requests_status_idx").on(t.status),
  })
)
