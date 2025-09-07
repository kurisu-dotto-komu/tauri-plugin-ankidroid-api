const COMMANDS: &[&str] = &[
    "isAnkiDroidAvailable",
    "checkPermission",
    "requestPermission",
    "getNotes",
    "createNote",
    "updateNote",
    "deleteNote",
    "getModels",
    "createModel",
    "deleteModel",
    "getDecks",
    "createDeck",
    "getCards",
    "updateCard",
    "deleteCard",
    "getTemplates",
    "getMedia",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .build();
}