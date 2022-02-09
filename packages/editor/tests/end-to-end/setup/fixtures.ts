import { expect } from "./userFixtures";
export { test } from "./userFixtures";

expect.extend({
  toBeNear(received: number, value: number, range: number) {
    const pass = received >= value - range && received <= value + range;
    if (pass) {
      return {
        message: () => "passed",
        pass: true,
      };
    } else {
      return {
        message: () => "failed",
        pass: false,
      };
    }
  },
});
export { expect };
