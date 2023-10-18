/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type * as monaco from "monaco-editor";
import diff_match_patch from "./diff.js";
import { trimPatch } from "./trimPatch.js";

const dmp = new diff_match_patch();

/**
 * This calculates a list of Monaco TextEdit objects, that represent the transformation from
 * model.getValue() to v2.
 *
 * It uses the Google diff_match_patch library to calculate the diff
 *
 * @param model Current model
 * @param v2 New (future) value of model
 */
export function diffToMonacoTextEdits(model: monaco.editor.IModel, v2: string) {
  const diffs = dmp.diff_main(model.getValue(), v2);
  const patches = dmp.patch_make(diffs);

  const ret: monaco.languages.TextEdit[] = [];
  let posDiff = 0;
  for (const patch of patches) {
    trimPatch(patch);
    const startPos = model.getPositionAt(patch.start1! + posDiff);
    const endPos = model.getPositionAt(
      patch.start1! + patch.length1! + posDiff,
    );
    const range: monaco.IRange = {
      startColumn: startPos.column,
      startLineNumber: startPos.lineNumber,
      endColumn: endPos.column,
      endLineNumber: endPos.lineNumber,
    };
    posDiff += patch.length1 - patch.length2;
    let newText = "";

    for (const diff of patch.diffs) {
      const type = (diff as any)[0];
      const text = (diff as any)[1];

      // type 0: keep, type 1: insert, type -1: delete
      if (type === 0 || type === 1) {
        newText += text;
      }
    }
    ret.push({
      range,
      text: newText,
    });
  }
  return ret;
}
