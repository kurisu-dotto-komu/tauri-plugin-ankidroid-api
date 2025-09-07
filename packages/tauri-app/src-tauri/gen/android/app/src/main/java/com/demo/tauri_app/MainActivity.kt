package com.demo.tauri_app

import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import android.util.Log

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Enable edge-to-edge display
    enableEdgeToEdge()
    
    // Ensure the app draws behind system bars
    WindowCompat.setDecorFitsSystemWindows(window, false)
    
    // Request layout to ensure insets are available
    window.decorView.post {
      ViewCompat.setOnApplyWindowInsetsListener(window.decorView) { view, insets ->
        val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
        Log.d("MainActivity", "System bar insets - Bottom: ${systemBars.bottom}, Top: ${systemBars.top}")
        insets
      }
      
      // Force a layout pass to generate insets
      ViewCompat.requestApplyInsets(window.decorView)
    }
  }
}
