---
name: "AnkiDroid Full CRUD API Implementation - FlashCardsContract Integration"
---

## Goal

**Feature Goal**: Expand the existing AnkiDroid API to provide complete CRUD (Create, Read, Update, Delete) operations for all FlashCardsContract entities (Notes, Cards, Models/NoteTypes, Decks, ReviewInfo), integrating both ContentProvider and AddContentApi patterns, with comprehensive UI and end-to-end testing.

**Deliverable**: Full-featured AnkiDroid API plugin supporting:

- CREATE: Add notes, create models, create decks, add media
- READ: Query notes, cards, models, decks with filtering and pagination
- UPDATE: Modify note fields/tags, update cards, review operations
- DELETE: Remove notes/cards (where supported by AnkiDroid)
- UI components for all CRUD operations with proper error handling
- Comprehensive E2E test coverage

**Success Definition**: All CRUD operations work reliably with AnkiDroid, UI provides intuitive access to all features, tests pass consistently, API matches FlashCardsContract specification, and implementation follows existing codebase patterns.

## User Persona

**Target User**: Android app developers and power users who need programmatic access to AnkiDroid flashcard data

**Use Case**:

- Developers building complementary apps that integrate with AnkiDroid
- Advanced users creating custom flashcard management workflows
- Educational apps that need to interact with existing AnkiDroid collections
- Analytics tools for studying flashcard performance

**User Journey**:

1. Grant permission to access AnkiDroid data
2. Browse existing notes, decks, and models
3. Create new notes with proper field mapping
4. Update existing flashcards and their metadata
5. Perform study operations and review scheduling
6. Manage deck organization and model customization

**Pain Points Addressed**:

- Limited programmatic access to AnkiDroid features
- Lack of comprehensive CRUD operations in existing APIs
- No user-friendly interface for bulk operations
- Missing integration between ContentProvider and AddContentApi approaches

## Why

- **Comprehensive API Coverage**: Current implementation only covers basic read operations; full CRUD enables complete AnkiDroid integration
- **Developer Productivity**: Eliminates need for developers to implement complex AnkiDroid ContentProvider integration from scratch
- **Consistency with AnkiDroid**: Follows official FlashCardsContract specification and AddContentApi patterns
- **UI/UX Integration**: Provides working examples of how to build user-facing AnkiDroid integrations
- **Testing Foundation**: Establishes patterns for reliable AnkiDroid API testing across different scenarios

## What

Complete CRUD API implementation with UI covering all major AnkiDroid entities:

### Success Criteria

- [ ] **CREATE Operations**: Add notes, create decks, create models, add media files
- [ ] **READ Operations**: Query all entity types with filtering, pagination, and advanced search
- [ ] **UPDATE Operations**: Modify note fields/tags, update card scheduling, deck management
- [ ] **DELETE Operations**: Remove notes/cards where supported by AnkiDroid API
- [ ] **Permission Handling**: Robust permission management with proper error states
- [ ] **Error Handling**: Comprehensive error handling with user-friendly messages
- [ ] **UI Components**: Complete UI covering all CRUD operations with proper state management
- [ ] **E2E Testing**: Full test coverage for all operations including edge cases
- [ ] **Type Safety**: Complete TypeScript schemas for all API operations
- [ ] **Performance**: Efficient handling of bulk operations and large datasets

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

This PRP provides comprehensive context including existing code patterns, AnkiDroid API specifications, implementation examples, and detailed task breakdowns to enable successful implementation.

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-API
  why: Official AnkiDroid API documentation covering ContentProvider API and permission requirements
  critical: Permission handling patterns and API availability checking methods

- url: https://github.com/ankidroid/apisample
  why: Official AnkiDroid API sample implementation showing real-world usage patterns
  critical: Permission checking, CRUD operations, error handling, duplicate management examples

