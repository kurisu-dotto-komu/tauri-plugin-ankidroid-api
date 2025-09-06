import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";
import { 
  StatusSchema, 
  NoteSchema, 
  PermissionSchema,
  CreateNoteRequestSchema,
  CreateNoteResponseSchema,
  UpdateNoteRequestSchema,
  UpdateNoteResponseSchema,
  DeleteNoteRequestSchema,
  DeleteNoteResponseSchema,
  CreateModelRequestSchema,
  CreateModelResponseSchema,
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
import { NotSupportedError } from "./errors";
import type { 
  AnkiDroidStatus, 
  Note, 
  GetNotesOptions, 
  PermissionStatus,
  Model,
  Deck,
  Card,
  CreateNoteRequest,
  CreateNoteResponse,
  UpdateNoteRequest,
  UpdateNoteResponse,
  DeleteNoteRequest,
  DeleteNoteResponse,
  CreateModelRequest,
  CreateModelResponse,
  CreateDeckRequest,
  CreateDeckResponse,
  GetCardsOptions,
  GetCardsResponse,
  GetModelsResponse,
  GetDecksResponse,
  UpdateCardRequest,
  UpdateCardResponse,
  ReviewCardRequest,
  ReviewCardResponse,
  MediaFile,
  AddMediaRequest,
  AddMediaResponse,
  GetMediaResponse
} from "./types";

export { NotSupportedError, AnkiDroidError } from "./errors";
export type { 
  AnkiDroidStatus, 
  Note, 
  GetNotesOptions, 
  PermissionStatus,
  Model,
  Deck,
  Card,
  CreateNoteRequest,
  CreateNoteResponse,
  UpdateNoteRequest,
  UpdateNoteResponse,
  DeleteNoteRequest,
  DeleteNoteResponse,
  CreateModelRequest,
  CreateModelResponse,
  CreateDeckRequest,
  CreateDeckResponse,
  GetCardsOptions,
  GetCardsResponse,
  GetModelsResponse,
  GetDecksResponse,
  UpdateCardRequest,
  UpdateCardResponse,
  ReviewCardRequest,
  ReviewCardResponse,
  MediaFile,
  AddMediaRequest,
  AddMediaResponse,
  GetMediaResponse
} from "./types";

function isAndroid(): boolean {
  return typeof navigator !== "undefined" && navigator.userAgent.includes("Android");
}

export async function checkPermission(): Promise<PermissionStatus> {
  // Remove Android check for testing - the plugin will handle platform detection
  try {
    const raw = await invoke("plugin:ankidroid-api|checkPermission");
    return PermissionSchema.parse(raw);
  } catch (error) {
    console.error("Error checking permission:", error);
    return {
      granted: false,
      permission: "com.ichi2.anki.permission.READ_WRITE_DATABASE",
    };
  }
}

export async function requestPermission(): Promise<PermissionStatus> {
  // Remove Android check for testing - the plugin will handle platform detection
  try {
    const raw = await invoke("plugin:ankidroid-api|requestPermission");
    return PermissionSchema.parse(raw);
  } catch (error) {
    throw new Error(`Failed to request permission: ${error}`);
  }
}

export async function isAnkiDroidAvailable(): Promise<AnkiDroidStatus> {
  // Remove Android check for testing - the plugin will handle platform detection
  console.log("isAnkiDroidAvailable: Starting check");
  console.log("User Agent:", typeof navigator !== "undefined" ? navigator.userAgent : "undefined");
  
  try {
    console.log("isAnkiDroidAvailable: Invoking plugin command");
    const raw = await invoke("plugin:ankidroid-api|isAnkiDroidAvailable");
    console.log("isAnkiDroidAvailable: Raw response:", raw);
    const parsed = StatusSchema.parse(raw);
    console.log("isAnkiDroidAvailable: Parsed status:", parsed);
    return parsed;
  } catch (error) {
    console.error("Error checking AnkiDroid availability:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      installed: false,
      hasPermission: false,
      providerReachable: false,
      available: false,
      version: null,
    };
  }
}

export async function getNotes(opts?: GetNotesOptions): Promise<Note[]> {
  // Remove Android check for testing - the plugin will handle platform detection
  try {
    const raw = await invoke("plugin:ankidroid-api|getNotes", { ...(opts ?? {}) });
    // The Kotlin plugin returns { notes: [...] }
    const response = raw as { notes?: unknown[] };
    return z.array(NoteSchema).parse(response.notes || []);
  } catch (error) {
    if (error instanceof NotSupportedError) {
      throw error;
    }
    
    // Better error message formatting
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error);
    } else {
      errorMessage = String(error);
    }
    
    throw new Error(`Failed to get notes: ${errorMessage}`);
  }
}

