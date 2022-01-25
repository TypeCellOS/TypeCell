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

import Button from "@atlaskit/button";
import Form from "@atlaskit/form";
import React from "react";
import AuthStyles from "../AuthStyles.module.css";
import Field from "../elements/Field";
import { ValidatedServerConfig } from "../util/AutoDiscoveryUtils";
import PassphraseField from "./PassphraseField";

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

// The type for the form data, represents the structure of the form,
// and also gets passed into the submit handler of the form.
interface RegistrationFormData {
  username?: string;
  password?: string;
  confirmPassword?: string;
  email?: string;
}

/*
 * A pure UI component which displays a registration form.
 */
export default class RegistrationForm extends React.PureComponent<IProps> {
  [RegistrationField.Username]: Field<string> | null = null;
  [RegistrationField.Password]: Field<string> | null = null;
  [RegistrationField.PasswordConfirm]: Field<string> | null = null;
  [RegistrationField.Email]: Field<string> | null = null;
  [RegistrationField.PhoneNumber]: Field<string> | null = null;

  static defaultProps = {
    onValidationChange: console.error,
    canSubmit: true,
  };

  constructor(props: IProps) {
    super(props);

    this.state = {};
  }

  private onSubmit = (data: RegistrationFormData) => {
    if (!this.props.canSubmit) return;

    let username = (data.username || "").trim();
    let password = data.password || "";
    let email = (data.email || "").trim();

    this.props.onRegisterClick({ username, password, email });
  };

  private onPasswordConfirmValidate = (value?: string) => {
    if (
      (value || "") === (this[RegistrationField.Password] as any).input.value
    ) {
      return {};
    } else {
      return { error: "Passwords don't match" };
    }
  };

  private onUsernameValidate = (value?: string) => {
    if (!value) {
      return { error: "Enter username" };
    } else if (!/^[a-z0-9_-]+$/.test(value)) {
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

  // TODO: email for registration has yet to be implemented
  private renderEmail() {
    if (!this.showEmail()) {
      return null;
    }
    const isRequired = this.authStepIsRequired("m.login.email.identity");
    const emailPlaceholder = isRequired ? "Email" : "Email (optional)";
    return (
      <Field
        ref={(field) => (this[RegistrationField.Email] = field)}
        type="email"
        isRequired={isRequired}
        defaultValue={this.props.defaultEmail}
        label={emailPlaceholder}
        name="email"
        // value={this.state.email}
      />
    );
  }

  private renderPassword() {
    return (
      <PassphraseField
        minScore={PASSWORD_MIN_SCORE}
        fieldRef={(field) => (this[RegistrationField.Password] = field)}
        defaultValue={this.props.defaultPassword}
      />
    );
  }

  renderPasswordConfirm() {
    console.log((this[RegistrationField.Password] as any)?.input.value.length);
    return (
      <Field
        key="password"
        type="password"
        name="confirmPassword"
        label="Confirm password"
        defaultValue={this.props.defaultPassword}
        isRequired
        onValidate={this.onPasswordConfirmValidate}
        validMessage="Password Matches"
        ref={(field) => (this[RegistrationField.PasswordConfirm] = field)}
        showErrorMsg
        showValidMsg="if-not-empty"
      />
    );
  }

  renderUsername() {
    return (
      <Field
        key="username"
        name="username"
        type="text"
        label={"Username"}
        placeholder={"Username"}
        defaultValue={this.props.defaultUsername}
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
        className={AuthStyles.AuthButton}
        type="submit"
        appearance="primary"
        shouldFitContainer
        value={"Register"}
        isDisabled={!this.props.canSubmit}>
        Register
      </Button>
    );

    // TODO email registration has yet to be implemented
    // let emailHelperText: JSX.Element = <></>;
    // if (this.showEmail()) {
    //   if (this.showPhoneNumber()) {
    //     emailHelperText = (
    //       <div>
    //         Add an email to be able to reset your password. Use email or phone
    //         to optionally be discoverable by existing contacts.
    //       </div>
    //     );
    //   } else {
    //     emailHelperText = (
    //       <div>
    //         Add an email to be able to reset your password. Use email to
    //         optionally be discoverable by existing contacts.
    //       </div>
    //     );
    //   }
    // }

    return (
      // Renders an Atlaskit form together with many other components,
      // mainly Atlaskit Fields. This is an uncontrolled form, but we pass
      // many props into the Field components, while Atlaskit does most of the
      // front-end like handling focus, blurring, validation error rendering, etc.
      // See Atlaskits documentation for more detailed information.
      <Form<RegistrationFormData> onSubmit={this.onSubmit}>
        {({ formProps }) => (
          <form {...formProps}>
            {/* <FormHeader title="Register" /> */}
            {this.renderUsername()}
            {this.renderEmail()}
            {this.renderPassword()}
            {this.renderPasswordConfirm()}
            {/* {this.renderPhoneNumber()} */}
            {/* {emailHelperText} */}
            {registerButton}
          </form>
        )}
      </Form>
    );
  }
}
