export class NotSupportedError extends Error {
  constructor(message: string = "Not supported on this platform") {
    super(message);
    this.name = "NotSupportedError";
  }
}

export class AnkiDroidError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "AnkiDroidError";
  }
}