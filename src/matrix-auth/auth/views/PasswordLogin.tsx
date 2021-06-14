/*
Copyright 2015, 2016, 2017, 2019 The Matrix.org Foundation C.I.C.

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

// TODO: If AtlasKit always does reliable per-field validation check
// and doesn't do validation on the initial state of the forms(empty),
// then consider doing this submission check in the per-field validation
// instead.

import classNames from "classnames";
import React from "react";
import AccessibleButton, { ButtonEvent } from "../elements/AccessibleButton";
import Field from "../elements/Field";
import withValidation, { IFieldState } from "../elements/Validation";
import { ValidatedServerConfig } from "../util/AutoDiscoveryUtils";
import { looksValidEmail } from "../util/email";
import { Country } from "../util/phonenumber";

import Form from "@atlaskit/form";
import Button from "@atlaskit/button";
// For validating phone numbers without country codes
const PHONE_NUMBER_REGEX = /^[0-9()\-\s]*$/;

interface IProps {
  username: string; // also used for email address
  phoneCountry: string | undefined;
  phoneNumber: string;

  serverConfig: ValidatedServerConfig;
  loginIncorrect?: boolean;
  disableSubmit?: boolean;
  busy?: boolean;

  //onSubmit(data: formInputs): formInputs | undefined;
  onSubmit(
    username: string,
    phoneCountry: string | undefined,
    phoneNumber: string | undefined,
    password: string
  ): void;
  onUsernameChanged?(username: string): void;
  onUsernameBlur?(username: string): void;
  onPhoneCountryChanged?(phoneCountry: string): void;
  onPhoneNumberChanged?(phoneNumber: string): void;
  onForgotPasswordClick?(): void;
}

interface IState {
  fieldValid: Partial<Record<LoginField, boolean>>;
  loginType: LoginField.Email | LoginField.MatrixId | LoginField.Phone;
  password: "";
}

enum LoginField {
  Email = "login_field_email",
  MatrixId = "login_field_mxid",
  Phone = "login_field_phone",
  Password = "login_field_phone",
}

type formInputs = {
  username: string | undefined;
  email: string | undefined;
  phoneNumber: string | undefined;
  password: string | undefined;
};

/*
 * A pure UI component which displays a username/password form.
 * The email/username/phone fields are fully-controlled, the password field is not.
 */
export default class PasswordLogin extends React.PureComponent<IProps, IState> {
  [LoginField.Email]: Field | null = null;
  [LoginField.MatrixId]: Field | null = null;
  [LoginField.Phone]: Field | null = null;
  [LoginField.Password]: Field | null = null;

  constructor(props: IProps) {
    super(props);
    this.state = {
      // Field error codes by field ID
      fieldValid: {},
      loginType: LoginField.MatrixId,
      password: "",
    };
  }

  private onForgotPasswordClick = (ev: ButtonEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    this.props.onForgotPasswordClick?.();
  };

  // TODO: figure type for event data from AtlasKitForm
  private onSubmitForm = async (data: formInputs) => {
    console.log("form data", data);

    const login = this.state.loginType;
    console.log(login);

    // TODO: add phonenumber empty case
    const error = {
      username:
        login === LoginField.MatrixId && data.username
          ? undefined
          : "Enter a username",
      email:
        login === LoginField.Email && data.email ? undefined : "Enter an email",
      password: data.password ? undefined : "Enter a password",
    };

    // TODO: remove placeholder
    let username: string | undefined = "";
    let phoneCountry: string | undefined;
    let phoneNumber: string | undefined;

    switch (login) {
      case LoginField.MatrixId:
        username = data.username;
        if (error.username !== undefined || error.password !== undefined) {
          console.log("empty uname found");
          return error;
        }
        break;
      case LoginField.Email:
        username = data.email;
        if (error.email !== undefined || error.password !== undefined) {
          return error;
        }
        break;
      default:
        if (error.password !== undefined) {
          console.log("empty password found");
          return error;
        }
        break;
    }

    console.log("checkpoint to send to onSubmit");

    this.props.onSubmit?.(
      data.username!,
      phoneCountry,
      phoneNumber,
      data.password!
    );
  };

