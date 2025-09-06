package app.tauri.ankidroid

import android.app.Activity
import android.content.ContentValues
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import app.tauri.annotation.Command
import app.tauri.annotation.Permission
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSArray
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

@TauriPlugin(
    permissions = [
        Permission(strings = ["com.ichi2.anki.permission.READ_WRITE_DATABASE"], alias = "ankidroid")
    ]
)
class AnkiDroidApiPlugin(private val activity: Activity) : Plugin(activity) {
    private var pendingPermissionInvoke: Invoke? = null
    
    companion object {
        const val PACKAGE = "com.ichi2.anki"
        const val AUTHORITY = "com.ichi2.anki.flashcards"
        const val NOTES_URI = "content://com.ichi2.anki.flashcards/notes"
        const val MODELS_URI = "content://com.ichi2.anki.flashcards/models"
        const val DECKS_URI = "content://com.ichi2.anki.flashcards/decks"
        const val ANKIDROID_PERMISSION = "com.ichi2.anki.permission.READ_WRITE_DATABASE"
        
        // FlashCardsContract column constants
        const val NOTE_ID = "_id"
        const val NOTE_MID = "mid"
        const val NOTE_FLDS = "flds"
        const val NOTE_TAGS = "tags"
        const val NOTE_SFLD = "sfld"
        const val NOTE_GUID = "guid"
        const val NOTE_MOD = "mod"
        
        const val MODEL_ID = "_id"
        const val MODEL_NAME = "name"
        const val MODEL_FIELD_NAMES = "field_names"
        const val MODEL_NUM_CARDS = "num_cards"
        
        const val DECK_ID = "deck_id"
        const val DECK_NAME = "deck_name"
        
        const val CARD_NOTE_ID = "note_id"
        const val CARD_ORD = "card_ord"
        const val CARD_NAME = "card_name"
        const val CARD_DECK_ID = "deck_id"
        const val CARD_QUESTION = "question"
        const val CARD_ANSWER = "answer"
        
        const val MEDIA_URI = "content://com.ichi2.anki.flashcards/media"
        const val MEDIA_FILENAME = "filename"
        const val MEDIA_DATA = "data"
    }

    @Command
    fun checkPermission(invoke: Invoke) {
        val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            ContextCompat.checkSelfPermission(activity, ANKIDROID_PERMISSION) == PackageManager.PERMISSION_GRANTED
        } else {
            true // Permissions granted at install time before Android 6.0
        }
        
