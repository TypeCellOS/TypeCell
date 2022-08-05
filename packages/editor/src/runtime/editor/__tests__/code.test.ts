import { Engine } from "@typecell-org/engine";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import "monaco-editor/esm/vs/language/typescript/monaco.contribution.js";
import { expect, it } from "vitest";
import { event } from "vscode-lib";
import * as Y from "yjs";
import { setMonacoDefaults } from "..";
import { TypeCellCodeModel } from "../../../models/TypeCellCodeModel";
import SourceModelCompiler from "../../compiler/SourceModelCompiler";
import { getTypeCellResolver } from "../../executor/resolver/resolver";
/**
 * @vitest-environment jsdom
 */

setMonacoDefaults(monaco);

it("basic code execution", async () => {
  const doc = new Y.Doc();
  const m1Code = new Y.Text(`export let y = 43;`);
  const m2Code = new Y.Text(`export let x = 432;`);
  doc.getMap("map").set("m1", m1Code);
  doc.getMap("map").set("m2", m2Code);

  //monaco.editor.createModel("// tesdft", "typescript");

  let m1 = new TypeCellCodeModel("c1a.ts", "typescript", m1Code, monaco);

  let compiler = new SourceModelCompiler(monaco);
  compiler.registerModel(m1);
  // let m2 = new TypeCellCodeModel("c2.ts", "typescript", m2Code, monaco);
  // compiler.registerModel(m2);

  let engine = new Engine(
    getTypeCellResolver("docid", "testEngine", undefined)
  );

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
