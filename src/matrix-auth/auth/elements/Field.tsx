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

// import classNames from "classnames";
// import { debounce } from "lodash";
import React, {
  Fragment,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
// TODO: likely not needed anymore, but consider if
// their logical importance is substituted
//import { IFieldState, IValidationResult } from "./Validation";

import TextField from "@atlaskit/textfield";
// import { ValidMessage, Field as AtlaskitField } from "@atlaskit/form";
// import { ErrorMessage, Field as AtlaskitField } from "@atlaskit/form";
// import { ErrorMessage, ValidMessage, Field as AtlaskitField } from "@atlaskit/form";
import {
  ErrorMessage,
  Field as AtlaskitField,
  ValidMessage,
} from "@atlaskit/form";
import Select from "@atlaskit/select";
// import { IValidationResult } from "./Validation";
// Invoke validation from user input (when typing, etc.) at most once every N ms.
// const VALIDATION_THROTTLE_MS = 200;
import { SuccessProgressBar } from "@atlaskit/progress-bar";
// import Form from "@atlaskit/form";
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

  // This is not used anymore as the validation is called by AtlasKitForm
  /*
   * This was changed from throttle to debounce: this is more traditional for
   * form validation since it means that the validation doesn't happen at all
   * until the user stops typing for a bit (debounce defaults to not running on
   * the leading edge). If we're doing an HTTP hit on each validation, we have more
   * incentive to prevent validating input that's very unlikely to be valid.
   * We may find that we actually want different behaviour for registration
   * fields, in which case we can add some options to control it.
  //  */
  // private validateOnChange = debounce(() => {
  //   this.validate({
  //     focused: true,
  //   });
  // }, VALIDATION_THROTTLE_MS);

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

  // The input is not controlled by Field anymore. The validation
  // function gets called directly from AtlasKitField instead.
  // private onFocus = (ev: React.FocusEvent<any>) => {
  //   this.setState({
  //     focused: true,
  //   });
  //   if (this.props.validateOnFocus) {
  //     this.validate({
  //       focused: true,
  //     });
  //   }
  //   // Parent component may have supplied its own `onFocus` as well
  //   if (this.props.onFocus) {
  //     this.props.onFocus(ev);
  //   }
  // };

  // The input is not controlled by Field anymore. The validation
  // function gets called directly from AtlasKitField instead.
  // private onChange = (ev: React.ChangeEvent<any>) => {
  //   if (this.props.validateOnChange) {
  //     this.validateOnChange();
  //   }
  //   // Parent component may have supplied its own `onChange` as well
  //   if (this.props.onChange) {
  //     this.props.onChange(ev);
  //   }
  // };

  // TODO: likely remove this
  // private onBlur = (ev: React.FocusEvent<any>) => {
  //   this.setState({
  //     focused: false,
  //   });
  //   if (this.props.validateOnBlur) {
  //     this.validate();
  //   }
  //   // Parent component may have supplied its own `onBlur` as well
  //   if (this.props.onBlur) {
  //     this.props.onBlur(ev);
  //   }
  // };

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

  // public async validate({
  //   focused,
  //   allowEmpty = true,
  // }: {
  //   focused?: boolean;
  //   allowEmpty?: boolean;
  // }) {
  //   if (!this.props.onValidate) {
  //     return;
  //   }
  //   const value = this.input ? this.input.value : undefined;
  //   const { valid, feedback } = await this.props.onValidate({
  //     value: value,
  //     focused: !!focused,
  //     allowEmpty,
  //   });

  //   // this method is async and so we may have been blurred since the method was called
  //   // if we have then hide the feedback as withValidation does
  //   if (this.state.focused && feedback) {
  //     this.setState({
  //       valid: !!valid,
  //       feedback,
  //       feedbackVisible: true,
  //     });
  //   } else {
  //     // When we receive null `feedback`, we want to hide the tooltip.
  //     // We leave the previous `feedback` content in state without updating it,
  //     // so that we can hide the tooltip containing the most recent feedback
  //     // via CSS animation.
  //     this.setState({
  //       valid: !!valid,
  //       feedbackVisible: false,
  //     });
  //   }

  //   return valid;
  // }

  public render() {
    /* eslint @typescript-eslint/no-unused-vars: ["error", { "ignoreRestSiblings": true }] */
    const { element, onValidate, children, list, ...inputProps } = this.props;

    // Set some defaults for the <input> element
    const ref = (input: any) => (this.input = input);
    inputProps.placeholder = inputProps.placeholder || inputProps.label;
    inputProps.id = this.id; // this overwrites the id from props

    // These will be handled by AtlasKit
    // inputProps.onFocus = this.onFocus;
    // inputProps.onChange = this.onChange;
    // inputProps.onBlur = this.onBlur;

    // Appease typescript's inference
    const inputProps_ = { ...inputProps, ref, list };

    // OLD:
    // const fieldInput = React.createElement(
    //   this.props.element!,
    //   inputProps_ as any,
    //   children
    // );

    // I added changes directly into the render, but can move it here
    // later for clarity. If not, this is not needed anymore.
    // NEW:
    // const fieldInput =
    //   element === "input" ? (
    //     <TextField {...(inputProps_ as any)} />
    //   ) : element === "textarea" ? (
    //     // TODO: should be textarea (but can do later, not used for now)
    //     <TextField {...(inputProps_ as any)} />
    //   ) : element === "select" ? (
    //     // TODO: should be atlaskit <Select> or similar, I can help with this later
    //     <TextField {...(inputProps_ as any)}></TextField>
    //   ) : undefined;

    // I don't think prefix / postfix components are used, so for now we can skip this
    // let prefixContainer = null;
    // if (prefixComponent) {
    //   prefixContainer = (
    //     <span className="mx_Field_prefix">{prefixComponent}</span>
    //   );
    // }
    // let postfixContainer = null;
    // if (postfixComponent) {
    //   postfixContainer = (
    //     <span className="mx_Field_postfix">{postfixComponent}</span>
    //   );
    // }

    // const hasValidationFlag =
    //   forceValidity !== null && forceValidity !== undefined;
    // const fieldClasses = classNames(
    //   "mx_Field",
    //   `mx_Field_${this.props.element}`,
    //   className,
    //   {
    //     // If we have a prefix element, leave the label always at the top left and
    //     // don't animate it, as it looks a bit clunky and would add complexity to do
    //     // properly.
    //     mx_Field_labelAlwaysTopLeft: prefixComponent,
    //     mx_Field_valid: hasValidationFlag
    //       ? forceValidity
    //       : onValidate && this.state.valid === true,
    //     mx_Field_invalid: hasValidationFlag
    //       ? !forceValidity
    //       : onValidate && this.state.valid === false,
    //   }
    // );

    // Handle displaying feedback on validity
    // const Tooltip = sdk.getComponent("elements.Tooltip");
    // let fieldTooltip;
    // if (tooltipContent || this.state.feedback) {
    //   fieldTooltip = (
    //     <Tooltip
    //       tooltipClassName={classNames("mx_Field_tooltip", tooltipClassName)}
    //       visible={
    //         (this.state.focused && this.props.forceTooltipVisible) ||
    //         this.state.feedbackVisible
    //       }
    //       label={tooltipContent || this.state.feedback}
    //     />
    //   );
    // }

    return (
      <AtlaskitField
        label={this.props.label}
        // TODO: change "name" to "key"(somehow its always undefined when doing so)
        name={this.props.name || "undefined name"}
        // TODO: transform validate to fit the validate function requirement for AtlasKitField
        validate={this.validate}>
        {/* {({ fieldProps, error }: any) => ( */}
        {({ fieldProps, error, valid }: any) => (
          <Fragment>
            {/* debug printing */}
            {console.log(
              "value of ",
              this.props.name,
              " is ",
              fieldProps.value
            )}
            {element === "input" ? (
              <Fragment>
                <TextField {...(inputProps_ as any)} {...fieldProps} />
                {this.props.needsValidation && (
                  <Fragment>
                    {this.state.progress !== undefined && (
                      //make wrapper out of this
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
            ) : element === "textarea" ? (
              // TODO: should be textarea (but can do later, not used for now)
              <TextField {...(inputProps_ as any)} {...fieldProps} />
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
                  // TODO: use loginField type instead of manual String if possible
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