- url: https://github.com/ankidroid/apisample/blob/main/app/src/main/java/com/ichi2/apisample/AnkiDroidHelper.java
  why: Comprehensive helper class demonstrating practical ContentProvider usage
  critical: Best practices for deck/model management, duplicate removal, reference storage

- url: https://github.com/ankidroid/Anki-Android/blob/main/api/src/main/java/com/ichi2/anki/FlashCardsContract.kt
  why: Complete FlashCardsContract specification defining all URIs, constants, and column structures
  critical: URI patterns, column definitions, CRUD operation support for each entity type

- url: https://raw.githubusercontent.com/ankidroid/Anki-Android/refs/heads/main/api/src/main/java/com/ichi2/anki/api/AddContentApi.kt
  why: High-level AddContentApi class providing convenient methods for common operations
  critical: Note creation, model management, duplicate handling, media integration patterns

- file: /workspaces/tauri-plugin-ankidroid-api/packages/tauri-plugin-ankidroid-api/android/src/main/java/app/tauri/ankidroid/AnkiDroidApiPlugin.kt
  why: Current plugin implementation showing established patterns for Tauri commands
  pattern: @Command structure, async/coroutine usage, JSObject creation, error handling
  gotcha: Must use JSArray().put() instead of native Kotlin collections for Tauri compatibility

- file: /workspaces/tauri-plugin-ankidroid-api/packages/ankidroid-api-client/src/
  why: Client library showing TypeScript patterns for API integration
  pattern: Zod schema validation, error transformation, response parsing
  gotcha: Response objects must match between Kotlin plugin and TypeScript schemas

- file: /workspaces/tauri-plugin-ankidroid-api/packages/tauri-app/src/App.tsx
  why: UI patterns for integrating AnkiDroid API in React components
  pattern: State management, error display, conditional rendering based on permissions
  gotcha: Must handle permission states properly and provide fallback UI states

- file: /workspaces/tauri-plugin-ankidroid-api/packages/tauri-app/tests/e2e/
  why: E2E testing patterns for AnkiDroid API operations
  pattern: Playwright Android testing, async operation testing, UI interaction patterns
  gotcha: Page stability issues require proper error handling and screenshot debugging
```

### Current Codebase Tree

```bash
/workspaces/tauri-plugin-ankidroid-api/
├── FlashCardsContract.kt                    # API specification reference
├── packages/
│   ├── tauri-plugin-ankidroid-api/         # Core plugin implementation
│   │   ├── android/src/main/java/app/tauri/ankidroid/AnkiDroidApiPlugin.kt
│   │   ├── src/lib.rs                      # Rust plugin entry
│   │   └── Cargo.toml                      # Plugin dependencies
│   ├── ankidroid-api-client/               # TypeScript client library
│   │   ├── src/
│   │   │   ├── index.ts                    # Main API exports
│   │   │   ├── schema.ts                   # Zod validation schemas
│   │   │   ├── types.ts                    # TypeScript type definitions
│   │   │   └── errors.ts                   # Custom error classes
│   │   └── package.json                    # Client dependencies
│   └── tauri-app/                          # Demo application
│       ├── src/App.tsx                     # Main UI component
│       ├── tests/e2e/                      # End-to-end tests
│       └── src-tauri/                      # Tauri configuration
└── prp/                                    # PRP documentation
    ├── plans/                              # Implementation plans
    └── templates/                          # PRP templates
```

### Desired Codebase Tree with Files to be Added

```bash
# Kotlin Plugin Extensions (AnkiDroidApiPlugin.kt)
+ createNote(@Command)                       # Add new notes with field validation
+ updateNote(@Command)                       # Update existing note fields and tags
+ deleteNote(@Command)                       # Remove notes (if supported)
+ getModels(@Command)                        # Query available note types/models
+ createModel(@Command)                      # Create new note types
+ getDecks(@Command)                         # Query available decks
+ createDeck(@Command)                       # Create new decks
+ getCards(@Command)                         # Query cards with filters
+ updateCard(@Command)                       # Update card scheduling/deck assignment
+ reviewCard(@Command)                       # Perform review operations
+ addMedia(@Command)                         # Add media files to collection

