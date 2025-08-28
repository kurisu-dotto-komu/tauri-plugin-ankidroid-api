## Golden Rules

- Context is critical. Never guess how to use APIs or libraries.
- Use the context7 MCP tool liberally to get up-to-date documentation, and if that fails, use web search to find the correct usage.
- Don't make assumptions about APIs or function signatures.
- Clean up after yourself. Don't leave behind dead code, or other artifacts.
- Do not take shortcuts like mocking out functions to get tests to pass - we should be fixing compilation errors properly.

## Debugging

- Our set up already includes a full Android emulator running.
- Either run `npm run dev` or `npm run test`, but not both at the same time; `dev` is started automatically in test.
- You do not need to rebuild in development, just use `npm run test` and the dev server will handle builds for you.
- We are usually running a Chrome DevTools server on 9222, which you can query.
- Use `emu screenshot` liberally to help debug problems with the frontend and iterate.
- Use `npm run quickfix` frequently to fix linting and formatting errors.

## Project Notes

- We are targeting android only, not desktop.
- Our main emulator scripts are managed in `./packages/emulator-management`, linked to the `emu` command. Run `emu` to see the available commands.
- Update the emulator management scripts if you need to rather than running commands directly, so we can reproduce them.

## Misc

- The core logic is defined in `@Command` decorators in `AnkiDroidAPiPlugin.kt`. We are not using rust for this plusing.
- Always refer to "AnkiDroid" as two separate words for capitalization; E.g. `AnkiDroid`, `Anki_Droid` not `Ankidroid`.
