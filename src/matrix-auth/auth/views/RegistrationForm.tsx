/*
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>
Copyright 2015, 2016, 2017, 2018, 2019, 2020 The Matrix.org Foundation C.I.C.

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

import React, { ChangeEvent } from "react";

import PassphraseField from "./PassphraseField";

import Field from "../elements/Field";
import { ValidatedServerConfig } from "../util/AutoDiscoveryUtils";
import Form, { FormHeader } from "@atlaskit/form";
import Button from "@atlaskit/button";
import { FormState } from "final-form";

enum RegistrationField {
  Email = "field_email",
  PhoneNumber = "field_phone_number",
  Username = "field_username",
  Password = "field_password",
  PasswordConfirm = "field_password_confirm",
}

export const PASSWORD_MIN_SCORE = 3; // safely unguessable: moderate protection from offline slow-hash scenario.

interface IProps {
  // Values pre-filled in the input boxes when the component loads
  defaultEmail?: string;
  defaultPhoneCountry?: string;
  defaultPhoneNumber?: string;
  defaultUsername?: string;
  defaultPassword?: string;
  flows: {
    stages: string[];
  }[];
  serverConfig: ValidatedServerConfig;
  canSubmit?: boolean;

  onRegisterClick(params: {
    username: string;
    password: string;
    email?: string;
    phoneCountry?: string;
    phoneNumber?: string;
  }): void;
  onEditServerDetailsClick?(): void;
}

interface IState {
  getState?: () => FormState<RegistrationFormData>;
  passwordToConfirm: string;
}

interface RegistrationFormData {
  username?: string;
  password?: string;
  confirmPassword?: string;
}

/*
 * A pure UI component which displays a registration form.
 */
export default class RegistrationForm extends React.PureComponent<
  IProps,
  IState
> {
  [RegistrationField.Username]: Field | null = null;
  [RegistrationField.Password]: Field | null = null;
  [RegistrationField.PasswordConfirm]: Field | null = null;
  [RegistrationField.Email]: Field | null = null;
  [RegistrationField.PhoneNumber]: Field | null = null;
  [RegistrationField.Password]: Field | null = null;

  static defaultProps = {
    onValidationChange: console.error,
    canSubmit: true,
  };

  constructor(props: IProps) {
    super(props);

    this.state = {
      passwordToConfirm: "",
    };
  }

  private onSubmit = (data: RegistrationFormData) => {
    if (!this.props.canSubmit) return;

    // This is the second check for equality, because there is a current
    // bug where the first check does not work.
    if (data.password !== data.confirmPassword) {
      return { confirmPassword: "Passwords don't match" };
    }

    this.doSubmit(data);
  };

  private doSubmit(data: RegistrationFormData) {
    let username = data.username || "";
    let password = data.password || "";

    this.props.onRegisterClick({ username, password });
  }

  private onPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const password = event.target.value;
    // console.log("setting state to ", password);
    this.setState({ passwordToConfirm: password });
  };

  private onPasswordConfirmValidate = (value?: string) => {
    // console.log("confirmPassword value is ", value);
    if (value && value.length && value === this.state.passwordToConfirm) {
      return {};
    } else {
      return { error: "Passwords don't match" };
    }
  };

  private onUsernameValidate = (value?: string) => {
    if (!value) {
      return { error: "Enter username" };
    } else if (!/^[a-z0-9_\-]+$/.test(value)) {
      return { error: "Some characters are not allowed" };
    } else {
      return {};
    }
  };

  /**
   * A step is required if all flows include that step.
   *
   * @param {string} step A stage name to check
   * @returns {boolean} Whether it is required
   */
  private authStepIsRequired(step: string) {
    return this.props.flows.every((flow) => {
      return flow.stages.includes(step);
    });
  }

  /**
   * A step is used if any flows include that step.
   *
   * @param {string} step A stage name to check
   * @returns {boolean} Whether it is used
   */
  private authStepIsUsed(step: string) {
    return this.props.flows.some((flow) => {
      return flow.stages.includes(step);
    });
  }

  private showEmail() {
    if (!this.authStepIsUsed("m.login.email.identity")) {
      return false;
    }
    return true;
  }

  private showPhoneNumber() {
    return false;
    // const threePidLogin = !SdkConfig.get().disable_3pid_login;
    // if (!threePidLogin || !this.authStepIsUsed("m.login.msisdn")) {
    //   return false;
    // }
    // return true;
  }

  private renderEmail() {
    if (!this.showEmail()) {
      return null;
    }
    const emailPlaceholder = this.authStepIsRequired("m.login.email.identity")
      ? "Email"
      : "Email (optional)";
    return (
      <Field
        ref={(field) => (this[RegistrationField.Email] = field)}
        type="text"
        label={emailPlaceholder}
        // value={this.state.email}
      />
    );
  }

  private renderPassword() {
    return (
      <PassphraseField
        minScore={PASSWORD_MIN_SCORE}
        fieldRef={(field) => (this[RegistrationField.Password] = field)}
        onChange={this.onPasswordChange}
      />
    );
  }

  renderPasswordConfirm(getState: () => FormState<RegistrationFormData>) {
    return (
      <Field
        type="password"
        name="confirmPassword"
        label="Confirm password"
        isRequired
        onValidate={this.onPasswordConfirmValidate}
        validMessage="Password Matches"
        ref={(field) => (this[RegistrationField.PasswordConfirm] = field)}
        showErrorMsg
        showValidMsg
      />
    );
  }

  renderUsername() {
    return (
      <Field
        name="username"
        type="text"
        label={"Username"}
        placeholder={"Username".toLocaleLowerCase()}
        isRequired
        onValidate={this.onUsernameValidate}
        autoFocus={true}
        showErrorMsg
        ref={(field) => (this[RegistrationField.Username] = field)}
      />
    );
  }

  render() {
    const registerButton = (
      <Button
        style={{ margin: "16px 0 0 0" }}
        type="submit"
        appearance="primary"
        value={"Register"}
        isDisabled={!this.props.canSubmit}>
        Register
      </Button>
    );

    let emailHelperText: JSX.Element = <></>;
    if (this.showEmail()) {
      if (this.showPhoneNumber()) {
        emailHelperText = (
          <div>
            Add an email to be able to reset your password. Use email or phone
            to optionally be discoverable by existing contacts.
          </div>
        );
      } else {
        emailHelperText = (
          <div>
            Add an email to be able to reset your password. Use email to
            optionally be discoverable by existing contacts.
          </div>
        );
      }
    }

    return (
      <Form<RegistrationFormData> onSubmit={this.onSubmit}>
        {({ formProps, getState }) => (
          <form {...formProps}>
            {/* <FormHeader title="Register" /> */}
            {this.renderUsername()}
            {this.renderPassword()}
            {this.renderPasswordConfirm(getState)}
            {this.renderEmail()}
            {/* {this.renderPhoneNumber()} */}
            {/* {emailHelperText} */}
            {registerButton}
          </form>
        )}
      </Form>
    );
  }
}