# TypeScript Client Extensions (ankidroid-api-client/src/)
+ schema.ts                                  # Extended schemas for all entity types
+ types.ts                                   # Complete type definitions for CRUD operations
+ index.ts                                   # New API function exports

# UI Components (tauri-app/src/)
+ components/
│   ├── NoteManager.tsx                      # CRUD interface for notes
│   ├── DeckManager.tsx                      # Deck management interface
│   ├── ModelManager.tsx                     # Note type management
│   ├── CardBrowser.tsx                      # Card browsing and editing
│   └── MediaManager.tsx                     # Media file management
+ App.tsx                                    # Updated with new components

# E2E Tests (tauri-app/tests/e2e/)
+ ankidroid.spec.ts                          # Test AnkiDroid API operations
+ notes.spec.ts                              # Test note CRUD operations
+ decks.spec.ts                              # Test deck CRUD operations
+ models.spec.ts                             # Test model CRUD operations
+ cards.spec.ts                              # Test card CRUD operations
+ media.spec.ts                              # Test media CRUD operations
```

### Known Gotchas of our Codebase & Library Quirks

```kotlin
// CRITICAL: AnkiDroid ContentProvider requires specific permission handling
// Permission enforcement only on Android M+ for certain operations
// Must check permission before every database operation

// CRITICAL: Tauri JSObject/JSArray usage patterns
// Use JSArray().put(item) instead of native Kotlin collections
// Always wrap responses in JSObject for proper Tauri serialization

// CRITICAL: Field separator in note fields
// AnkiDroid uses '\u001F' character to separate fields in FLDS column
// Must split/join properly when parsing note fields

// CRITICAL: FlashCardsContract URI patterns
// Different URIs support different operations (some are read-only)
// Must use specific URI patterns for accessing cards: notes/{noteId}/cards/{ord}

// CRITICAL: Schema alignment between Kotlin and TypeScript
// Current TypeScript schema includes deck_id, model_id not in Kotlin implementation
// Must ensure response objects match schema definitions exactly

// CRITICAL: Android ContentResolver query patterns
// Must use .use { cursor -> } for proper cursor management
// ContentValues required for insert/update operations with specific column names

// CRITICAL: AnkiDroid version compatibility
// Different AnkiDroid versions have different API capabilities
// Must implement graceful degradation for unsupported operations
```

## Implementation Blueprint

### Data Models and Structure

Create comprehensive data models ensuring type safety and consistency across the entire stack.

```kotlin
// Kotlin data structures (in AnkiDroidApiPlugin.kt)
data class NoteRequest(
    val modelId: Long,
    val deckId: Long? = null,
    val fields: List<String>,
    val tags: List<String> = emptyList()
)

data class NoteResponse(
    val id: Long,
    val modelId: Long,
    val deckId: Long,
    val fields: List<String>,
    val tags: List<String>,
    val sfld: String
)

