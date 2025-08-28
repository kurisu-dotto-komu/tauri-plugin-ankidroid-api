use tauri::{plugin::{Builder, TauriPlugin}, Runtime};

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "app.tauri.ankidroid";

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("ankidroid-api")
        .setup(|_app, _api| {
            #[cfg(target_os = "android")]
            _api.register_android_plugin(PLUGIN_IDENTIFIER, "AnkiDroidApiPlugin")?;
            Ok(())
        })
        .build()
}