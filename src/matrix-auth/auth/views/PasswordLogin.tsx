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
import { ValidatedServerConfig } from "../util/AutoDiscoveryUtils";

import Form, { FormHeader } from "@atlaskit/form";
import Button from "@atlaskit/button";
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
  password: "";
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
      password: "",
    };
  }

  private onForgotPasswordClick = (ev: ButtonEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    this.props.onForgotPasswordClick?.();
  };

  private onSubmitForm = async (data: LoginFormData) => {
    const login = this.state.loginType;

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
          return error;
        }
        break;
    }

    this.props.onSubmit?.(
      data.username!,
      phoneCountry,
      phoneNumber,
      data.password!
    );
  };

  // TODO: use the Atlaskit Form getState instead of onchange.
  // Atlaskit is uncontrolled so onChange is better not to be used.
  private onLoginTypeChange = (data: any) => {
    const loginType = data.value;
    this.setState({ loginType });
    //this.props.onUsernameChanged?.(""); // Reset because email and username use the same state
    // CountlyAnalytics.instance.track("onboarding_login_type_changed", {
    //   loginType,
    // });
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
            className={classNames(classes)}
            name="email" // make it a little easier for browser's remember-password
            key="email"
            type="text"
            label="Email"
            placeholder="joe@example.com"
            //onChange={this.onUsernameChanged}
            //onFocus={this.onUsernameFocus}
            //onBlur={this.onUsernameBlur}
            disabled={this.props.disableSubmit}
            // autoFocus={autoFocus}
            // onValidate={this.onEmailValidate}
            isRequired
            ref={(field) => (this[LoginField.Email] = field)}
          />
        );
      case LoginField.MatrixId:
        // classes.error = !!this.props.loginIncorrect && !this.props.username;
        classes.error = !!this.props.loginIncorrect;
        return (
          <Field
            name="username" // make it a little easier for browser's remember-password
            key="usernameInput"
            type="text"
            label="Username"
            placeholder={"Username".toLocaleLowerCase()}
            disabled={this.props.disableSubmit}
            autoFocus={true}
            isRequired
            ref={(field) => (this[LoginField.MatrixId] = field)}
          />
        );
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
            className={classNames(classes)}
            name="phoneNumber"
            key="phoneinput"
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
      <Form<LoginFormData> onSubmit={this.onSubmitForm}>
        {({ formProps }) => (
          <form {...formProps}>
            {/* <FormHeader title="Log in" /> */}
            {loginType}
            {loginField}
            <Field
              type="password"
              name="password"
              key="password"
              label="Password"
              value={this.state.password}
              disabled={this.props.disableSubmit}
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
