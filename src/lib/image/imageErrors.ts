export class FileTooLargeError extends Error {
  readonly maxBytes: number;

  constructor(maxBytes: number) {
    super("FILE_TOO_LARGE");
    this.name = "FileTooLargeError";
    this.maxBytes = maxBytes;
  }
}
