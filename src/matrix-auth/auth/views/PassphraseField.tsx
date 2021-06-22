/*
Copyright 2020 The Matrix.org Foundation C.I.C.

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

import React, { PureComponent, RefCallback, RefObject } from "react";

import Field, { IInputProps, IValidationResult } from "../elements/Field";
import { scorePassword } from "../util/PasswordScorer";

interface IProps extends Omit<IInputProps, "onValidate"> {
  autoFocus?: boolean;
  minScore: 0 | 1 | 2 | 3 | 4;
  fieldRef?: RefCallback<Field> | RefObject<Field>;
}

class PassphraseField extends PureComponent<IProps> {
  public readonly validate = (value?: string) => {
    if (!value)
      return {
        error: "Add another word or two. Uncommon words are better",
        progress: 0,
      };
    // const { scorePassword } = await import("../util/PasswordScorer");
    const scoreResults = scorePassword(value);
    console.log("score result is ", scoreResults?.score);
    // TODO: compiler sees this as possibly null, why?
    if (!scoreResults) {
      return {
        error: "Unknown error, try something else",
        progress: 0,
      };
    }
    if (scoreResults.score && scoreResults.score >= this.props.minScore) {
      return { progress: scoreResults.score / 4 };
    } else {
      return {
        error:
          scoreResults.feedback.warning ||
          scoreResults.feedback.suggestions[0] ||
          "Keep going...",
        progress: scoreResults.score / 4,
      };
    }
  };

  onValidate = (value?: string) => {
    console.log("arrived at validate of PassphraseField");
    const result = this.validate(value);
    return result;
  };

  render() {
    return (
      <Field
        autoFocus={this.props.autoFocus}
        type="password"
        name="password"
        key="password"
        autoComplete="new-password"
        label="password"
        onValidate={this.onValidate}
        needsValidation
        validMessage="Nice, strong password!"
        isRequired
        ref={this.props.fieldRef}
      />
    );
  }
}

export default PassphraseField;
