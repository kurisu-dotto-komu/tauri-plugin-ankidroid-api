import { z } from "zod";
import { StatusSchema, NoteSchema, PermissionSchema } from "./schema";

export type AnkiDroidStatus = z.infer<typeof StatusSchema>;
export type Note = z.infer<typeof NoteSchema>;
export type PermissionStatus = z.infer<typeof PermissionSchema>;

export interface GetNotesOptions {
  limit?: number;
  offset?: number;
}