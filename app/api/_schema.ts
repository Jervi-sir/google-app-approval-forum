import { z } from "zod"

export const UuidSchema = z.string().uuid()

export const CreateCommentSchema = z.object({
  authorId: UuidSchema,               // your style (client-provided)
  content: z.string().trim().min(1).max(2000),
})

export const UpdateCommentSchema = z.object({
  authorId: UuidSchema,               // your style (client-provided)
  content: z.string().trim().min(1).max(2000),
})

export const ToggleActionSchema = z.object({
  userId: UuidSchema,                 // your style (client-provided)
})
