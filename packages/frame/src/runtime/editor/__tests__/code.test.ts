import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import "monaco-editor/esm/vs/language/typescript/monaco.contribution.js";
import { expect, it } from "vitest";
import { event } from "vscode-lib";
import { setMonacoDefaults } from "..";

import { ReactiveEngine } from "@typecell-org/engine";
import { BasicCodeModel } from "../../../models/BasicCodeModel";
import SourceModelCompiler from "../../compiler/SourceModelCompiler";
// import { getTypeCellResolver } from "../../executor/resolver/TypeCellModuleResolver";
/**
 * @vitest-environment jsdom
 */

setMonacoDefaults(monaco);

it("basic code execution", async () => {
  const m1Code = `export let y = 43;`;
  const m2Code = `export let x = 432;`;

  //monaco.editor.createModel("// tesdft", "typescript");

  let m1 = new BasicCodeModel("c1a.ts", m1Code, "typescript");

  let compiler = new SourceModelCompiler(monaco);
  compiler.registerModel(m1);
  // let m2 = new TypeCellCodeModel("c2.ts", "typescript", m2Code, monaco);
  // compiler.registerModel(m2);

  let engine = new ReactiveEngine(async () => undefined);

  engine.registerModelProvider(compiler);
  await event.Event.toPromise(engine.onOutput); // first compilation will be empty
  const result = await event.Event.toPromise(engine.onOutput);
  console.log(result);
  expect(result.output.y).toBe(43);

  // await new Promise<void>((resolve) => {
  //   engine.onOutput((e) => {
  //     console.log("output", e.output);
  //     // resolve();
  //   });

  //   // engine.registerModel(m2);
  // });
});
