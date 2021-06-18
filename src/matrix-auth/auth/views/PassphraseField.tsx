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
import classNames from "classnames";
import type zxcvbn from "zxcvbn";

import withValidation, {
  IFieldState,
  IValidationResult,
} from "../elements/Validation";
import Field, { IInputProps } from "../elements/Field";

interface IProps extends Omit<IInputProps, "onValidate"> {
  autoFocus?: boolean;
  // id?: string;
  // className?: string;
  minScore: 0 | 1 | 2 | 3 | 4;
  value: string;
  fieldRef?: RefCallback<Field> | RefObject<Field>;

  label?: string;
  labelEnterPassword: string;
  labelStrongPassword: string;
  labelAllowedButUnsafe: string;

  // onChange(ev: React.FormEvent<HTMLElement>): void;
  // onValidate(result: IValidationResult): void;
}

class PassphraseField extends PureComponent<IProps> {
  static defaultProps = {
    label: "Password",
    labelEnterPassword: "Enter password",
    labelStrongPassword: "Nice, strong password!",
    labelAllowedButUnsafe: "Password is allowed, but unsafe",
  };

  public readonly validate = withValidation<this, zxcvbn.ZXCVBNResult | null>({
    description: function (complexity) {
      const score = complexity ? complexity.score : 0;
      return (
        <progress
          className="mx_PassphraseField_progress"
          max={4}
          value={score}
        />
      );
    },
    deriveData: async ({ value }) => {
      if (!value) return null;
      const { scorePassword } = await import("../util/PasswordScorer");
      return scorePassword(value);
    },
    rules: [
      {
        key: "required",
        test: ({ value, allowEmpty }) => allowEmpty || !!value,
        invalid: () => this.props.labelEnterPassword,
      },
      {
        key: "complexity",
        test: async function ({ value }, complexity) {
          if (!value) {
            return false;
          }
          const safe = !!complexity && complexity.score >= this.props.minScore;
          const allowUnsafe = false;
          return allowUnsafe || safe;
        },
        valid: function (complexity) {
          // Unsafe passwords that are valid are only possible through a
          // configuration flag. We'll print some helper text to signal
          // to the user that their password is allowed, but unsafe.
          if (complexity && complexity.score >= this.props.minScore) {
            return this.props.labelStrongPassword;
          }
          return this.props.labelAllowedButUnsafe;
        },
        invalid: function (complexity) {
          if (!complexity) {
            return "";
          }
          const { feedback } = complexity;
          return feedback.warning || feedback.suggestions[0] || "Keep going...";
        },
      },
    ],
  });

  // onValidate = async (fieldState: IFieldState) => {
  //   const result = await this.validate(fieldState);
  //   this.props.onValidate(result);
  //   return result;
  // };

  render() {
    return (
      <Field
        autoFocus={this.props.autoFocus}
        type="password"
        autoComplete="new-password"
        label={this.props.label}
        value={this.props.value}
        onChange={this.props.onChange}
        // temp disabled
        //onValidate={this.onValidate}
        ref={this.props.fieldRef}
      />
    );
  }
}

export default PassphraseField;
