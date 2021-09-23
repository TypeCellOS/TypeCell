import { TypeVisualizer } from "../../../executor/lib/exports";

// @ts-expect-error
export let brokenVisualizer = new TypeVisualizer();

export let anyVisualizer = new TypeVisualizer(
  (x: any) => "hello",
  "test-string"
);

export let stringVisualizer = new TypeVisualizer(
  (x: string) => "hello",
  "test-string"
);

export let numberVisualizer = new TypeVisualizer(
  (x: number) => "hello",
  "test-number"
);

export let anyValue = {} as any;
