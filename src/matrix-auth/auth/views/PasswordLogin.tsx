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

import classNames from "classnames";
import React from "react";
import AccessibleButton, { ButtonEvent } from "../elements/AccessibleButton";
import Field from "../elements/Field";
import { ValidatedServerConfig } from "../util/AutoDiscoveryUtils";

import Form, { FormHeader } from "@atlaskit/form";

import Button, { LoadingButton } from "@atlaskit/button";
import { looksValidEmail } from "../util/email";
// For validating phone numbers without country codes
const PHONE_NUMBER_REGEX = /^[0-9()\-\s]*$/;

interface IProps {
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

interface LoginFormData {
  username?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
}

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

  private onForgotPasswordClick = (ev: ButtonEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    this.props.onForgotPasswordClick?.();
  };

  private onSubmitForm = async (data: LoginFormData) => {
    let usernameOrEmail: string = "";

    const login = this.state.loginType;

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
    //this.props.onUsernameChanged?.(""); // Reset because email and username use the same state
    // CountlyAnalytics.instance.track("onboarding_login_type_changed", {
    //   loginType,
    // });
  };

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
            name="email"
            type="text"
            label="Email"
            placeholder="joe@example.com"
            disabled={this.props.disableSubmit}
            isRequired
            showErrorMsg
            onValidate={this.onEmailValidate}
            ref={(field) => (this[LoginField.Email] = field)}
          />
        );
      case LoginField.MatrixId:
        // classes.error = !!this.props.loginIncorrect && !this.props.username;
        classes.error = !!this.props.loginIncorrect;
        return (
          <Field
            name="username" // make it a little easier for browser's remember-password
            type="text"
            label="Username"
            placeholder={"Username".toLocaleLowerCase()}
            disabled={this.props.disableSubmit}
            onValidate={this.onUsernameValidate}
            autoFocus={true}
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
      <Form<LoginFormData> onSubmit={this.onSubmitForm}>
        {({ formProps }) => (
          <form {...formProps}>
            {/* <FormHeader title="Log in" /> */}
            {loginType}
            {loginField}
            <Field
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