// Note CRUD operations
export async function createNote(
  request: CreateNoteRequest
): Promise<CreateNoteResponse> {
  try {
    const raw = await invoke("plugin:ankidroid-api|createNote", request);
    return CreateNoteResponseSchema.parse(raw);
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    throw new Error(`Failed to create note: ${errorMessage}`);
  }
}

export async function updateNote(
  request: UpdateNoteRequest
): Promise<UpdateNoteResponse> {
  try {
    const raw = await invoke("plugin:ankidroid-api|updateNote", request);
    return UpdateNoteResponseSchema.parse(raw);
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    throw new Error(`Failed to update note: ${errorMessage}`);
  }
}

export async function deleteNote(
  request: DeleteNoteRequest
): Promise<DeleteNoteResponse> {
  try {
    const raw = await invoke("plugin:ankidroid-api|deleteNote", request);
    return DeleteNoteResponseSchema.parse(raw);
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    throw new Error(`Failed to delete note: ${errorMessage}`);
  }
}

// Model operations
export async function getModels(): Promise<Model[]> {
  try {
    const raw = await invoke("plugin:ankidroid-api|getModels");
    const response = GetModelsResponseSchema.parse(raw);
    return response.models;
  } catch (error) {
    if (error instanceof NotSupportedError) {
      throw error;
    }
    
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    
    throw new Error(`Failed to get models: ${errorMessage}`);
  }
}

export async function createModel(
  request: CreateModelRequest
): Promise<CreateModelResponse> {
  try {
    const raw = await invoke("plugin:ankidroid-api|createModel", request);
    return CreateModelResponseSchema.parse(raw);
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    throw new Error(`Failed to create model: ${errorMessage}`);
  }
}

// Deck operations
export async function getDecks(): Promise<Deck[]> {
  try {
    const raw = await invoke("plugin:ankidroid-api|getDecks");
    const response = GetDecksResponseSchema.parse(raw);
    return response.decks;
  } catch (error) {
    if (error instanceof NotSupportedError) {
      throw error;
    }
    
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    
    throw new Error(`Failed to get decks: ${errorMessage}`);
  }
}

export async function createDeck(
  request: CreateDeckRequest
): Promise<CreateDeckResponse> {
  try {
    const raw = await invoke("plugin:ankidroid-api|createDeck", request);
    return CreateDeckResponseSchema.parse(raw);
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    throw new Error(`Failed to create deck: ${errorMessage}`);
  }
}

// Card operations
export async function getCards(opts?: GetCardsOptions): Promise<Card[]> {
  try {
    const raw = await invoke("plugin:ankidroid-api|getCards", { ...(opts ?? {}) });
    const response = GetCardsResponseSchema.parse(raw);
    return response.cards;
  } catch (error) {
    if (error instanceof NotSupportedError) {
      throw error;
    }
    
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    
    throw new Error(`Failed to get cards: ${errorMessage}`);
  }
}

export async function updateCard(
  request: UpdateCardRequest
): Promise<UpdateCardResponse> {
  try {
    const raw = await invoke("plugin:ankidroid-api|updateCard", request);
    return UpdateCardResponseSchema.parse(raw);
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    throw new Error(`Failed to update card: ${errorMessage}`);
  }
}

export async function reviewCard(
  request: ReviewCardRequest
): Promise<ReviewCardResponse> {
  try {
    const raw = await invoke("plugin:ankidroid-api|reviewCard", request);
    return ReviewCardResponseSchema.parse(raw);
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    throw new Error(`Failed to review card: ${errorMessage}`);
  }
}

// Media operations
export async function addMedia(
  request: AddMediaRequest
): Promise<AddMediaResponse> {
  try {
    const raw = await invoke("plugin:ankidroid-api|addMedia", request);
    return AddMediaResponseSchema.parse(raw);
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    throw new Error(`Failed to add media: ${errorMessage}`);
  }
}

export async function getMedia(): Promise<MediaFile[]> {
  try {
    const raw = await invoke("plugin:ankidroid-api|getMedia");
    const response = GetMediaResponseSchema.parse(raw);
    return response.mediaFiles;
  } catch (error) {
    if (error instanceof NotSupportedError) {
      throw error;
    }
    
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    
    throw new Error(`Failed to get media files: ${errorMessage}`);
  }
}