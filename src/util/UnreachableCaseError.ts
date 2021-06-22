export class UnreachableCaseError extends Error {
  constructor(val: any) {
    super(`Unreachable case: ${val}`);
  }
}
