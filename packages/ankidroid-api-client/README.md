# AnkiDroid API Client

TypeScript client library for the Tauri AnkiDroid API plugin, providing typed access to AnkiDroid's content provider on Android devices.

## Installation

```bash
npm install ankidroid-api-client
```

## Usage

```typescript
import { isAnkiDroidAvailable, getNotes } from "ankidroid-api-client";

// Check if AnkiDroid is available
const status = await isAnkiDroidAvailable();
if (status.available) {
  console.log(`AnkiDroid version ${status.version} is available`);
  
  // Get notes from AnkiDroid
  const notes = await getNotes({ limit: 10 });
  console.log(`Found ${notes.length} notes`);
}
```

## API

### `isAnkiDroidAvailable()`

Returns the availability status of AnkiDroid:
- `installed`: Whether AnkiDroid app is installed
- `providerReachable`: Whether the content provider is accessible
- `available`: Combined availability (installed && providerReachable)
- `version`: AnkiDroid version string (if available)

### `getNotes(options?)`

Retrieves notes from AnkiDroid. Options:
- `limit`: Maximum number of notes to retrieve
- `offset`: Number of notes to skip

Returns an array of Note objects with:
- `id`: Note ID
- `deck_id`: Deck ID
- `model_id`: Model/Note Type ID
- `fields`: Array of field values
- `tags`: Array of tags
- `sfld`: Sort field value

## Platform Support

This library only works on Android devices with AnkiDroid installed. On non-Android platforms, `isAnkiDroidAvailable()` returns a "not available" status and `getNotes()` throws a `NotSupportedError`.