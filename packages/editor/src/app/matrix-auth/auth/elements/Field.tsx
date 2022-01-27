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
import Select, { OptionType } from "@atlaskit/select";
import { SuccessProgressBar } from "@atlaskit/progress-bar";

const BASE_ID = "mx_Field";
let count = 1;
function getId() {
  return `${BASE_ID}_${count++}`;
}

interface IProps<T> {
  // The field's key, which Atlaskit uses in the Form state in the key-value per Field.
  key?: string;
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
  // The callback function takes the field value and should return
  // an "error" if it is not valid, or undefined if it is valid.
  // If ShowErrorMsg is set in the corresponding Field, the error string
  // will be displayed when the field is invalid. Similarly, if ShowValidMsg
  // is set in the corresponding Field, a validation message will be displayed
  // if the field is valid. The valid message is also set in the Field props.
  // Additionally, if a "progress"(range 0-1) is returned with the "error",
  // a progress bar will be rendered under the field.
  // to the user.
  onValidate?: (value?: T) => IValidationResult | Promise<IValidationResult>;
  // A validity check for empty field, Atlaskit will auto focus and
  // show tooltip on submission
  isRequired?: boolean;
  // Whether Atlaskit should render a ValidMessage when validation passes
  // The message should be passed to validMessage prop
  showValidMsg?: true | false | "if-not-empty";
  // Whether Atlaskit should render a ErrorMessage when validation fails
  // The message should be returned by the validate function
  showErrorMsg?: boolean;
  // The HelperMessage message, if provided, that Atlaskit will show under the field.
  helperMessage?: string;
  // The ValidMessage that is rendered if field is valid and showValidMsg is true.
  validMessage?: string;
  // All other props pass through to the <input>.
  defaultValue?: T;
}

export interface IValidationResult {
  error?: string;
  progress?: number;
}

export interface IInputProps<T>
  extends IProps<T>,
    Omit<InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "type"> {
  // The element to create. Defaults to "input".
  element?: "input";
}

// TODO: consider removing SelectHTMLAttributes extension and use custom props
interface ISelectProps<FieldValue>
  extends IProps<FieldValue>,
    Omit<SelectHTMLAttributes<HTMLSelectElement>, "defaultValue" | "type"> {
  // To define options for a select, use <Field><option ... /></Field>
  element: "select";
  options?: OptionType[];
  // onChange?:
}

interface ITextareaProps<FieldValue>
  extends IProps<FieldValue>,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "defaultValue"> {
  element: "textarea";
}

interface IState {
  error?: string;
  progress?: number;
}

type Props<FieldValue> =
  | IInputProps<FieldValue>
  | ITextareaProps<FieldValue>
  | ISelectProps<FieldValue>;

// Field renders an appropriate Atlaskit Field based on the given props.
//
// Input and Select are the two available field types, and Textarea could be
// implemented when needed(current codebase does not make use of it, Matrix did).
//
// Field events, including submission, will trigger Atlaskits validation call,
// which in turn calls the onValidate function provided to this component. More
// sophisticated rendering of validity that Atlaskit does on each field can be
// set by props. for more information regarding props see comments on each prop,
// as well as Atlaskit documentation for more detauls on how Fields work.
export default class Field<FieldValue> extends React.PureComponent<
  Props<FieldValue>,
  IState
> {
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
    isRequired: false,
  };

  constructor(props: Props<FieldValue>) {
    super(props);
    this.state = {
      error: undefined,
      progress: undefined,
    };

    this.id = this.props.id || getId();
  }

  public validate = async (value?: FieldValue) => {
    if (!this.props.onValidate) {
      return undefined;
    }

    const validationResult = await this.props.onValidate(value);
    if (validationResult.progress !== undefined) {
      this.setState({ progress: validationResult.progress });
    } else {
      this.setState({ progress: undefined });
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
      // Renders an Atlaskit Field based on provided props to this component.
      // Used inside Atlaskit Form components. See commnets in this file and
      // Atlaskit documentation for more details.
      <AtlaskitField<FieldValue>
        label={this.props.label}
        name={this.props.name}
        validate={this.validate}
        defaultValue={this.props.defaultValue}
        isRequired={this.props.isRequired}>
        {({ fieldProps, error, valid }: any) => {
          if (element === "input") {
            return (
              <Fragment>
                <TextField
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
                {valid &&
                  (showValidMsg === true ||
                    (showValidMsg === "if-not-empty" &&
                      !!fieldProps.value?.length)) && (
                    <ValidMessage>{this.props.validMessage}</ValidMessage>
                  )}
                {showErrorMsg && error && <ErrorMessage>{error}</ErrorMessage>}
              </Fragment>
            );
          } else if (element === "select") {
            return (
              <Select
                {...(inputProps_ as any)}
                {...fieldProps}
                isSearchable={false}
                onChange={(e) => {
                  // trigger both handlers if set
                  // fieldProps.onChange?.(e); // exclude ecause we only use this for mx_Login_type_container. Perhaps better if we refactor that to a regular <select>
                  inputProps_.onChange?.(e as any);
                }}
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
