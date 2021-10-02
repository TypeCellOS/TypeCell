/*
Copyright 2018 New Vector Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import zxcvbn from "zxcvbn";

const ZXCVBN_USER_INPUTS = ["riot", "matrix", "typecell"];

/**
 * Wrapper around zxcvbn password strength estimation
 * Include this only from async components: it pulls in zxcvbn
 * (obviously) which is large.
 *
 * @param {string} password Password to score
 * @returns {object} Score result with `score` and `feedback` properties
 */
export function scorePassword(password: string) {
  if (password.length === 0) return null;

  const userInputs = ZXCVBN_USER_INPUTS.slice();
  //   if (MatrixClientPeg.get()) {
  // userInputs.push(MatrixClientPeg.get().getUserIdLocalpart());
  //   }

  let zxcvbnResult = zxcvbn(password, userInputs);
  // Work around https://github.com/dropbox/zxcvbn/issues/216
  if (password.includes(" ")) {
    const resultNoSpaces = zxcvbn(password.replace(/ /g, ""), userInputs);
    if (resultNoSpaces.score < zxcvbnResult.score)
      zxcvbnResult = resultNoSpaces;
  }

  // for (let i = 0; i < zxcvbnResult.feedback.suggestions.length; ++i) {
  // translate suggestions
  // zxcvbnResult.feedback.suggestions[i] = zxcvbnResult.feedback.suggestions[i];
  // }
  // and warning, if any
  // if (zxcvbnResult.feedback.warning) {
  // zxcvbnResult.feedback.warning = zxcvbnResult.feedback.warning;
  // }

  return zxcvbnResult;
}