  // The input is not controlled by Field anymore. The validation
  // function gets called directly from AtlasKitField instead.
  // private onUsernameChanged = (ev: React.ChangeEvent<any>) => {
  //   this.props.onUsernameChanged?.(ev.target.value);
  // };

  private onUsernameFocus = () => {
    if (this.state.loginType === LoginField.MatrixId) {
      // CountlyAnalytics.instance.track("onboarding_login_mxid_focus");
    } else {
      // CountlyAnalytics.instance.track("onboarding_login_email_focus");
    }
  };

  private onUsernameBlur = (ev: React.FocusEvent<any>) => {
    if (this.state.loginType === LoginField.MatrixId) {
      // CountlyAnalytics.instance.track("onboarding_login_mxid_blur");
    } else {
      // CountlyAnalytics.instance.track("onboarding_login_email_blur");
    }
    this.props.onUsernameBlur?.(ev.target.value);
  };

  private onLoginTypeChange = (data: any) => {
    const loginType = data.value;
    this.setState({ loginType });
    this.props.onUsernameChanged?.(""); // Reset because email and username use the same state
    // CountlyAnalytics.instance.track("onboarding_login_type_changed", {
    //   loginType,
    // });
  };

  private onPhoneCountryChanged = (country: Country) => {
    this.props.onPhoneCountryChanged?.(country.iso2);
  };

  private onPhoneNumberChanged = (ev: React.ChangeEvent<any>) => {
    this.props.onPhoneNumberChanged?.(ev.target.value);
  };

  private onPhoneNumberFocus = () => {
    // CountlyAnalytics.instance.track("onboarding_login_phone_number_focus");
  };

  private onPhoneNumberBlur = () => {
    // CountlyAnalytics.instance.track("onboarding_login_phone_number_blur");
  };

  // The input is not controlled by Field anymore. It's controlled internally
  // and the values get propgated within AtlasKit Components
  // private onPasswordChanged = (ev: React.ChangeEvent<any>) => {
  //   this.setState({ password: ev.target.value });
  // };

  // AtlasKit handles initiates validations now
  // private async verifyFieldsBeforeSubmit() {
  //   // Blur the active element if any, so we first run its blur validation,
  //   // which is less strict than the pass we're about to do below for all fields.
  //   const activeElement = document.activeElement as HTMLElement;
  //   if (activeElement) {
  //     activeElement.blur();
  //   }

  //   const fieldIDsInDisplayOrder = [this.state.loginType, LoginField.Password];

  //   // Run all fields with stricter validation that no longer allows empty
  //   // values for required fields.
  //   for (const fieldID of fieldIDsInDisplayOrder) {
  //     const field = this[fieldID];
  //     if (!field) {
  //       continue;
  //     }
  //     // We must wait for these validations to finish before queueing
  //     // up the setState below so our setState goes in the queue after
  //     // all the setStates from these validate calls (that's how we
  //     // know they've finished).

  //     // We don't call the initial validate handler anymore
  //     //await field.validate();
  //   }

  //   // Validation and state updates are async, so we need to wait for them to complete
  //   // first. Queue a `setState` callback and wait for it to resolve.
  //   await new Promise<void>((resolve) => this.setState({}, resolve));

  //   if (this.allFieldsValid()) {
  //     return true;
  //   }

  //   const invalidField = this.findFirstInvalidField(fieldIDsInDisplayOrder);

  //   if (!invalidField) {
  //     return true;
  //   }

  //   // Focus the first invalid field and show feedback in the stricter mode
  //   // that no longer allows empty values for required fields.
  //   invalidField.focus();
  //   invalidField.validate();
  //   return false;
  // }

  private allFieldsValid() {
    const keys = Object.keys(this.state.fieldValid);
    for (let i = 0; i < keys.length; ++i) {
      if (!this.state.fieldValid[keys[i] as LoginField]) {
        return false;
      }
    }
    return true;
  }

