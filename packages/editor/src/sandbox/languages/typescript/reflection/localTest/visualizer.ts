import { TypeVisualizer } from "../../../../../typecellEngine/lib/exports";

export let stringVisualizer = new TypeVisualizer({
  name: "test-string",
  function: (x: string) => "hello",
});

export let numberVisualizer = new TypeVisualizer({
  name: "test-number",
  function: (x: number) => "hello",
});
