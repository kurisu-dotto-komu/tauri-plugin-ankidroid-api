# AnkiDroid Schema Documentation

This document provides comprehensive documentation of the AnkiDroid database schema, content provider API, and field relationships for building applications that interact with AnkiDroid.

## Database Overview

AnkiDroid uses a single SQLite database (`.anki2` extension) to store all flashcard data including decks, notes, cards, templates, and review history. The database is designed for spaced repetition learning with detailed tracking of user progress.

## Core Concepts

- **Notes**: Raw information/facts that can be formatted into multiple cards
- **Cards**: Individual review items generated from notes based on templates
- **Decks**: Collections of cards organized for study
- **Models**: Define the structure of notes (fields and card templates)
- **Templates**: Define how notes are formatted into cards for review

## Content Provider API

### Base URI
```
content://com.ichi2.anki.flashcards
```

### Permission Required
```
com.ichi2.anki.permission.READ_WRITE_DATABASE
```

## Notes Table Schema

Notes contain the raw information that gets formatted into cards for review.

### Content URI
```
content://com.ichi2.anki.flashcards/notes
content://com.ichi2.anki.flashcards/notes_v2
```

### Core Fields

| Field | Type | Description | Content Provider Column |
|-------|------|-------------|------------------------|
| `_id` | INTEGER PRIMARY KEY | Unique note ID (epoch milliseconds) | `FlashCardsContract.Note._ID` |
| `guid` | TEXT NOT NULL | Globally unique identifier for syncing | `FlashCardsContract.Note.GUID` |
| `mid` | INTEGER NOT NULL | Model ID (defines note structure) | `FlashCardsContract.Note.MID` |
| `mod` | INTEGER NOT NULL | Modification timestamp (epoch seconds) | `FlashCardsContract.Note.MOD` |
| `usn` | INTEGER NOT NULL | Update sequence number (for syncing) | `FlashCardsContract.Note.USN` |
| `tags` | TEXT NOT NULL | Space-separated string of tags | `FlashCardsContract.Note.TAGS` |
| `flds` | TEXT NOT NULL | Field values separated by `\x1F` (ASCII 31) | `FlashCardsContract.Note.FLDS` |
| `sfld` | TEXT NOT NULL | Sort field (first field, for sorting) | `FlashCardsContract.Note.SFLD` |
| `csum` | INTEGER NOT NULL | Checksum of first field | `FlashCardsContract.Note.CSUM` |
| `flags` | INTEGER NOT NULL | Bitwise flags | `FlashCardsContract.Note.FLAGS` |
| `data` | TEXT NOT NULL | Reserved for future use (empty string) | `FlashCardsContract.Note.DATA` |

### Field Parsing

**Tags**: Split on space character to get array of tags
```kotlin
val tags = tagsString.split(' ').filter { it.isNotBlank() }
```

**Fields**: Split on ASCII character 31 (Unit Separator) to get field array
```kotlin
val fields = fldsString.split('\u001F')
```

### SQL Example
```sql
SELECT _id, guid, mid, mod, tags, flds, sfld 
FROM notes 
WHERE tags LIKE '%important%' 
ORDER BY mod DESC 
LIMIT 50
```

## Cards Table Schema

Cards are the individual review items generated from notes based on templates.

### Content URI
```
content://com.ichi2.anki.flashcards/cards
```

### Core Fields

