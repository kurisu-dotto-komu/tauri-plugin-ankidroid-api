package app.tauri.ankidroid

import android.app.Activity
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

@TauriPlugin(
    permissions = [
        Permission(strings = ["com.ichi2.anki.permission.READ_WRITE_DATABASE"], alias = "ankidroid")
    ]
)
class AnkiDroidApiPlugin(private val activity: Activity) : Plugin(activity) {
    companion object {
        const val PACKAGE = "com.ichi2.anki"
        const val AUTHORITY = "com.ichi2.anki.flashcards"
        const val NOTES_URI = "content://com.ichi2.anki.flashcards/notes"
        const val ANKIDROID_PERMISSION = "com.ichi2.anki.permission.READ_WRITE_DATABASE"
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
                // Request the permission - this will open the Android permission dialog
                ActivityCompat.requestPermissions(
                    activity,
                    arrayOf(ANKIDROID_PERMISSION),
                    1001
                )
                
                // For now, immediately check permission status after request
                // In a real app, this would be handled by the permission result callback
                // but since Tauri handles this differently, we'll check the status
                val stillNeedsPermission = ContextCompat.checkSelfPermission(activity, ANKIDROID_PERMISSION) != PackageManager.PERMISSION_GRANTED
                val result = JSObject().apply {
                    put("granted", !stillNeedsPermission)
                    put("permission", ANKIDROID_PERMISSION)
                    if (stillNeedsPermission) {
                        put("message", "Permission dialog was shown. Please grant permission and try again.")
                    }
                }
                invoke.resolve(result)
            }
        } else {
            val result = JSObject().apply {
                put("granted", true)
                put("permission", ANKIDROID_PERMISSION)
            }
            invoke.resolve(result)
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