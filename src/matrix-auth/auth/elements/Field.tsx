/*
Copyright 2019 New Vector Ltd

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

import React, {
  Fragment,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import TextField from "@atlaskit/textfield";
import {
  ErrorMessage,
  Field as AtlaskitField,
  ValidMessage,
} from "@atlaskit/form";
import Select from "@atlaskit/select";
import { SuccessProgressBar } from "@atlaskit/progress-bar";

const BASE_ID = "mx_Field";
let count = 1;
function getId() {
  return `${BASE_ID}_${count++}`;
}

interface IProps {
  // The field's ID, which binds the input and label together. Immutable.
  id?: string;
  // The field's type (when used as an <input>). Defaults to "text".
  type?: string;
  // id of a <datalist> element for suggestions
  list?: string;
  // The field's label string.
  label?: string;
  // The field's placeholder string. Defaults to the label.
  placeholder?: string;
  // The callback called whenever the contents of the field
  // changes.  Returns an object with `valid` boolean field
  // and a `feedback` react component field to provide feedback
  // to the user.
  onValidate?: (
    value?: string
  ) => IValidationResult | Promise<IValidationResult>;
  isRequired?: boolean;
  showValidMsg?: boolean;
  showErrorMsg?: boolean;
  helperMessage?: string;
  validMessage?: string;
  // All other props pass through to the <input>.
}

export interface IValidationResult {
  error?: string;
  progress?: number;
}

export interface IInputProps
  extends IProps,
    InputHTMLAttributes<HTMLInputElement> {
  // The element to create. Defaults to "input".
  element?: "input";
}

interface ISelectProps extends IProps, SelectHTMLAttributes<HTMLSelectElement> {
  // To define options for a select, use <Field><option ... /></Field>
  element: "select";
}

interface ITextareaProps
  extends IProps,
    TextareaHTMLAttributes<HTMLTextAreaElement> {
  element: "textarea";
}

type PropShapes = IInputProps | ISelectProps | ITextareaProps;

interface IState {
  error?: string;
  progress?: number;
}

export default class Field extends React.PureComponent<PropShapes, IState> {
  private id: string;
  private input:
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement
    | undefined;

  public static readonly defaultProps = {
    element: "input",
    type: "text",
    showValidMsg: false,
    showErrorMsg: false,
  };

  constructor(props: PropShapes) {
    super(props);
    this.state = {
      error: undefined,
      progress: undefined,
    };

    this.id = this.props.id || getId();
  }

  public focus() {
    this.input!.focus();
  }

  public validate = async (value?: string) => {
    if (!this.props.onValidate) {
      return undefined;
    }

    const validationResult = await this.props.onValidate(value);
    if (validationResult.progress !== undefined) {
      this.setState({ progress: validationResult.progress });
    }
    return validationResult.error;
  };

  public render() {
    /* eslint @typescript-eslint/no-unused-vars: ["error", { "ignoreRestSiblings": true }] */
    const {
      element,
      onValidate,
      children,
      list,
      showErrorMsg,
      showValidMsg,
      ...inputProps
    } = this.props;

    // Set some defaults for the <input> element
    const ref = (input: any) => (this.input = input);
    inputProps.placeholder = inputProps.placeholder || inputProps.label;
    inputProps.id = this.id; // this overwrites the id from props

    // Appease typescript's inference
    const inputProps_ = { ...inputProps, ref, list };

    if (!this.props.name) {
      throw new Error("no name");
    }

    return (
      <AtlaskitField
        label={this.props.label}
        name={this.props.name}
        validate={this.validate}>
        {({ fieldProps, error, valid }: any) => {
          if (element === "input") {
            return (
              <Fragment>
                <TextField
                  defaultValue=""
                  {...(inputProps_ as any)}
                  {...fieldProps}
                  onChange={(e) => {
                    // trigger both handlers if set
                    fieldProps.onChange?.(e);
                    inputProps_.onChange?.(e as any);
                  }}
                />
                {this.state.progress !== undefined && (
                  <div style={{ marginTop: "6px" }}>
                    <SuccessProgressBar value={this.state.progress} />
                  </div>
                )}
                {showValidMsg && valid && (
                  <ValidMessage>{this.props.validMessage}</ValidMessage>
                )}
                {showErrorMsg && error && <ErrorMessage>{error}</ErrorMessage>}
              </Fragment>
            );
          } else if (element === "select") {
            // TODO: should move props into ISelectProps and let caller
            // define these props. I attempted this once but since ISelectProps
            // extends HTMLSelectElement I was not able to redefine "defaultValue".
            return (
              <Select
                {...(inputProps_ as any)}
                {...fieldProps}
                defaultValue={{
                  label: "Username",
                  value: this.props.value,
                }}
                onChange={this.props.onChange}
                options={[
                  { label: "Username", value: "login_field_mxid" },
                  { label: "Email address", value: "login_field_email" },
                  { label: "Phone", value: "login_field_phone" },
                ]}
              />
            );
          } else {
            throw new Error("not implemented");
          }
        }}
      </AtlaskitField>
    );
  }
}