  private findFirstInvalidField(fieldIDs: LoginField[]) {
    for (const fieldID of fieldIDs) {
      if (!this.state.fieldValid[fieldID] && this[fieldID]) {
        return this[fieldID];
      }
    }
    return null;
  }

  private markFieldValid(fieldID: LoginField, valid: boolean) {
    const { fieldValid } = this.state;
    fieldValid[fieldID] = valid;
    this.setState({
      fieldValid,
    });
  }

  private validateUsernameRules = withValidation<this, void>({
    rules: [
      {
        key: "required",
        test({ value, allowEmpty }) {
          return allowEmpty || !!value;
        },
        invalid: () => "Enter username",
      },
    ],
  });

  // username on login has no validation
  // onSubmitForm handles empty submission
  // private onUsernameValidate = async (value?: string) => {
  //   // TODO: consider alternative to this, probably not needed entirely
  //   //const result = await this.validateUsernameRules(fieldState);
  //   //this.markFieldValid(LoginField.MatrixId, !!result.valid);
  //   return undefined;
  // };

  private validateEmailRules = withValidation<this, void>({
    rules: [
      {
        key: "required",
        test({ value, allowEmpty }) {
          return allowEmpty || !!value;
        },
        invalid: () => "Enter email address",
      },
      {
        key: "email",
        test: ({ value }) => !value || looksValidEmail(value),
        invalid: () => "Doesn't look like a valid email address",
      },
    ],
  });

  // TODO: reconsider if removing asynchronicity is a good idea.
  private onEmailValidate = (value?: string) => {
    if (!value) {
      return undefined;
    }
    if (!looksValidEmail(value)) {
      return "INVALID_EMAIL";
    }
    return undefined;
  };

  private validatePhoneNumberRules = withValidation<this, void>({
    rules: [
      {
        key: "required",
        test({ value, allowEmpty }) {
          return allowEmpty || !!value;
        },
        invalid: () => "Enter phone number",
      },
      {
        key: "number",
        test: ({ value }) => !value || PHONE_NUMBER_REGEX.test(value),
        invalid: () =>
          "That phone number doesn't look quite right, please check and try again",
      },
    ],
  });

  private onPhoneNumberValidate = async (fieldState: IFieldState) => {
    const result = await this.validatePhoneNumberRules(fieldState);
    this.markFieldValid(LoginField.Password, !!result.valid);
    return result;
  };

  private validatePasswordRules = withValidation<this, void>({
    rules: [
      {
        key: "required",
        test({ value, allowEmpty }) {
          return allowEmpty || !!value;
        },
        invalid: () => "Enter password",
      },
    ],
  });

  // password on login has no validation
  // onSubmitForm handles empty submission
  // private onPasswordValidate = async (fieldState: IFieldState) => {
  //   const result = await this.validatePasswordRules(fieldState);
  //   this.markFieldValid(LoginField.Password, !!result.valid);
  //   return result;
  // };

  private renderLoginField(loginType: IState["loginType"], autoFocus: boolean) {
    const classes = {
      error: false,
    };

    switch (loginType) {
      case LoginField.Email:
        classes.error = !!this.props.loginIncorrect && !this.props.username;
        return (
          <Field
            className={classNames(classes)}
            name="email" // make it a little easier for browser's remember-password
            key={"email"}
            type="text"
            label={"Email"}
            placeholder="joe@example.com"
            value={this.props.username}
            //onChange={this.onUsernameChanged}
            //onFocus={this.onUsernameFocus}
            //onBlur={this.onUsernameBlur}
            disabled={this.props.disableSubmit}
            autoFocus={autoFocus}
            onValidate={this.onEmailValidate}
            isRequired={true}
            ref={(field) => (this[LoginField.Email] = field)}
          />
        );
      case LoginField.MatrixId:
        classes.error = !!this.props.loginIncorrect && !this.props.username;
        return (
          <Field
            className={classNames(classes)}
            name="username" // make it a little easier for browser's remember-password
            key={"username_input"}
            type="text"
            label={"Username"}
            placeholder={"Username".toLocaleLowerCase()}
            //onChange={this.onUsernameChanged}
            //onFocus={this.onUsernameFocus}
            //onBlur={this.onUsernameBlur}
            disabled={this.props.disableSubmit}
            autoFocus={autoFocus}
            //onValidate={this.onUsernameValidate}
            isRequired={true}
            ref={(field) => (this[LoginField.MatrixId] = field)}
          />
        );
      case LoginField.Phone: {
        classes.error = !!this.props.loginIncorrect && !this.props.phoneNumber;

        // const phoneCountry = (
        //   <CountryDropdown
        //     value={this.props.phoneCountry}
        //     isSmall={true}
        //     showPrefix={true}
        //     onOptionChange={this.onPhoneCountryChanged}
        //   />
        // );

        return (
          <Field
            className={classNames(classes)}
            name="phoneNumber"
            key={"phone_input"}
            type="text"
            label={"Phone"}
            value={this.props.phoneNumber}
            // prefixComponent={phoneCountry}
            onChange={this.onPhoneNumberChanged}
            onFocus={this.onPhoneNumberFocus}
            onBlur={this.onPhoneNumberBlur}
            disabled={this.props.disableSubmit}
            autoFocus={autoFocus}
            //onValidate={this.onPhoneNumberValidate}
            ref={(field) => (this[LoginField.Password] = field)}
          />
        );
      }
    }
  }

