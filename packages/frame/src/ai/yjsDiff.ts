import * as Y from "yjs";

import diff_match_patch from "../runtime/editor/prettier/diff";
import { trimPatch } from "../runtime/editor/prettier/trimPatch";

const dmp = new diff_match_patch();

type Step =
  | {
      type: "insert";
      text: string;
      from: number;
    }
  | {
      type: "delete";
      from: number;
      length: number;
    };

export function getYjsDiffs(
  existing: Y.Text,
  newText: string,
  execute = false,
) {
  const steps: Step[] = [];

  const diffs = dmp.diff_main(existing.toJSON(), newText);
  const patches = dmp.patch_make(diffs);

  //   let posDiff = 0;
  for (const patch of patches) {
    trimPatch(patch);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const startPos = patch.start1!; // + posDiff;
    // posDiff += patch.length1 - patch.length2;

    let tempLengths = 0;
    for (const diff of patch.diffs) {
      const type = diff[0];
      const text = diff[1];

      // type 0: keep, type 1: insert, type -1: delete
      if (type === 0) {
        tempLengths += text.length;
      } else if (type === 1) {
        // newText += text;
        const actionStart = startPos + tempLengths;
        steps.push({
          type: "insert",
          text,
          from: actionStart,
          // action: () => existing.insert(actionStart, text),
        });
        if (execute) {
          existing.insert(actionStart, text);
        }
        tempLengths += text.length;
      } else {
        // tempLengths -= text.length;
        // posDiff -= patch.length1;
        const actionStart = startPos + tempLengths;

        steps.push({
          type: "delete",
          from: actionStart,
          length: text.length,
        });
        if (execute) {
          existing.delete(actionStart, text.length);
        }
      }
    }
  }
  return steps;
}
