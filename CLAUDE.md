## Golden Rules

- Context is critical. Never guess how to use APIs or libraries.
- Use context7 MCP liberally to get up-to-date documentation, and if that fails, use web search to find the correct usage.
- Don't make assumptions about APIs or function signatures.
- Clean up after yourself. Don't leave behind dead code, or other artifacts.
- Do not take shortcuts like mocking out functions to get tests to pass - we should be fixing compilation errors properly.

## Debugging

- Use Android screenshots liberally to help debug problems with the frontend and iterate.
- Use `npm run quickfix` frequently to fix linting and formatting errors.
- When debugging, you can tail the log files in `./logs` to help you figure out what's going on.
- If you ever see a log file that isn't in `./logs`, we should update our config to include it there.

## Project Notes

- We are targeting android only, not desktop.
- Our main emulator scripts are managed in `./packages/emulator-management`, linked to the `emu` command. Run `emu` to see the available commands.
- Update the emulator management scripts if you need to rather than running commands directly, so we can reproduce them.
