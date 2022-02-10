declare namespace PlaywrightTest {
  interface Matchers<R> {
    toBeNear(value: number, range: number): R;
  }
}
