import fetch from "cross-fetch";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import "monaco-editor/esm/vs/language/typescript/monaco.contribution.js";
import { expect, it } from "vitest";
import { async } from "vscode-lib";

import { BasicCodeModel } from "../../../models/BasicCodeModel";
import SourceModelCompiler from "../../compiler/SourceModelCompiler";
import { setMonacoDefaults } from "../../editor";

import { setupTypecellHelperTypeResolver } from "../../editor/languages/typescript/TypeCellHelperTypeResolver";
import { setupTypecellModuleTypeResolver } from "../../editor/languages/typescript/TypeCellModuleTypeResolver";
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
    await setupTypecellHelperTypeResolver(monaco);
    await setupTypecellModuleTypeResolver(monaco);

    const m1Code = `export let y = 7;`;
    const m2Code = `
  export let brokenVisualizer = new typecell.TypeVisualizer(); // missing arg
  export let stringVisualizer = new typecell.TypeVisualizer(x: string => "hello");
  
  export let numberVisualizer = new typecell.TypeVisualizer((x: number) => "hello");
  export let anyValue: any = "";
  export let justANumber = 40;`;

    //monaco.editor.createModel("// tesdft", "typescript");

    const m1 = new BasicCodeModel(
      "!mx:mx.typecell.org/@owner/doc/1.cell.tsx",
      m1Code,
      "typescript"
    );

    const m2 = new BasicCodeModel(
      "!mx:mx.typecell.org/@owner/doc/2.cell.tsx",
      m2Code,
      "typescript"
    );

    const compiler = new SourceModelCompiler(monaco);
    compiler.registerModel(m1);
    compiler.registerModel(m2);

    // let engine = new Engine(
    //   getTypeCellResolver("docid", "testEngine", false, monaco)
    // );

    await async.timeout(1000);
    const typeChecker = new TypeChecker(
      "mx:mx.typecell.org/@owner/doc",
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
