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

interface IProps extends Omit<IInputProps, "onValidate"> {
  autoFocus?: boolean;
  minScore: 0 | 1 | 2 | 3 | 4;
  fieldRef?: RefCallback<Field> | RefObject<Field>;
}

class PassphraseField extends PureComponent<IProps> {
  // Field-level validations
  // these validation functions take the field value and should return
  // an "error" if it is not valid, or undefined if it is valid.
  // If ShowErrorMsg is set in the corresponding Field, the error string
  // will be displayed when the field is invalid. Similarly, if ShowValidMsg
  // is set in the corresponding Field, a validation message will be displayed
  // if the field is valid. The valid message is also set in the Field props.
  // Additionally, if a "progress"(range 0-1) is returned with the "error",
  // a progress bar will be rendered under the field.

  private validate = async (value?: string) => {
    if (!value || !value.length)
      return {
        error: "Add another word or two. Uncommon words are better",
        progress: 0,
      };

    // loaded async because this library is expensive
    const { scorePassword } = await import("../util/PasswordScorer");

    const scoreResults = scorePassword(value);

    if (!scoreResults) {
      throw new Error(
        "shouldn't be null at this point , as value has been checked for non-emptiness"
      );
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

  render() {
    return (
      <Field
        key="password"
        autoFocus={this.props.autoFocus}
        type="password"
        name="password"
        autoComplete="new-password"
        label="Password"
        onValidate={this.validate}
        showValidMsg
        showErrorMsg
        validMessage="Nice, strong password!"
        isRequired
        ref={this.props.fieldRef}
        onChange={this.props.onChange}
      />
    );
  }
}

export default PassphraseField;
