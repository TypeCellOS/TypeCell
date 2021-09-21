import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import "monaco-editor/esm/vs/language/typescript/monaco.contribution.js";
import { Engine, CodeModel } from "@typecell-org/engine";
import { TypeCellCodeModel } from "../../../../models/TypeCellCodeModel";
import * as Y from "yjs";
import { event } from "vscode-lib";
import { getTypeCellResolver } from "../../../../typecellEngine/resolver";
import { setMonacoDefaults } from "../../../";
import { findMatchingVisualizers } from "./TypeChecker";
import setupTypecellTypeResolver from "../plugins/typecellTypeResolver";

setMonacoDefaults(monaco);

jest.setTimeout(10000);
it("Find correct visualizer and ignore others", async () => {
  await setupTypecellTypeResolver(monaco);
  const doc = new Y.Doc();
  const m1Code = new Y.Text(`export let y = 7;`);
  const m2Code = new Y.Text(`
  export let stringVisualizer = new typecell.TypeVisualizer<string>({
    name: "test-string",
    function: (x: string) => "hello"
  });
  
  export let numberVisualizer = new typecell.TypeVisualizer<number>({
    name: "test-numbers",
    function: (x: number) => "hello"
  });
  
  export let justANumber = 40;`);
  doc.getMap("map").set("m1", m1Code);
  doc.getMap("map").set("m2", m2Code);

  //monaco.editor.createModel("// tesdft", "typescript");

  let m1 = new TypeCellCodeModel(
    "!@doc/c1a.cell.tsx",
    "typescript",
    m1Code,
    monaco
  );

  let m2 = new TypeCellCodeModel(
    "!@doc/c2.cell.tsx",
    "typescript",
    m2Code,
    monaco
  );

  let engine = new Engine(
    getTypeCellResolver("docid", "testEngine", false, monaco)
  );

  engine.registerModel(m1);
  engine.registerModel(m2);

  await new Promise((resolve) => setTimeout(resolve, 1000));
  const visualizers = await findMatchingVisualizers("doc", m1, monaco);
  expect(visualizers).toEqual(["numberVisualizer"]);
  console.log(visualizers);

  // await new Promise<void>((resolve) => {
  //   engine.onOutput((e) => {
  //     console.log("output", e.output);
  //     // resolve();
  //   });

  //   // engine.registerModel(m2);
  // });
});