  private isLoginEmpty() {
    switch (this.state.loginType) {
      case LoginField.Email:
      case LoginField.MatrixId:
        return !this.props.username;
      case LoginField.Phone:
        return !this.props.phoneCountry || !this.props.phoneNumber;
    }
  }

  render() {
    let forgotPasswordJsx: any;
    console.log("forgotPasswordclick: ", this.props.onForgotPasswordClick);
    if (this.props.onForgotPasswordClick) {
      forgotPasswordJsx = (
        <AccessibleButton
          className="mx_Login_forgot"
          disabled={this.props.busy}
          kind="link"
          onClick={this.onForgotPasswordClick}>
          Forgot password?
        </AccessibleButton>
      );
    }

    const pwFieldClass = classNames({
      error: this.props.loginIncorrect && !this.isLoginEmpty(), // only error password if error isn't top field
    });

    // If login is empty, autoFocus login, otherwise autoFocus password.
    // this is for when auto server discovery remounts us when the user tries to tab from username to password
    const autoFocusPassword = !this.isLoginEmpty();
    const loginField = this.renderLoginField(
      this.state.loginType,
      !autoFocusPassword
    );

    let loginType: any;
    //!SdkConfig.get().disable_3pid_login) {
    if (true) {
      loginType = (
        <div className="mx_Login_type_container">
          {/* <label className="mx_Login_type_label">{"Sign in with"}</label> */}
          <Field
            element="select"
            name="select"
            value={this.state.loginType}
            onChange={this.onLoginTypeChange}
            disabled={this.props.disableSubmit}
            label={"Sign in with"}>
            <option key={LoginField.MatrixId} value={LoginField.MatrixId}>
              {"Username"}
            </option>
            <option key={LoginField.Email} value={LoginField.Email}>
              {"Email address"}
            </option>
            <option key={LoginField.Password} value={LoginField.Password}>
              {"Phone"}
            </option>
          </Field>
        </div>
      );
    }

    return (
      <Form onSubmit={this.onSubmitForm}>
        {({ formProps }) => (
          <form {...formProps}>
            {loginType}
            {loginField}
            <Field
              className={pwFieldClass}
              type="password"
              name="password"
              key={"password_input"}
              label={"Password"}
              value={this.state.password}
              //onChange={this.onPasswordChanged}
              disabled={this.props.disableSubmit}
              autoFocus={autoFocusPassword}
              //onValidate={this.onPasswordValidate}
              ref={(field) => (this[LoginField.Password] = field)}
            />
            {forgotPasswordJsx}
            {!this.props.busy && (
              <Button
                style={{ margin: "16px 0 0 0" }}
                type="submit"
                appearance="primary"
                isDisabled={this.props.disableSubmit}>
                Sign in
              </Button>
            )}
          </form>
        )}
      </Form>
    );
  }
}
