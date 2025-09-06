import { z } from "zod";

export const StatusSchema = z.object({
  installed: z.boolean(),
  hasPermission: z.boolean(),
  providerReachable: z.boolean(),
  available: z.boolean(),
  version: z.string().nullable(),
});

export const PermissionSchema = z.object({
  granted: z.boolean(),
  permission: z.string(),
});

export const NoteSchema = z.object({
  id: z.number().int(),
  fields: z.array(z.string()),
  tags: z.array(z.string()),
  sfld: z.string(),
});

export const ModelSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  fieldNames: z.string(),
  numCards: z.number().int(),
});

export const DeckSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});

export const CardSchema = z.object({
  noteId: z.number().int(),
  ord: z.number().int(),
  deckId: z.number().int(),
  question: z.string(),
  answer: z.string(),
});

// Request schemas for CRUD operations
export const CreateNoteRequestSchema = z.object({
  modelId: z.number().int(),
  deckId: z.number().int().optional(),
  fields: z.array(z.string()),
  tags: z.array(z.string()).default([]),
});

export const CreateNoteResponseSchema = z.object({
  success: z.boolean(),
  noteId: z.number().int().optional(),
  error: z.string().optional(),
});

export const UpdateNoteRequestSchema = z.object({
  noteId: z.number().int(),
  fields: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateNoteResponseSchema = z.object({
  success: z.boolean(),
  rowsUpdated: z.number().int().optional(),
  error: z.string().optional(),
});

export const DeleteNoteRequestSchema = z.object({
  noteId: z.number().int(),
});

export const DeleteNoteResponseSchema = z.object({
  success: z.boolean(),
  rowsDeleted: z.number().int().optional(),
  error: z.string().optional(),
});

export const CreateModelRequestSchema = z.object({
  name: z.string(),
  fields: z.array(z.string()),
});

export const CreateModelResponseSchema = z.object({
  success: z.boolean(),
  modelId: z.number().int().optional(),
  error: z.string().optional(),
});

export const CreateDeckRequestSchema = z.object({
  name: z.string(),
});

export const CreateDeckResponseSchema = z.object({
  success: z.boolean(),
  deckId: z.number().int().optional(),
  error: z.string().optional(),
});

export const GetCardsRequestSchema = z.object({
  noteId: z.number().int().optional(),
});

export const GetCardsResponseSchema = z.object({
  cards: z.array(CardSchema),
});

export const GetModelsResponseSchema = z.object({
  models: z.array(ModelSchema),
});

export const GetDecksResponseSchema = z.object({
  decks: z.array(DeckSchema),
});

export const UpdateCardRequestSchema = z.object({
  noteId: z.number().int(),
  cardOrd: z.number().int(),
  deckId: z.number().int().optional(),
});

export const UpdateCardResponseSchema = z.object({
  success: z.boolean(),
  rowsUpdated: z.number().int().optional(),
  error: z.string().optional(),
});

export const ReviewCardRequestSchema = z.object({
  noteId: z.number().int(),
  cardOrd: z.number().int(),
  ease: z.number().int().min(1).max(4), // 1=Again, 2=Hard, 3=Good, 4=Easy
});

export const ReviewCardResponseSchema = z.object({
  success: z.boolean(),
  rowsUpdated: z.number().int().optional(),
  error: z.string().optional(),
});

// Media schemas
export const MediaFileSchema = z.object({
  filename: z.string(),
  size: z.number().optional(),
  lastModified: z.number().optional(),
  type: z.string().optional(),
});

export const AddMediaRequestSchema = z.object({
  filename: z.string(),
  data: z.string(), // Base64 encoded data
});

export const AddMediaResponseSchema = z.object({
  success: z.boolean(),
  filename: z.string().optional(),
  error: z.string().optional(),
});

export const GetMediaResponseSchema = z.object({
  mediaFiles: z.array(MediaFileSchema),
  message: z.string().optional(),
});