## Golden Rules

- Context is critical. Never guess how to use APIs or libraries.
- Use the context7 MCP tool liberally to get up-to-date documentation, and if that fails, use web search to find the correct usage.
- Don't make assumptions about APIs or function signatures.
- Clean up after yourself. Don't leave behind dead code, or other artifacts.
- Do not take shortcuts like mocking out functions to get tests to pass - we should be fixing compilation errors properly.

## Debugging

- Our set up already includes a full Android emulator running.
- Do not try to run the app manually with `adb shell`, that won't work. Instead, use `npm run dev` or `npm run test`.
- Either run `npm run dev` or `npm run test`, but not both at the same time; `dev` is started automatically in test.
- You do not need to rebuild in development, just use `npm run test` and the dev server will handle builds for you.
- We are usually running a Chrome DevTools server on 9222, which you can query.
- Use `emu screenshot` liberally to help debug problems with the frontend and iterate.
- Use `npm run quickfix` frequently to fix linting and formatting errors.

### Debugging Build Issues

- **Kotlin/Rust changes not taking effect**: If Kotlin plugin changes don't seem to be working, the issue is likely caching. Clean the build cache with `cd packages/tauri-app/src-tauri && cargo clean` then re-run tests.
- **JavaScript client changes not taking effect**: The `ankidroid-api-client` package needs to be rebuilt after changes: `cd packages/ankidroid-api-client && npm run build`.
- **Force clean rebuild**: For major changes affecting both Kotlin and JS, do both: clean cargo cache + rebuild client package.
- **Error messages showing "[object Object]"**: This usually means error objects aren't being serialized properly. Add better error handling in the JS client to use `JSON.stringify(error)` for objects.
- **"Expected array, received string" validation errors**: Ensure Kotlin code converts split strings to proper JSArray objects using `JSArray().put(item)` instead of raw Kotlin collections.
- **Test page closing unexpectedly**: Usually caused by unhandled errors in the frontend. Add debugging to see the actual error instead of letting it crash the webview.

## Project Notes

- We are targeting android only, not desktop.
- Our main emulator scripts are managed in `./packages/emulator-management`, linked to the `emu` command. Run `emu` to see the available commands.
- Update the emulator management scripts if you need to rather than running commands directly, so we can reproduce them.

## Misc

- The core logic is defined in `@Command` decorators in `AnkiDroidAPiPlugin.kt`. We are not using rust for this plusing.
- Always refer to "AnkiDroid" as two separate words for capitalization; E.g. `AnkiDroid`, `Anki_Droid` not `Ankidroid`.
