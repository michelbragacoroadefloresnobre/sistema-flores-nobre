export class IntrinsicException extends Error {
  constructor(message: string) {
    super(message);
    this.name = IntrinsicException.name;
  }

  static isIntrinsicException(e: unknown) {
    return e instanceof IntrinsicException;
  }
}
