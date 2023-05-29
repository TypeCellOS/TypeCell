import fetch from "cross-fetch";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import "monaco-editor/esm/vs/language/typescript/monaco.contribution.js";
import { expect, it } from "vitest";
import * as Y from "yjs";
import { YTextTypeCellCodeModel } from "../../../models/YTextTypeCellCodeModel";
import SourceModelCompiler from "../../compiler/SourceModelCompiler";
import { setMonacoDefaults } from "../../editor";
import setupTypecellTypeResolver from "../../editor/languages/typescript/typecellTypeResolver";
import { TypeChecker } from "./TypeChecker";
window.fetch = fetch;
/**
 * @vitest-environment jsdom
 */

setMonacoDefaults(monaco);

const timeout = 40000;
// TODO: fix test, type import resolution is breaking in test mode
it(
  "Find correct visualizer and ignore others",
  async () => {
    await setupTypecellTypeResolver(monaco);
    const doc = new Y.Doc();
    const m1Code = new Y.Text(`export let y = 7;`);
    const m2Code = new Y.Text(`
  export let brokenVisualizer = new typecell.TypeVisualizer(); // missing arg
  export let stringVisualizer = new typecell.TypeVisualizer(x: string => "hello");
  
  export let numberVisualizer = new typecell.TypeVisualizer((x: number) => "hello");
  export let anyValue: any = "";
  export let justANumber = 40;`);
    doc.getMap("map").set("m1", m1Code);
    doc.getMap("map").set("m2", m2Code);

    //monaco.editor.createModel("// tesdft", "typescript");

    let m1 = new YTextTypeCellCodeModel(
      "!@mx://mx.typecell.org/@owner/doc/1.cell.tsx",
      "typescript",
      m1Code,
      monaco
    );

    let m2 = new YTextTypeCellCodeModel(
      "!@mx://mx.typecell.org/@owner/doc/2.cell.tsx",
      "typescript",
      m2Code,
      monaco
    );

    let compiler = new SourceModelCompiler(monaco);
    compiler.registerModel(m1);
    compiler.registerModel(m2);

    // let engine = new Engine(
    //   getTypeCellResolver("docid", "testEngine", false, monaco)
    // );

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const typeChecker = new TypeChecker(
      "mx://mx.typecell.org/@owner/doc",
      monaco
    );
    const visualizers = await typeChecker.findMatchingVisualizers(m1);
    expect(visualizers).toEqual(["numberVisualizer"]);
    // console.log(visualizers);

    // await new Promise<void>((resolve) => {
    //   engine.onOutput((e) => {
    //     console.log("output", e.output);
    //     // resolve();
    //   });

    //   // engine.registerModel(m2);
    // });
  },
  timeout
);
