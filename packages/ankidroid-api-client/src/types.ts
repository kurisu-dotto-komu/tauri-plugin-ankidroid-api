import { z } from "zod";
import { 
  StatusSchema, 
  NoteSchema, 
  PermissionSchema,
  ModelSchema,
  DeckSchema,
  CardSchema,
  CreateNoteRequestSchema,
  CreateNoteResponseSchema,
  UpdateNoteRequestSchema,
  UpdateNoteResponseSchema,
  DeleteNoteRequestSchema,
  DeleteNoteResponseSchema,
  CreateModelRequestSchema,
  CreateModelResponseSchema,
  DeleteModelRequestSchema,
  DeleteModelResponseSchema,
  CreateDeckRequestSchema,
  CreateDeckResponseSchema,
  GetCardsRequestSchema,
  GetCardsResponseSchema,
  GetModelsResponseSchema,
  GetDecksResponseSchema,
  UpdateCardRequestSchema,
  UpdateCardResponseSchema,
  ReviewCardRequestSchema,
  ReviewCardResponseSchema,
  MediaFileSchema,
  AddMediaRequestSchema,
  AddMediaResponseSchema,
  GetMediaResponseSchema
} from "./schema";

// Base types
export type AnkiDroidStatus = z.infer<typeof StatusSchema>;
export type Note = z.infer<typeof NoteSchema>;
export type PermissionStatus = z.infer<typeof PermissionSchema>;
export type Model = z.infer<typeof ModelSchema>;
export type Deck = z.infer<typeof DeckSchema>;
export type Card = z.infer<typeof CardSchema>;

// Request/Response types for CRUD operations
export type CreateNoteRequest = z.infer<typeof CreateNoteRequestSchema>;
export type CreateNoteResponse = z.infer<typeof CreateNoteResponseSchema>;
export type UpdateNoteRequest = z.infer<typeof UpdateNoteRequestSchema>;
export type UpdateNoteResponse = z.infer<typeof UpdateNoteResponseSchema>;
export type DeleteNoteRequest = z.infer<typeof DeleteNoteRequestSchema>;
export type DeleteNoteResponse = z.infer<typeof DeleteNoteResponseSchema>;

export type CreateModelRequest = z.infer<typeof CreateModelRequestSchema>;
export type CreateModelResponse = z.infer<typeof CreateModelResponseSchema>;
export type DeleteModelRequest = z.infer<typeof DeleteModelRequestSchema>;
export type DeleteModelResponse = z.infer<typeof DeleteModelResponseSchema>;
export type CreateDeckRequest = z.infer<typeof CreateDeckRequestSchema>;
export type CreateDeckResponse = z.infer<typeof CreateDeckResponseSchema>;

export type GetCardsRequest = z.infer<typeof GetCardsRequestSchema>;
export type GetCardsResponse = z.infer<typeof GetCardsResponseSchema>;
export type GetModelsResponse = z.infer<typeof GetModelsResponseSchema>;
export type GetDecksResponse = z.infer<typeof GetDecksResponseSchema>;

export type UpdateCardRequest = z.infer<typeof UpdateCardRequestSchema>;
export type UpdateCardResponse = z.infer<typeof UpdateCardResponseSchema>;
export type ReviewCardRequest = z.infer<typeof ReviewCardRequestSchema>;
export type ReviewCardResponse = z.infer<typeof ReviewCardResponseSchema>;

export type MediaFile = z.infer<typeof MediaFileSchema>;
export type AddMediaRequest = z.infer<typeof AddMediaRequestSchema>;
export type AddMediaResponse = z.infer<typeof AddMediaResponseSchema>;
export type GetMediaResponse = z.infer<typeof GetMediaResponseSchema>;

// Options interfaces
export interface GetNotesOptions {
  limit?: number;
  offset?: number;
}

export interface GetCardsOptions {
  noteId?: number;
}