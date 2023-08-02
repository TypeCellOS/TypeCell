import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import "monaco-editor/esm/vs/language/typescript/monaco.contribution.js";
import { expect, it } from "vitest";
import { event } from "vscode-lib";

import { BasicCodeModel } from "../../models/BasicCodeModel";
import { setMonacoDefaults } from "../editor";
import SourceModelCompiler from "./SourceModelCompiler";
/**
 * @vitest-environment jsdom
 */

setMonacoDefaults(monaco);

it("compiles Typescript code", async () => {
  const m1Code = `export let y: number = 43;`;

  let m1 = new BasicCodeModel("c1a.ts", m1Code, "typescript");

  let compiler = new SourceModelCompiler(monaco);
  compiler.registerModel(m1);
  expect(compiler.models.length).toBe(1);
  const model = compiler.models[0];

  await event.Event.toPromise(model.onDidChangeContent);

  expect(model.getValue()).toMatchInlineSnapshot(`
    "define([\\"require\\", \\"exports\\"], function (require, exports) {
        \\"use strict\\";
        Object.defineProperty(exports, \\"__esModule\\", { value: true });
        exports.y = void 0;
        exports.y = 43;
    });
    "
  `);
});