| Field | Type | Description | Content Provider Column |
|-------|------|-------------|------------------------|
| `id` | INTEGER PRIMARY KEY | Unique card ID (epoch milliseconds) | `FlashCardsContract.Card.ID` |
| `nid` | INTEGER NOT NULL | Note ID (foreign key to notes) | `FlashCardsContract.Card.NOTE_ID` |
| `did` | INTEGER NOT NULL | Deck ID | `FlashCardsContract.Card.DECK_ID` |
| `ord` | INTEGER NOT NULL | Template ordinal/index | `FlashCardsContract.Card.CARD_ORD` |
| `mod` | INTEGER NOT NULL | Modification timestamp | `FlashCardsContract.Card.MOD` |
| `usn` | INTEGER NOT NULL | Update sequence number | `FlashCardsContract.Card.USN` |
| `type` | INTEGER NOT NULL | Card state (0=new, 1=learning, 2=review, 3=relearning) | `FlashCardsContract.Card.TYPE` |
| `queue` | INTEGER NOT NULL | Scheduling queue (-3=buried, -2=suspended, -1=user_buried, 0=new, 1=learning, 2=review, 3=day_learning, 4=preview) | `FlashCardsContract.Card.QUEUE` |
| `due` | INTEGER NOT NULL | Due date/time | `FlashCardsContract.Card.DUE` |
| `ivl` | INTEGER NOT NULL | Interval between reviews (days) | `FlashCardsContract.Card.INTERVAL` |
| `factor` | INTEGER NOT NULL | Ease factor (multiplied by 1000) | `FlashCardsContract.Card.FACTOR` |
| `reps` | INTEGER NOT NULL | Number of reviews | `FlashCardsContract.Card.REPS` |
| `lapses` | INTEGER NOT NULL | Number of lapses/failures | `FlashCardsContract.Card.LAPSES` |
| `left` | INTEGER NOT NULL | Reps left until graduation | `FlashCardsContract.Card.LEFT` |
| `odue` | INTEGER NOT NULL | Original due date (for filtered decks) | `FlashCardsContract.Card.ORIGINAL_DUE` |
| `odid` | INTEGER NOT NULL | Original deck ID (for filtered decks) | `FlashCardsContract.Card.ORIGINAL_DECK_ID` |
| `flags` | INTEGER NOT NULL | Bitwise flags | `FlashCardsContract.Card.FLAGS` |
| `data` | TEXT NOT NULL | Additional data (JSON) | `FlashCardsContract.Card.DATA` |

### Card States
- **Type 0 (New)**: Never studied
- **Type 1 (Learning)**: Currently being learned
- **Type 2 (Review)**: Being reviewed at intervals
- **Type 3 (Relearning)**: Failed and being relearned

### SQL Example
```sql
SELECT c.id, c.nid, c.did, c.ord, c.type, c.queue, c.due, c.ivl, n.flds 
FROM cards c 
JOIN notes n ON c.nid = n.id 
WHERE c.did = ? AND c.queue = 2 
ORDER BY c.due ASC
```

## Decks Schema

Decks organize cards into study groups with specific configurations.

### Content URI
```
content://com.ichi2.anki.flashcards/decks
content://com.ichi2.anki.flashcards/selected_deck
```

### Core Fields

| Field | Type | Description | Content Provider Column |
|-------|------|-------------|------------------------|
| `deck_id` | INTEGER | Unique deck ID | `FlashCardsContract.Deck.DECK_ID` |
| `deck_name` | TEXT | Deck name/path | `FlashCardsContract.Deck.DECK_NAME` |
| `deck_counts` | TEXT | JSON with new/learning/review counts | `FlashCardsContract.Deck.DECK_COUNTS` |
| `deck_options` | TEXT | JSON configuration object | `FlashCardsContract.Deck.OPTIONS` |

### Deck Counts JSON Structure
```json
{
  "new": 10,
  "learning": 5,
  "review": 25
}
```

## Models (Note Types) Schema

Models define the structure of notes, including fields and card templates.

### Content URI
```
content://com.ichi2.anki.flashcards/models
```

### Core Fields

| Field | Type | Description | Content Provider Column |
|-------|------|-------------|------------------------|
| `model_id` | INTEGER | Unique model ID | `FlashCardsContract.Model.MODEL_ID` |
| `model_name` | TEXT | Model name | `FlashCardsContract.Model.MODEL_NAME` |
| `field_names` | TEXT | JSON array of field names | `FlashCardsContract.Model.FIELD_NAMES` |
| `num_cards` | INTEGER | Number of card templates | `FlashCardsContract.Model.NUM_CARDS` |

