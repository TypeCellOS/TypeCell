/**
 * Trim type-0 diffs from a diff_match_patch patch. 0 indicates "keep", so is not really a diff
 */
export function trimPatch(patch: any) {
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
