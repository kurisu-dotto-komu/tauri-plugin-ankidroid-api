# AnkiDroid API Notes

## Overview

AnkiDroid provides two main APIs for third-party applications to interact with its database:
1. **ContentProvider API** - Low-level, direct database access
2. **AddContentApi** - High-level, simplified interface

This document explains the capabilities and limitations of each approach, particularly as implemented in our Tauri plugin.

## ContentProvider API

### What It Is
The ContentProvider API is Android's standard mechanism for inter-app data sharing. AnkiDroid exposes certain database operations through ContentProvider URIs like:
- `content://com.ichi2.anki.flashcards/notes`
- `content://com.ichi2.anki.flashcards/models`
- `content://com.ichi2.anki.flashcards/decks`
- `content://com.ichi2.anki.flashcards/cards`

### Supported Operations

#### ✅ Fully Supported
- **Reading Notes** - Query existing notes with fields, tags, and metadata
- **Creating Notes** - Insert new notes with specified model, fields, and tags
- **Updating Notes** - Modify existing note fields and tags
- **Reading Models** - Query available note types and their field structures
- **Reading Decks** - List all available decks
- **Reading Cards** - Access card data including questions and answers

#### ⚠️ Partially Supported
- **Deleting Notes** - May not be fully supported depending on AnkiDroid version
- **Deck Assignment** - Creating notes in specific decks has limitations

#### ❌ Not Supported
- **Creating Models** - Cannot create new note types via ContentProvider
- **Updating Models** - Cannot modify existing note type structures
- **Deleting Models** - Cannot remove note types
- **Creating Decks** - Cannot create new decks programmatically
- **Template Management** - Cannot modify card templates

### Code Example
```kotlin
// Reading models (works)
val uri = Uri.parse("content://com.ichi2.anki.flashcards/models")
val cursor = contentResolver.query(uri, null, null, null, null)

// Creating models (does NOT work)
val values = ContentValues().apply {
    put("name", "My Model")
    put("field_names", "Front\u001FBack")
}
// This will fail - ContentProvider doesn't support model insertion
val result = contentResolver.insert(uri, values) // Returns null or throws
```

## AddContentApi

### What It Is
AddContentApi is a higher-level API provided by AnkiDroid as a separate library. It wraps the ContentProvider with additional functionality and simplified interfaces.

### Key Differences from ContentProvider
1. **Model Creation** - Can create custom models programmatically
2. **Bulk Operations** - Optimized for adding many notes at once
3. **Validation** - Built-in validation for fields and models
4. **Simplified Interface** - No need to work with ContentValues and Cursors directly

### How to Use AddContentApi
```java
// This would require adding AnkiDroid API as a dependency
final AddContentApi api = new AddContentApi(context);

// Check if API is available
if (api.getAnkiDroidPackageName(context) != null) {
    // Create a new model if needed
    long modelId = api.addNewCustomModel(
        "My Model",
        new String[]{"Front", "Back"},
        new String[]{"Card 1", "Card 2"},
        new String[][]{{"{{Front}}", "{{Back}}"}, {"{{Back}}", "{{Front}}"}}
    );
    
    // Add notes
    api.addNote(modelId, deckId, fields, tags);
}
```

## Why Our Plugin Uses ContentProvider

### Reasons
1. **Direct Integration** - Tauri plugins work best with Android's native ContentProvider pattern
2. **No Additional Dependencies** - ContentProvider is built into Android, no external libraries needed
3. **Sufficient for Most Operations** - Reading and basic CRUD on notes/cards covers most use cases
4. **Permission Model** - ContentProvider permissions integrate well with Android's permission system

### Limitations We Accept
- **No Model Creation** - Users must create models manually in AnkiDroid
- **No Deck Creation** - Users must create decks manually in AnkiDroid
- **Limited Template Control** - Cannot programmatically modify card templates

## Workarounds and Best Practices

### For Model Management
1. **Pre-create Models** - Have users create required models in AnkiDroid before using the app
2. **Model Detection** - Check for required models on startup and guide users if missing
3. **Use Basic Models** - Stick to AnkiDroid's built-in Basic, Cloze, etc. when possible

### For Our Implementation
```kotlin
// In our Kotlin plugin
@Command
fun createModel(invoke: Invoke) {
    // We attempt ContentProvider insertion knowing it will likely fail
    try {
        val resultUri = contentResolver.insert(uri, values)
        // Usually returns null or throws
    } catch (e: Exception) {
        // Provide helpful error message
        JSObject().apply {
            put("success", false)
            put("error", "Model creation not supported via ContentProvider. " +
                       "Please create models manually in AnkiDroid or use AddContentApi")
        }
    }
}
```

## Future Considerations

### Potential Improvements
1. **Hybrid Approach** - Use ContentProvider for reading, AddContentApi for complex operations
2. **Fallback Mechanism** - Detect capabilities and use best available API
3. **User Guidance** - Better in-app guidance for manual model/deck creation

### AnkiDroid Development
The AnkiDroid team may expand ContentProvider capabilities in future versions. Monitor:
- [AnkiDroid GitHub Issues](https://github.com/ankidroid/Anki-Android/issues)
- [API Documentation Updates](https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-API)

## References

- [AnkiDroid API Wiki](https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-API)
- [FlashCardsContract.kt](https://github.com/ankidroid/Anki-Android/blob/main/api/src/main/java/com/ichi2/anki/FlashCardsContract.kt)
- [AnkiDroid ContentProvider Source](https://github.com/ankidroid/Anki-Android/tree/main/AnkiDroid/src/main/java/com/ichi2/anki/provider)
- [AddContentApi Documentation](https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-API#using-the-api)