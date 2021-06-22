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
import { FormState } from "final-form";

const BASE_ID = "mx_Field";
let count = 1;
function getId() {
  return `${BASE_ID}_${count++}`;
}

interface IProps {
  // The field's key, passed down to the AtlasKitField's name, which is used as a key by the Atlaskit Form
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
  // to the user.
  onValidate?: (value?: string) => IValidationResult;
  isRequired?: boolean;
  needsValidation?: boolean;
  helperMessage?: string;
  validMessage?: string;
  // The FormData type is specific to the RegistrationForm, a more general type
  // with inheritence can be made if needed, for now any is used
  // getState?: () => FormState<FormData>
  getFormState?: () => FormState<any>;
  stateCallback?: (state: FormState<any>) => void;
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
  private input: any;
  // | HTMLInputElement
  // | HTMLTextAreaElement
  // | HTMLSelectElement
  // | undefined;

  public static readonly defaultProps = {
    element: "input",
    type: "text",
    needsValidation: false,
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

  public validate = (value?: string) => {
    if (!this.props.onValidate) {
      return undefined;
    }

    if (this.props.getFormState && this.props.stateCallback) {
      const formState = this.props.getFormState();
      console.log("formstate is ", formState);
      this.props.stateCallback(formState);
    }

    const validationResult = this.props.onValidate(value);
    // validationResult.then((result: IValidationResult) => {
    //   if (result.progress) {
    //     this.setState({ progress: result.progress });
    //   }
    //   return result.error;
    // });
    if (validationResult.progress !== undefined) {
      this.setState({ progress: validationResult.progress });
    }
    return validationResult.error;
  };

  public render() {
    /* eslint @typescript-eslint/no-unused-vars: ["error", { "ignoreRestSiblings": true }] */
    const { element, onValidate, children, list, ...inputProps } = this.props;

    // Set some defaults for the <input> element
    const ref = (input: any) => (this.input = input);
    inputProps.placeholder = inputProps.placeholder || inputProps.label;
    inputProps.id = this.id; // this overwrites the id from props

    // Appease typescript's inference
    const inputProps_ = { ...inputProps, ref, list };

    return (
      <AtlaskitField
        label={this.props.label}
        // TODO: change "name" to "key"(somehow its always undefined when doing so)
        name={this.props.name || "undefined name"}
        validate={this.validate}>
        {({ fieldProps, error, valid }: any) => (
          <Fragment>
            {element === "input" ? (
              <Fragment>
                <TextField {...(inputProps_ as any)} {...fieldProps} />
                {this.props.needsValidation && (
                  <Fragment>
                    {this.state.progress !== undefined && (
                      <div style={{ marginTop: "6px" }}>
                        <SuccessProgressBar value={this.state.progress} />
                      </div>
                    )}
                    {error && <ErrorMessage>{error}</ErrorMessage>}
                    {valid && (
                      <ValidMessage>{this.props.validMessage!}</ValidMessage>
                    )}
                  </Fragment>
                )}
              </Fragment>
            ) : element === "select" ? (
              // TODO: should move props into ISelectProps and let caller
              // define these props. I attempted this once but since ISelectProps
              // extends HTMLSelectElement I was not able to redefine "defaultValue".
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
            ) : undefined}
          </Fragment>
        )}
      </AtlaskitField>
    );
  }
}
