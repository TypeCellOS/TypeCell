import diff_match_patch from "../util/diff";

import type * as monaco from "monaco-editor";
const dmp = new diff_match_patch();

/**
 * Trim type-0 diffs from a diff_match_patch patch. 0 indicates "keep", so is not really a diff
 */
function trimPatch(patch: any) {
  // head
  if (patch.diffs[0][0] === 0) {
    const len = patch.diffs[0][1].length;

    // adjust patch params
    patch.start1 += len;
    patch.length1 -= len;
    patch.start2 += len;
    patch.length2 -= len;

    // remove diff
    patch.diffs.shift();
  }
  // tail
  if (patch.diffs[patch.diffs.length - 1][0] === 0) {
    const len = patch.diffs[patch.diffs.length - 1][1].length;

    // adjust patch params
    patch.length1 -= len;
    patch.length2 -= len;

    // remove diff
    patch.diffs.pop();
  }
  return patch;
}

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

  let ret: monaco.languages.TextEdit[] = [];
  let posDiff = 0;
  for (let patch of patches) {
    trimPatch(patch);
    let startPos = model.getPositionAt(patch.start1! + posDiff);
    let endPos = model.getPositionAt(patch.start1! + patch.length1! + posDiff);
    let range: monaco.IRange = {
      startColumn: startPos.column,
      startLineNumber: startPos.lineNumber,
      endColumn: endPos.column,
      endLineNumber: endPos.lineNumber,
    };
    posDiff += patch.length1 - patch.length2;
    let newText = "";

    for (let diff of patch.diffs) {
      let type = (diff as any)[0];
      let text = (diff as any)[1];

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