// Additional data classes for Models, Decks, Cards, ReviewInfo
```

```typescript
// TypeScript schemas (schema.ts)
export const NoteRequestSchema = z.object({
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

// Extended schemas for Models, Decks, Cards, ReviewInfo
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: EXTEND packages/tauri-plugin-ankidroid-api/android/src/main/java/app/tauri/ankidroid/AnkiDroidApiPlugin.kt
  - IMPLEMENT: createNote, updateNote, deleteNote @Command methods
  - FOLLOW pattern: existing getNotes method (async/coroutine usage, JSObject creation, error handling)
  - NAMING: createNote, updateNote, deleteNote (camelCase matching existing pattern)
  - PLACEMENT: Add after existing getNotes method
  - DEPENDENCIES: FlashCardsContract.kt URI and column definitions

Task 2: EXTEND packages/tauri-plugin-ankidroid-api/android/src/main/java/app/tauri/ankidroid/AnkiDroidApiPlugin.kt
  - IMPLEMENT: getModels, createModel, getDecks, createDeck @Command methods
  - FOLLOW pattern: existing command structure with ContentResolver queries
  - NAMING: Follow existing camelCase convention
  - DEPENDENCIES: Task 1 completion, FlashCardsContract Model and Deck specifications
  - PLACEMENT: Add after note operations

Task 3: EXTEND packages/tauri-plugin-ankidroid-api/android/src/main/java/app/tauri/ankidroid/AnkiDroidApiPlugin.kt
  - IMPLEMENT: getCards, updateCard, reviewCard @Command methods
  - FOLLOW pattern: existing async patterns with proper URI construction
  - NAMING: getCards, updateCard, reviewCard
  - DEPENDENCIES: Tasks 1-2 completion, Card and ReviewInfo URI patterns
  - PLACEMENT: Add after deck/model operations

Task 4: EXTEND packages/ankidroid-api-client/src/schema.ts
  - IMPLEMENT: Complete Zod schemas for all new entity types and operations
  - FOLLOW pattern: existing StatusSchema, NoteSchema structure
  - NAMING: {Entity}Schema, {Operation}{Entity}RequestSchema, {Operation}{Entity}ResponseSchema
  - DEPENDENCIES: Task 1-3 completion for matching Kotlin response structures
  - PLACEMENT: Add to existing schema.ts file

Task 5: EXTEND packages/ankidroid-api-client/src/types.ts
  - IMPLEMENT: TypeScript type definitions for all new schemas
  - FOLLOW pattern: existing type inference from schemas using z.infer
  - NAMING: Match schema names without "Schema" suffix
  - DEPENDENCIES: Task 4 completion
  - PLACEMENT: Add to existing types.ts file

Task 6: EXTEND packages/ankidroid-api-client/src/index.ts
  - IMPLEMENT: Client functions for all new CRUD operations
  - FOLLOW pattern: existing getNotes function structure (invoke, parsing, error handling)
  - NAMING: createNote, updateNote, deleteNote, getModels, etc.
  - DEPENDENCIES: Tasks 4-5 completion
  - PLACEMENT: Add after existing functions with proper exports

Task 7: CREATE packages/tauri-app/src/components/NoteManager.tsx
  - IMPLEMENT: Complete note CRUD interface with form handling
  - FOLLOW pattern: App.tsx state management and error handling approaches
  - NAMING: NoteManager component with proper React naming conventions
  - DEPENDENCIES: Task 6 completion
  - PLACEMENT: New components directory

Task 8: CREATE packages/tauri-app/src/components/DeckManager.tsx, ModelManager.tsx
  - IMPLEMENT: Deck and model management interfaces
  - FOLLOW pattern: NoteManager component structure and state management
  - NAMING: DeckManager, ModelManager components
  - DEPENDENCIES: Task 7 completion, deck/model API functions available
  - PLACEMENT: Same components directory

Task 9: MODIFY packages/tauri-app/src/App.tsx
  - INTEGRATE: New components with tab-based or section-based navigation
  - FOLLOW pattern: existing component integration and state management
  - PRESERVE: Existing functionality while adding new features
  - DEPENDENCIES: Tasks 7-8 completion
  - PLACEMENT: Update existing App.tsx with new component imports and usage

Task 10: CREATE packages/tauri-app/tests/e2e/create-operations.spec.ts
  - IMPLEMENT: E2E tests for all create operations
  - FOLLOW pattern: existing notes.spec.ts and ankidroid.spec.ts test structure
  - NAMING: test("should create note with proper fields"), etc.
  - DEPENDENCIES: Task 9 completion for UI elements to test
  - PLACEMENT: New test file in e2e directory

Task 11: CREATE packages/tauri-app/tests/e2e/update-operations.spec.ts, delete-operations.spec.ts
  - IMPLEMENT: E2E tests for update and delete operations
  - FOLLOW pattern: existing test patterns with proper async handling
  - NAMING: Descriptive test names following existing convention
  - DEPENDENCIES: Task 10 completion
  - PLACEMENT: Additional test files in e2e directory

Task 12: CREATE packages/tauri-app/tests/e2e/bulk-operations.spec.ts, error-scenarios.spec.ts
  - IMPLEMENT: Tests for bulk operations and comprehensive error scenarios
  - FOLLOW pattern: existing error handling and page stability patterns
  - NAMING: Follow existing test naming conventions
  - DEPENDENCIES: Task 11 completion
  - PLACEMENT: Complete e2e test suite
```

### Implementation Patterns & Key Details

```kotlin
// Command method pattern for CRUD operations
@Command
fun createNote(invoke: Invoke) {
    CoroutineScope(Dispatchers.Main).launch {
        try {
            val result = withContext(Dispatchers.IO) {
                // Parse request parameters
                val params = invoke.parseArgs(CreateNoteRequest::class.java)

                // PATTERN: Permission validation first
                if (!checkHasPermission()) {
                    throw Exception("Permission not granted")
                }

                // PATTERN: ContentProvider URI construction
                val uri = Uri.parse(NOTES_URI)
                val values = ContentValues().apply {
                    put(FlashCardsContract.Note.MID, params.modelId)
                    put(FlashCardsContract.Note.FLDS, params.fields.joinToString("\u001F"))
                    put(FlashCardsContract.Note.TAGS, params.tags.joinToString(" "))
                }

                // CRITICAL: Insert operation with proper error handling
                val resultUri = activity.contentResolver.insert(uri, values)
                val noteId = resultUri?.lastPathSegment?.toLong()

                // PATTERN: JSObject response construction
                JSObject().apply {
                    put("success", noteId != null)
                    put("noteId", noteId)
                }
            }
            invoke.resolve(result)
        } catch (e: Exception) {
            invoke.reject(e.message ?: "Failed to create note")
        }
    }
}

// Query pattern for reading operations
@Command
fun getModels(invoke: Invoke) {
    CoroutineScope(Dispatchers.Main).launch {
        try {
            val result = withContext(Dispatchers.IO) {
                val uri = Uri.parse("content://$AUTHORITY/models")
                val models = JSArray()

                activity.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                    while (cursor.moveToNext()) {
                        models.put(cursorToModel(cursor))
                    }
                }

                JSObject().apply {
                    put("models", models)
                }
            }
            invoke.resolve(result)
        } catch (e: Exception) {
            invoke.reject(e.message ?: "Failed to get models")
        }
    }
}
```

```typescript
// TypeScript client function pattern
export async function createNote(
  request: CreateNoteRequest
): Promise<CreateNoteResponse> {
  try {
    const raw = await invoke("plugin:ankidroid-api|createNote", request);
    return CreateNoteResponseSchema.parse(raw);
  } catch (error) {
    // PATTERN: Detailed error message formatting
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    throw new Error(`Failed to create note: ${errorMessage}`);
  }
}
```

```tsx
// React component pattern for CRUD operations
const NoteManager: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // PATTERN: Form handling with validation
  const handleCreateNote = async (formData: CreateNoteRequest) => {
    setLoading(true);
    setError("");
    try {
      const result = await createNote(formData);
      if (result.success) {
        // PATTERN: Optimistic UI update
        await refreshNotes();
      } else {
        setError(result.error || "Failed to create note");
      }
    } catch (error) {
      setError(`Error creating note: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <NoteForm
        onSubmit={handleCreateNote}
        models={models}
        disabled={loading}
      />
      <NoteList
        notes={notes}
        onUpdate={handleUpdateNote}
        onDelete={handleDeleteNote}
      />
      {error && <ErrorDisplay error={error} />}
    </div>
  );
};
```

### Integration Points

```yaml
ANKIDROID_CONTENTPROVIDER:
  - uri: "content://com.ichi2.anki.flashcards/notes"
  - operations: "insert, query, update (limited delete support)"
  - permissions: "com.ichi2.anki.permission.READ_WRITE_DATABASE"

TAURI_PLUGIN:
  - registration: "src-tauri/Cargo.toml dependencies and capabilities"
  - commands: "All @Command methods automatically registered"
  - permissions: "Android manifest and capabilities configuration"

CLIENT_LIBRARY:
  - build: "tsup build for dual CJS/ESM support"
  - exports: "package.json main/module/types fields"
  - validation: "Runtime Zod schema validation for all operations"

UI_INTEGRATION:
  - navigation: "Tab-based interface for different CRUD sections"
  - state: "React state management with error boundaries"
  - testing: "Playwright E2E tests covering all user workflows"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each Kotlin file modification - fix before proceeding
cd packages/tauri-plugin-ankidroid-api && cargo check
cd packages/tauri-app/src-tauri && cargo check

# TypeScript client validation
cd packages/ankidroid-api-client && npm run typecheck && npm run build

# Tauri app validation
cd packages/tauri-app && npm run typecheck

# Project-wide formatting and linting
npm run quickfix

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Android/Kotlin plugin compilation test
cd packages/tauri-app && npm run android:build

# TypeScript client build test
cd packages/ankidroid-api-client && npm run build && npm run test

# Tauri app build test
cd packages/tauri-app && npm run build

# Expected: All builds successful, client library tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
npm run test

# Manual validation - check AnkiDroid app for data consistency
emu screenshot  # Verify UI state

# Expected: All E2E tests pass, data consistent between API and AnkiDroid app
```

## Final Validation Checklist

### Technical Validation

- [ ] All 3 validation levels completed successfully
- [ ] All E2E tests pass: `npm run test`
- [ ] No TypeScript errors: `cd packages/ankidroid-api-client && npm run typecheck`
- [ ] No build errors: `cd packages/tauri-app && npm run build`
- [ ] Kotlin plugin compiles: `cd packages/tauri-app/src-tauri && cargo check`

### Feature Validation

- [ ] All CRUD operations work with real AnkiDroid data
- [ ] UI provides access to all implemented features
- [ ] Error scenarios handled gracefully with clear user messaging
- [ ] Permission flow works correctly on first use and after revocation
- [ ] Bulk operations handle large datasets efficiently
- [ ] Data consistency maintained between API and AnkiDroid app

### Code Quality Validation

- [ ] Follows existing Kotlin @Command patterns in AnkiDroidApiPlugin.kt
- [ ] Matches existing TypeScript client patterns in ankidroid-api-client
- [ ] UI components follow App.tsx state management approaches
- [ ] E2E tests follow existing test file structure and patterns
- [ ] All new APIs properly documented with inline comments
- [ ] Schema validation ensures type safety across Kotlin/TypeScript boundary

### Documentation & Deployment

- [ ] All new API functions include usage examples in comments
- [ ] README updated with new CRUD operation documentation
- [ ] Error handling documented for each operation type
- [ ] Breaking changes (if any) clearly documented with migration guide

---

## Anti-Patterns to Avoid

- ❌ Don't bypass permission checks for any ContentProvider operation
- ❌ Don't use native Kotlin collections in JSObject/JSArray contexts
- ❌ Don't ignore cursor resource management (always use .use { })
- ❌ Don't assume AnkiDroid API support without version checking
- ❌ Don't create operations without proper error handling and user feedback
- ❌ Don't modify AnkiDroid data without proper validation
- ❌ Don't skip E2E testing for UI workflows
- ❌ Don't hardcode deck/model IDs - always query dynamically
- ❌ Don't ignore schema validation errors in client code
- ❌ Don't implement bulk operations without performance considerations
