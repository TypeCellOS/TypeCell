import diff_match_patch from "../util/diff";

import type * as monaco from "monaco-editor";
const dmp = new diff_match_patch();

function trimPatch(patch: any) {
  if (patch.diffs[0][0] === 0) {
    const len = patch.diffs[0][1].length;
    patch.start1 += len;
    patch.length1 -= len;
    patch.start2 += len;
    patch.length2 -= len;
    patch.diffs.shift();
  }
  if (patch.diffs[patch.diffs.length - 1][0] === 0) {
    const len = patch.diffs[patch.diffs.length - 1][1].length;
    patch.length1 -= len;
    patch.length2 -= len;
    patch.diffs.pop();
  }
  return patch;
}

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
