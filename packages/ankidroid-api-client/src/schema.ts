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
  deck_id: z.number().int(),
  model_id: z.number().int(),
  fields: z.array(z.string()),
  tags: z.array(z.string()),
  sfld: z.string(),
});