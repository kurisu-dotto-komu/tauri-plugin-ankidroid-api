## Golden Rules

- Context is critical. Never guess how to use APIs or libraries.
- Use context7 MCP liberally to get up-to-date documentation, and if that fails, use web search to find the correct usage.
- Don't make assumptions about APIs or function signatures.
- Clean up after yourself. Don't leave behind dead code, or other artifacts.
- Do not take shortcuts like mocking out functions to get tests to pass - we should be fixing compilation errors properly.

## Debugging

- Use Android screenshots liberally to help debug problems with the frontend and iterate.
- When debugging, you can tail the log files in `./logs` to help you figure out what's going on.

## Project Notes

- We want to have reproducible commands to build and test the app, so we should maintain `npm run` scripts rather than executing build/test commands directly. If they don't work for you, add or update them.
- Our `npm` scripts should be able to be run from the project root.

- If you rebuild, you might need to grant permissions using the scripts available in `./scripts`.
- You might need to run the dev server in the background if running the app in dev mode.
- We are targeting android only, not desktop.
