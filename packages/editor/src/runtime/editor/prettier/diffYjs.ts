import * as Y from "yjs";
import diff_match_patch from "./diff";
import { trimPatch } from "./trimPatch";

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

export function applyYjsDiffs(
  existing: Y.Text,
  newText: string,
  execute = false
) {
  const steps: Step[] = [];

  const diffs = dmp.diff_main(existing.toJSON(), newText);
  const patches = dmp.patch_make(diffs);

  let posDiff = 0;
  for (let patch of patches) {
    trimPatch(patch);
    let startPos = patch.start1!; // + posDiff;
    posDiff += patch.length1 - patch.length2;

    let tempLengths = 0;
    for (let diff of patch.diffs) {
      let type = (diff as any)[0];
      let text = (diff as any)[1];

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