### Field Names JSON Structure
```json
["Front", "Back", "Extra Info"]
```

## Card Templates Schema

Templates define how notes are formatted into cards.

### Content URI
```
content://com.ichi2.anki.flashcards/models/{model_id}/templates
```

### Core Fields

| Field | Type | Description | Content Provider Column |
|-------|------|-------------|------------------------|
| `ord` | INTEGER | Template ordinal/index | `FlashCardsContract.CardTemplate.ORD` |
| `name` | TEXT | Template name (e.g., "Card 1") | `FlashCardsContract.CardTemplate.NAME` |
| `question_format` | TEXT | HTML template for question side | `FlashCardsContract.CardTemplate.QUESTION_FORMAT` |
| `answer_format` | TEXT | HTML template for answer side | `FlashCardsContract.CardTemplate.ANSWER_FORMAT` |
| `browser_question_format` | TEXT | Alternative template for browser | `FlashCardsContract.CardTemplate.BROWSER_QUESTION_FORMAT` |
| `browser_answer_format` | TEXT | Alternative template for browser | `FlashCardsContract.CardTemplate.BROWSER_ANSWER_FORMAT` |

## Review Log Schema

Comprehensive history of all review sessions.

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Unique log entry ID |
| `cid` | INTEGER NOT NULL | Card ID |
| `usn` | INTEGER NOT NULL | Update sequence number |
| `ease` | INTEGER NOT NULL | Button pressed (1=again, 2=hard, 3=good, 4=easy) |
| `ivl` | INTEGER NOT NULL | New interval after review |
| `lastIvl` | INTEGER NOT NULL | Previous interval |
| `factor` | INTEGER NOT NULL | New ease factor |
| `time` | INTEGER NOT NULL | Time taken to review (milliseconds) |
| `type` | INTEGER NOT NULL | Review type (0=learn, 1=review, 2=relearn, 3=cram) |

## Collection Schema

Global collection settings and metadata.

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Always 1 (single row) |
| `crt` | INTEGER NOT NULL | Collection creation timestamp |
| `mod` | INTEGER NOT NULL | Last modification timestamp |
| `scm` | INTEGER NOT NULL | Schema modification time |
| `ver` | INTEGER NOT NULL | Version number |
| `dty` | INTEGER NOT NULL | Dirty flag (needs sync) |
| `usn` | INTEGER NOT NULL | Update sequence number |
| `ls` | INTEGER NOT NULL | Last sync time |
| `conf` | TEXT NOT NULL | JSON configuration object |
| `models` | TEXT NOT NULL | JSON object of all models |
| `decks` | TEXT NOT NULL | JSON object of all decks |
| `dconf` | TEXT NOT NULL | JSON object of deck configurations |
| `tags` | TEXT NOT NULL | JSON object of tags |

## Relationships and Joins

### Note → Cards (One to Many)
```sql
SELECT n.flds, c.ord, c.type, c.queue 
FROM notes n 
JOIN cards c ON n.id = c.nid 
WHERE n.id = ?
```

### Card → Note (Many to One)
```sql
SELECT c.id, c.ord, c.due, n.flds, n.tags 
FROM cards c 
JOIN notes n ON c.nid = n.id 
WHERE c.id = ?
```

### Deck Cards with Note Info
```sql
SELECT c.id, c.ord, c.type, c.due, n.flds, n.tags, n.sfld 
FROM cards c 
JOIN notes n ON c.nid = n.id 
WHERE c.did = ? AND c.queue IN (0, 1, 2)
ORDER BY c.due ASC
```

## Common Query Patterns

