import { TypeVisualizer } from "../../../executor/lib/exports";

// @ts-expect-error expected to be broken, that's the point of this test
export const brokenVisualizer = new TypeVisualizer();

export const anyVisualizer = new TypeVisualizer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (x: any) => "hello",
  "test-string"
);

export const stringVisualizer = new TypeVisualizer(
  (x: string) => "hello",
  "test-string"
);

export const numberVisualizer = new TypeVisualizer(
  (x: number) => "hello",
  "test-number"
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const anyValue = {} as any;
