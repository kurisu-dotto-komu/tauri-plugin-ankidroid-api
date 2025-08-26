# Tauri Plugin AnkiDroid API

> WORK IN PROGRESS

A Tauri plugin for integrating with AnkiDroid's database API on Android devices.

## Quick Start

You should run this from within the devcontainer, which will set up all the necessary dependencies to run the Android emulator.

You can open http://localhost:6080 to see the emulator.

### Setting up the Android Emulator

```bash
# Initialize the complete emulator environment (one-time setup)
emu init
```

### Managing the Emulator

```bash
# Start/stop emulator
emu start
emu stop

# View available commands
emu --help
```

### Debugigng

- Logs are saved to `./logs/` directory

## Development

```bash
# Run linting
npm run dev
```
