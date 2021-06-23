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

import React from "react";
import AccessibleButton, { ButtonEvent } from "../elements/AccessibleButton";
import Field, { IValidationResult } from "../elements/Field";
import { ValidatedServerConfig } from "../util/AutoDiscoveryUtils";

import Form from "@atlaskit/form";

import Button, { LoadingButton } from "@atlaskit/button";
import { looksValidEmail } from "../util/email";
// For validating phone numbers without country codes
const PHONE_NUMBER_REGEX = /^[0-9()\-\s]*$/;

interface IProps {
  defaultUsernameOrEmail: string;
  defaultPhoneCountry?: string;
  defaultPhoneNumber?: string;

  serverConfig: ValidatedServerConfig;
  loginIncorrect?: boolean;
  disableSubmit?: boolean;
  busy?: boolean;

  onSubmit(
    username: string,
    phoneCountry: string | undefined,
    phoneNumber: string | undefined,
    password: string
  ): void;
  onForgotPasswordClick?(): void;
}

interface IState {
  loginType: LoginField.Email | LoginField.MatrixId | LoginField.Phone;
}

enum LoginField {
  Email = "login_field_email",
  MatrixId = "login_field_mxid",
  Phone = "login_field_phone",
  Password = "login_field_phone",
}

// The type for the form data, represents the structure of the form,
// and also gets passed into the submit handler of the form.
type LoginFormData = {
  username?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
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
      loginType: LoginField.MatrixId,
    };
  }

  // TODO forgot password is untouched Matrix code
  private onForgotPasswordClick = (ev: ButtonEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    this.props.onForgotPasswordClick?.();
  };

  private onSubmitForm = async (data: LoginFormData) => {
    let usernameOrEmail: string = "";

    const login = this.state.loginType;

    // set usernameOrEmail to either username or email
    if (login === LoginField.MatrixId) {
      usernameOrEmail = data.username ? data.username : "";
    } else if (login === LoginField.Email) {
      usernameOrEmail = data.email ? data.email : "";
    }

    // TODO: phone signin has yet to be implemented
    let phoneCountry: string | undefined;
    let phoneNumber: string | undefined;

    const password = data.password ? data.password : "";

    this.props.onSubmit?.(usernameOrEmail, phoneCountry, phoneNumber, password);
  };

  private onLoginTypeChange = (data: any) => {
    const loginType = data.value;
    this.setState({ loginType });
    // CountlyAnalytics.instance.track("onboarding_login_type_changed", {
    //   loginType,
    // });
  };

  // Field-level validations
  // these validation functions take the field value and should return
  // an "error" if it is not valid, or undefined if it is valid.
  // If ShowErrorMsg is set in the corresponding Field, the error string
  // will be displayed when the field is invalid. Similarly, if ShowValidMsg
  // is set in the corresponding Field, a validation message will be displayed
  // if the field is valid. The valid message is also set in the Field props.
  // Additionally, if a "progress"(range 0-1) is returned with the "error",
  // a progress bar will be rendered under the field.

  private onUsernameValidate = (value?: string) => {
    if (!value) {
      return { error: "Enter username" };
    } else {
      return {};
    }
  };

  private onEmailValidate = (value?: string) => {
    if (!value) {
      return { error: "Enter e-mail" };
    } else if (!looksValidEmail(value)) {
      return { error: "Doesn't look like a valid email address" };
    } else {
      return {};
    }
  };

  private onPasswordValidate = (value?: string) => {
    if (!value) {
      return { error: "Enter password" };
    } else {
      return {};
    }
  };

  private renderLoginField(loginType: IState["loginType"]) {
    const classes = {
      error: false,
    };

    switch (loginType) {
      case LoginField.Email:
        // classes.error = !!this.props.loginIncorrect && !this.props.username;
        classes.error = !!this.props.loginIncorrect;
        return (
          <Field
            key="email"
            name="email"
            type="text"
            label="Email"
            placeholder="joe@example.com"
            disabled={this.props.disableSubmit}
            defaultValue={this.props.defaultUsernameOrEmail}
            isRequired
            onValidate={this.onEmailValidate}
            ref={(field) => (this[LoginField.Email] = field)}
          />
        );
      case LoginField.MatrixId:
        // classes.error = !!this.props.loginIncorrect && !this.props.username;
        classes.error = !!this.props.loginIncorrect;
        return (
          <Field
            key="username"
            name="username" // make it a little easier for browser's remember-password
            type="text"
            label="Username"
            placeholder={"Username".toLocaleLowerCase()}
            disabled={this.props.disableSubmit}
            onValidate={this.onUsernameValidate}
            autoFocus={true}
            defaultValue={this.props.defaultUsernameOrEmail}
            isRequired
            showErrorMsg
            ref={(field) => (this[LoginField.MatrixId] = field)}
          />
        );

      // TODO: Phone signin has yet to be implemented
      case LoginField.Phone: {
        // classes.error = !!this.props.loginIncorrect && !this.props.phoneNumber;
        classes.error = !!this.props.loginIncorrect;

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
            // key="phoneNumber"
            name="phoneNumber"
            type="text"
            label="Phone"
            // prefixComponent={phoneCountry}
            disabled={this.props.disableSubmit}
            // autoFocus={autoFocus}
            //onValidate={this.onPhoneNumberValidate}
            ref={(field) => (this[LoginField.Password] = field)}
          />
        );
      }
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

    const loginField = this.renderLoginField(this.state.loginType);

    let loginType: any;
    //!SdkConfig.get().disable_3pid_login) {
    if (true) {
      loginType = (
        <div className="mx_Login_type_container">
          <Field
            key="select"
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
      // Renders an Atlaskit form together with many other components,
      // mainly Atlaskit Fields. This is an uncontrolled form, but we pass
      // many props into the Field components, while Atlaskit does most of the
      // front-end like handling focus, blurring, validation error rendering, etc.
      // See Atlaskits documentation for more detailed information.
      <Form<LoginFormData> onSubmit={this.onSubmitForm}>
        {({ formProps }) => (
          <form {...formProps}>
            {/* <FormHeader title="Log in" /> */}
            {loginType}
            {loginField}
            <Field
              key="password"
              type="password"
              name="password"
              label="Password"
              disabled={this.props.disableSubmit}
              showErrorMsg
              onValidate={this.onPasswordValidate}
              ref={(field) => (this[LoginField.Password] = field)}
            />
            {forgotPasswordJsx}
            {!this.props.busy && (
              // <LoadingButton isLoading={this.props.busy}>
              <Button
                // TODO move styles to module
                style={{ margin: "16px 0 0 0" }}
                type="submit"
                appearance="primary"
                isDisabled={this.props.disableSubmit}>
                Sign in
              </Button>
              // </LoadingButton>
            )}
          </form>
        )}
      </Form>
    );
  }
}