        val result = JSObject().apply {
            put("granted", hasPermission)
            put("permission", ANKIDROID_PERMISSION)
        }
        invoke.resolve(result)
    }
    
    @Command
    fun requestPermission(invoke: Invoke) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val hasPermission = ContextCompat.checkSelfPermission(activity, ANKIDROID_PERMISSION) == PackageManager.PERMISSION_GRANTED
            
            if (hasPermission) {
                val result = JSObject().apply {
                    put("granted", true)
                    put("permission", ANKIDROID_PERMISSION)
                }
                invoke.resolve(result)
            } else {
                // Store the invoke to resolve later when permission result comes back
                pendingPermissionInvoke = invoke
                
                // Set up a permission result handler for the activity
                activity.runOnUiThread {
                    // Request the permission - this will open the Android permission dialog
                    ActivityCompat.requestPermissions(
                        activity,
                        arrayOf(ANKIDROID_PERMISSION),
                        1001
                    )
                }
                
                // Set up a handler to check permission status after user responds
                // Since we can't override onRequestPermissionsResult in Plugin, we'll poll
                android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                    checkPermissionAfterRequest()
                }, 500)
            }
        } else {
            val result = JSObject().apply {
                put("granted", true)
                put("permission", ANKIDROID_PERMISSION)
            }
            invoke.resolve(result)
        }
    }
    
    private fun checkPermissionAfterRequest() {
        val invoke = pendingPermissionInvoke ?: return
        
        // Check if permission was granted
        val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            ContextCompat.checkSelfPermission(activity, ANKIDROID_PERMISSION) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
        
        // If permission dialog is still showing, check again later
        if (!hasPermission && activity.hasWindowFocus()) {
            // Permission was definitely denied
            val result = JSObject().apply {
                put("granted", false)
                put("permission", ANKIDROID_PERMISSION)
                put("message", "Permission was denied by the user")
            }
            invoke.resolve(result)
            pendingPermissionInvoke = null
        } else if (hasPermission) {
            // Permission was granted
            val result = JSObject().apply {
                put("granted", true)
                put("permission", ANKIDROID_PERMISSION)
            }
            invoke.resolve(result)
            pendingPermissionInvoke = null
        } else {
            // Dialog might still be showing, check again
            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                checkPermissionAfterRequest()
            }, 500)
        }
    }

    @Command
    fun isAnkiDroidAvailable(invoke: Invoke) {
        CoroutineScope(Dispatchers.Main).launch {
            val result = withContext(Dispatchers.IO) {
                val installed = isPackageInstalled(PACKAGE)
                val hasPermission = checkHasPermission()
                val providerReachable = if (hasPermission) {
                    tryQuery(Uri.parse("content://$AUTHORITY/decks"))
                } else {
                    false
                }
                JSObject().apply {
                    put("installed", installed)
                    put("hasPermission", hasPermission)
                    put("providerReachable", providerReachable)
                    put("available", installed && hasPermission && providerReachable)
                    put("version", getPackageVersion(PACKAGE))
                }
            }
            invoke.resolve(result)
        }
    }

    @Command
    fun getNotes(invoke: Invoke) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    if (!checkHasPermission()) {
                        throw Exception("Permission not granted")
                    }
                    if (!tryQuery(Uri.parse("content://$AUTHORITY/decks"))) {
                        throw Exception("Provider not reachable")
                    }
                    val uri = Uri.parse(NOTES_URI)
                    // Start with basic columns that should exist
                    val projection = arrayOf("_id", "flds", "tags", "sfld")
                    val notes = JSArray()
                    activity.contentResolver.query(uri, projection, null, null, null)?.use { c ->
                        while (c.moveToNext()) {
                            notes.put(cursorToNote(c))
                        }
                    }
                    // Return the array wrapped in a JSObject for Tauri
                    JSObject().apply {
                        put("notes", notes)
                    }
                }
                invoke.resolve(result)
            } catch (e: Exception) {
                invoke.reject(e.message ?: "Failed to get notes")
            }
        }
    }

    @Command
    fun createNote(invoke: Invoke) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    // Permission validation first
                    if (!checkHasPermission()) {
                        throw Exception("Permission not granted")
                    }
                    
                    // For now, create a simple note with placeholder data
                    // This is a basic implementation - proper parameter parsing would need
                    // to be implemented based on Tauri's Kotlin plugin parameter system
                    val modelId = 1L // Default model
                    val fields = listOf("Test Field 1", "Test Field 2")
                    val tags = emptyList<String>()
                    val deckId: Long? = null
                    
                    // ContentProvider URI construction
                    val uri = Uri.parse(NOTES_URI)
                    val values = ContentValues().apply {
                        put(NOTE_MID, modelId)
                        put(NOTE_FLDS, fields.joinToString("\u001F"))
                        if (tags.isNotEmpty()) {
                            put(NOTE_TAGS, tags.joinToString(" "))
                        }
                        // Set deck ID if provided
                        deckId?.let { 
                            // Note: deck assignment might need to be done via card creation
                            // For now, we'll create the note and let AnkiDroid handle deck assignment
                        }
                    }
                    
                    // Insert operation with proper error handling
                    val resultUri = activity.contentResolver.insert(uri, values)
                    val noteId = resultUri?.lastPathSegment?.toLong()
                    
                    // JSObject response construction
                    JSObject().apply {
                        put("success", noteId != null)
                        if (noteId != null) {
                            put("noteId", noteId)
                        } else {
                            put("error", "Failed to create note")
                        }
                    }
                }
                invoke.resolve(result)
            } catch (e: Exception) {
                val errorResponse = JSObject().apply {
                    put("success", false)
                    put("error", e.message ?: "Failed to create note")
                }
                invoke.resolve(errorResponse)
            }
        }
    }

    @Command
    fun updateNote(invoke: Invoke) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    // Permission validation first
                    if (!checkHasPermission()) {
                        throw Exception("Permission not granted")
                    }
                    
                    // Placeholder implementation
                    val noteId = 1L // Default note ID
                    
                    val values = ContentValues()
                    
                    // Placeholder update - would need proper parameter parsing
                    values.put(NOTE_FLDS, "Updated Field 1\u001FUpdated Field 2")
                    values.put(NOTE_TAGS, "updated test")
                    
                    // Update operation
                    val uri = Uri.parse("$NOTES_URI/$noteId")
                    val rowsUpdated = activity.contentResolver.update(uri, values, null, null)
                    
                    JSObject().apply {
                        put("success", rowsUpdated > 0)
                        if (rowsUpdated > 0) {
                            put("rowsUpdated", rowsUpdated)
                        } else {
                            put("error", "No rows updated")
                        }
                    }
                }
                invoke.resolve(result)
            } catch (e: Exception) {
                val errorResponse = JSObject().apply {
                    put("success", false)
                    put("error", e.message ?: "Failed to update note")
                }
                invoke.resolve(errorResponse)
            }
        }
    }

    @Command
    fun deleteNote(invoke: Invoke) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    // Permission validation first
                    if (!checkHasPermission()) {
                        throw Exception("Permission not granted")
                    }
                    
                    // Placeholder implementation
                    val noteId = 1L // Default note ID
                    
                    // Delete operation - Note: AnkiDroid may not support direct note deletion
                    // This will attempt deletion but may need to handle graceful failure
                    val uri = Uri.parse("$NOTES_URI/$noteId")
                    val rowsDeleted = try {
                        activity.contentResolver.delete(uri, null, null)
                    } catch (e: Exception) {
                        // If direct deletion isn't supported, return a specific error
                        0
                    }
                    
                    JSObject().apply {
                        if (rowsDeleted > 0) {
                            put("success", true)
                            put("rowsDeleted", rowsDeleted)
                        } else {
                            put("success", false)
                            put("error", "Delete operation not supported or failed")
                        }
                    }
                }
                invoke.resolve(result)
            } catch (e: Exception) {
                val errorResponse = JSObject().apply {
                    put("success", false)
                    put("error", e.message ?: "Failed to delete note")
                }
                invoke.resolve(errorResponse)
            }
        }
    }

    @Command
    fun getModels(invoke: Invoke) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    if (!checkHasPermission()) {
                        throw Exception("Permission not granted")
                    }
                    if (!tryQuery(Uri.parse("content://$AUTHORITY/decks"))) {
                        throw Exception("Provider not reachable")
                    }
                    
                    val uri = Uri.parse(MODELS_URI)
                    val models = JSArray()
                    val cursor = activity.contentResolver.query(uri, null, null, null, null)
                    
                    if (cursor == null) {
                        throw Exception("Failed to query models - cursor is null")
                    }
                    
                    cursor.use { c ->
                        val count = c.count
                        android.util.Log.d("AnkiDroidAPI", "Found $count models")
                        
                        while (c.moveToNext()) {
                            val model = cursorToModel(c)
                            android.util.Log.d("AnkiDroidAPI", "Model: ${model.toString()}")
                            models.put(model)
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

    @Command
    fun createModel(invoke: Invoke) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    // Permission validation first
                    if (!checkHasPermission()) {
                        throw Exception("Permission not granted")
                    }
                    
                    // Placeholder implementation
                    val name = "Test Model"
                    val fields = listOf("Front", "Back")
                    
                    // Note: Direct model creation via ContentProvider may not be supported
                    // This is a placeholder implementation - AnkiDroid typically uses AddContentApi
                    JSObject().apply {
                        put("success", false)
                        put("error", "Model creation not supported via ContentProvider - use AddContentApi instead")
                    }
                }
                invoke.resolve(result)
            } catch (e: Exception) {
                val errorResponse = JSObject().apply {
                    put("success", false)
                    put("error", e.message ?: "Failed to create model")
                }
                invoke.resolve(errorResponse)
            }
        }
    }

    @Command
    fun getDecks(invoke: Invoke) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    if (!checkHasPermission()) {
                        throw Exception("Permission not granted")
                    }
                    if (!tryQuery(Uri.parse("content://$AUTHORITY/decks"))) {
                        throw Exception("Provider not reachable")
                    }
                    
                    val uri = Uri.parse(DECKS_URI)
                    val decks = JSArray()
                    activity.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                        while (cursor.moveToNext()) {
                            decks.put(cursorToDeck(cursor))
                        }
                    }
                    
                    JSObject().apply {
                        put("decks", decks)
                    }
                }
                invoke.resolve(result)
            } catch (e: Exception) {
                invoke.reject(e.message ?: "Failed to get decks")
            }
        }
    }

    @Command
    fun createDeck(invoke: Invoke) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    // Permission validation first
                    if (!checkHasPermission()) {
                        throw Exception("Permission not granted")
                    }
                    
                    // Placeholder implementation
                    val name = "Test Deck"
                    
                    // Note: Direct deck creation via ContentProvider may have limited support
                    // This is a basic implementation - AddContentApi is preferred for deck creation
                    JSObject().apply {
                        put("success", false)
                        put("error", "Deck creation not fully supported via ContentProvider - use AddContentApi instead")
                    }
                }
                invoke.resolve(result)
            } catch (e: Exception) {
                val errorResponse = JSObject().apply {
                    put("success", false)
                    put("error", e.message ?: "Failed to create deck")
                }
                invoke.resolve(errorResponse)
            }
        }
    }

    @Command
    fun getCards(invoke: Invoke) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    if (!checkHasPermission()) {
                        throw Exception("Permission not granted")
                    }
                    if (!tryQuery(Uri.parse("content://$AUTHORITY/decks"))) {
                        throw Exception("Provider not reachable")
                    }
                    
                    // Placeholder implementation 
                    val noteId: Long? = null // Get all cards or cards for specific note
                    
                    val uri = if (noteId != null && noteId > 0) {
                        // Get cards for a specific note
                        Uri.parse("$NOTES_URI/$noteId/cards")
                    } else {
                        // Get all cards - this may not be directly supported
                        Uri.parse("content://$AUTHORITY/notes")
                    }
                    
                    val cards = JSArray()
                    activity.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                        while (cursor.moveToNext()) {
                            if (noteId != null && noteId > 0) {
                                cards.put(cursorToCard(cursor))
                            } else {
                                // For general card queries, we'd need to iterate through notes and their cards
                                // This is a simplified implementation
                                cards.put(cursorToNote(cursor))
                            }
                        }
                    }
                    
                    JSObject().apply {
                        put("cards", cards)
                    }
                }
                invoke.resolve(result)
            } catch (e: Exception) {
                invoke.reject(e.message ?: "Failed to get cards")
            }
        }
    }

    @Command
    fun updateCard(invoke: Invoke) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    // Permission validation first
                    if (!checkHasPermission()) {
                        throw Exception("Permission not granted")
                    }
                    
                    // Placeholder implementation
                    val noteId = 1L // Default note ID
                    val cardOrd = 0 // Default card ordinal
                    val newDeckId = 1L // Default new deck ID
                    
                    // Card update operations are limited in AnkiDroid ContentProvider
                    // Main supported operation is moving cards between decks
                    if (newDeckId > 0) {
                        val uri = Uri.parse("$NOTES_URI/$noteId/cards/$cardOrd")
                        val values = ContentValues().apply {
                            put(CARD_DECK_ID, newDeckId)
                        }
                        
                        val rowsUpdated = activity.contentResolver.update(uri, values, null, null)
                        
                        JSObject().apply {
                            put("success", rowsUpdated > 0)
                            if (rowsUpdated > 0) {
                                put("rowsUpdated", rowsUpdated)
                            } else {
                                put("error", "No rows updated")
                            }
                        }
                    } else {
                        JSObject().apply {
                            put("success", false)
                            put("error", "Limited card update operations supported")
                        }
                    }
                }
                invoke.resolve(result)
            } catch (e: Exception) {
                val errorResponse = JSObject().apply {
                    put("success", false)
                    put("error", e.message ?: "Failed to update card")
                }
                invoke.resolve(errorResponse)
            }
        }
    }

    @Command
    fun reviewCard(invoke: Invoke) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    // Permission validation first
                    if (!checkHasPermission()) {
                        throw Exception("Permission not granted")
                    }
                    
                    // Placeholder implementation
                    val noteId = 1L // Default note ID
                    val cardOrd = 0 // Default card ordinal  
                    val ease = 3 // Default ease (Good)
                    
                    // Review operations use the schedule URI
                    val uri = Uri.parse("content://$AUTHORITY/schedule")
                    val values = ContentValues().apply {
                        put("note_id", noteId)
                        put("card_ord", cardOrd)
                        put("ease", ease)
                    }
                    
                    val rowsUpdated = activity.contentResolver.update(uri, values, null, null)
                    
                    JSObject().apply {
                        put("success", rowsUpdated > 0)
                        if (rowsUpdated > 0) {
                            put("rowsUpdated", rowsUpdated)
                        } else {
                            put("error", "Review operation failed")
                        }
                    }
                }
                invoke.resolve(result)
            } catch (e: Exception) {
                val errorResponse = JSObject().apply {
                    put("success", false)
                    put("error", e.message ?: "Failed to review card")
                }
                invoke.resolve(errorResponse)
            }
        }
    }

    @Command
    fun addMedia(invoke: Invoke) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    // Permission validation first
                    if (!checkHasPermission()) {
                        throw Exception("Permission not granted")
                    }
                    
                    // Placeholder implementation for media upload
                    val filename = "test-media.jpg" // Default filename
                    val mediaData = ByteArray(0) // Empty data for now
                    
                    // Note: Media upload via ContentProvider is complex and may require
                    // specific handling based on AnkiDroid's media storage implementation
                    JSObject().apply {
                        put("success", false)
                        put("error", "Media upload not fully implemented - requires AddContentApi integration")
                    }
                }
                invoke.resolve(result)
            } catch (e: Exception) {
                val errorResponse = JSObject().apply {
                    put("success", false)
                    put("error", e.message ?: "Failed to add media")
                }
                invoke.resolve(errorResponse)
            }
        }
    }

    @Command
    fun getMedia(invoke: Invoke) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    if (!checkHasPermission()) {
                        throw Exception("Permission not granted")
                    }
                    if (!tryQuery(Uri.parse("content://$AUTHORITY/decks"))) {
                        throw Exception("Provider not reachable")
                    }
                    
                    // Media listing is not typically available through ContentProvider
                    // This would require direct file system access or AddContentApi
                    val mediaFiles = JSArray()
                    
                    JSObject().apply {
                        put("mediaFiles", mediaFiles)
                        put("message", "Media listing requires direct file system access")
                    }
                }
                invoke.resolve(result)
            } catch (e: Exception) {
                invoke.reject(e.message ?: "Failed to get media files")
            }
        }
    }

    private fun cursorToCard(c: Cursor): JSObject {
        return JSObject().apply {
            put("noteId", c.getLong(c.getColumnIndexOrThrow(CARD_NOTE_ID)))
            put("ord", c.getInt(c.getColumnIndexOrThrow(CARD_ORD)))
            put("deckId", c.getLong(c.getColumnIndexOrThrow(CARD_DECK_ID)))
            put("question", c.getString(c.getColumnIndexOrThrow(CARD_QUESTION)) ?: "")
            put("answer", c.getString(c.getColumnIndexOrThrow(CARD_ANSWER)) ?: "")
        }
    }

    private fun cursorToModel(c: Cursor): JSObject {
        return JSObject().apply {
            put("id", c.getLong(c.getColumnIndexOrThrow(MODEL_ID)))
            put("name", c.getString(c.getColumnIndexOrThrow(MODEL_NAME)) ?: "")
            put("fieldNames", c.getString(c.getColumnIndexOrThrow(MODEL_FIELD_NAMES)) ?: "")
            put("numCards", c.getInt(c.getColumnIndexOrThrow(MODEL_NUM_CARDS)))
        }
    }

    private fun cursorToDeck(c: Cursor): JSObject {
        return JSObject().apply {
            put("id", c.getLong(c.getColumnIndexOrThrow(DECK_ID)))
            put("name", c.getString(c.getColumnIndexOrThrow(DECK_NAME)) ?: "")
        }
    }

    private fun cursorToNote(c: Cursor): JSObject {
        val flds = c.getString(1) ?: ""
        val tags = c.getString(2) ?: ""
        
        // Convert fields to JSArray
        val fieldsArray = JSArray()
        flds.split('\u001F').forEach { field ->
            fieldsArray.put(field)
        }
        
        // Convert tags to JSArray  
        val tagsArray = JSArray()
        tags.split(' ').filter { it.isNotBlank() }.forEach { tag ->
            tagsArray.put(tag)
        }
        
        return JSObject().apply {
            put("id", c.getLong(0))
            put("fields", fieldsArray)
            put("tags", tagsArray)
            put("sfld", c.getString(3) ?: "")
        }
    }

    private fun isPackageInstalled(name: String): Boolean = try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            activity.packageManager.getPackageInfo(name, android.content.pm.PackageManager.PackageInfoFlags.of(0))
        } else {
            @Suppress("DEPRECATION")
            activity.packageManager.getPackageInfo(name, 0)
        }
        true
    } catch (_: Exception) {
        false
    }

    private fun getPackageVersion(name: String): String? = try {
        val info = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            activity.packageManager.getPackageInfo(name, android.content.pm.PackageManager.PackageInfoFlags.of(0))
        } else {
            @Suppress("DEPRECATION")
            activity.packageManager.getPackageInfo(name, 0)
        }
        info.versionName
    } catch (_: Exception) {
        null
    }

    private fun checkHasPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            ContextCompat.checkSelfPermission(activity, ANKIDROID_PERMISSION) == PackageManager.PERMISSION_GRANTED
        } else {
            true // Permissions granted at install time before Android 6.0
        }
    }
    
    private fun tryQuery(uri: Uri): Boolean = try {
        activity.contentResolver.query(uri, arrayOf("_id"), null, null, null)?.use { true } ?: false
    } catch (_: Exception) {
        false
    }
}