### Get All Notes in a Deck
```sql
SELECT DISTINCT n.id, n.flds, n.tags, n.sfld 
FROM notes n 
JOIN cards c ON n.id = c.nid 
WHERE c.did = ?
```

### Get Due Cards for Review
```sql
SELECT c.id, c.nid, c.ord, c.due, n.flds 
FROM cards c 
JOIN notes n ON c.nid = n.id 
WHERE c.queue = 2 AND c.due <= ? 
ORDER BY c.due ASC
```

### Get New Cards to Learn
```sql
SELECT c.id, c.nid, c.ord, n.flds 
FROM cards c 
JOIN notes n ON c.nid = n.id 
WHERE c.queue = 0 AND c.did = ?
ORDER BY c.ord ASC
LIMIT ?
```

### Search Notes by Tags
```sql
SELECT id, flds, tags, sfld 
FROM notes 
WHERE tags LIKE '%' || ? || '%'
```

### Get Learning Cards
```sql
SELECT c.id, c.nid, c.ord, c.due, n.flds 
FROM cards c 
JOIN notes n ON c.nid = n.id 
WHERE c.queue IN (1, 3) AND c.due <= ?
ORDER BY c.due ASC
```

## Data Types and Validation

### Timestamps
- Creation times (`id`, `crt`): Epoch milliseconds
- Modification times (`mod`): Epoch seconds
- Due dates: Days since collection creation for review cards, epoch seconds for learning cards

### Text Encoding
- All text fields are UTF-8 encoded
- Field separator in `flds`: ASCII 31 (`\x1F`)
- Tag separator in `tags`: Space character (` `)

### Numeric Ranges
- Ease factor: Typically 1300-2500 (multiplied by 1000)
- Intervals: 1-36500 days typically
- Queue values: -3 to 4 (see card queue documentation above)

## API Usage Examples

### Query Notes
```kotlin
val uri = Uri.parse("content://com.ichi2.anki.flashcards/notes")
val projection = arrayOf("_id", "flds", "tags", "sfld")
val cursor = contentResolver.query(uri, projection, null, null, null)
```

### Query Cards in Deck
```kotlin
val uri = Uri.parse("content://com.ichi2.anki.flashcards/cards")
val projection = arrayOf("id", "nid", "ord", "type", "queue", "due")
val selection = "did = ?"
val selectionArgs = arrayOf(deckId.toString())
val cursor = contentResolver.query(uri, projection, selection, selectionArgs, "due ASC")
```

### Get Model Information
```kotlin
val uri = Uri.parse("content://com.ichi2.anki.flashcards/models")
val projection = arrayOf("model_id", "model_name", "field_names")
val cursor = contentResolver.query(uri, projection, null, null, null)
```

## Performance Considerations

- Use appropriate indexes for queries (nid, did, queue, due, tags)
- Limit result sets for large collections
- Consider using ContentProvider batch operations for bulk updates
- Cache model and deck information as it changes infrequently
- Use projection to limit returned columns
- Consider pagination for large result sets

## Security and Permissions

- Requires `com.ichi2.anki.permission.READ_WRITE_DATABASE` permission
- Content provider enforces read/write permissions per URI
- Validate all input data when writing to prevent database corruption
- Be cautious with direct SQL queries to prevent injection attacks

## Version Compatibility

- Schema version tracking through `col.scm` field
- Content provider API maintains backward compatibility
- Always check AnkiDroid version when using advanced features
- Test with multiple AnkiDroid versions in production

## References

- [AnkiDroid Database Structure](https://github.com/ankidroid/Anki-Android/wiki/Database-Structure)
- [AnkiDroid API Documentation](https://github.com/ankidroid/Anki-Android/wiki/AnkiDroid-API)
- [FlashCardsContract Source](https://github.com/ankidroid/Anki-Android/blob/main/api/src/main/java/com/ichi2/anki/FlashCardsContract.kt)
- [Anki Database Schema](https://gist.github.com/sartak/3921255)