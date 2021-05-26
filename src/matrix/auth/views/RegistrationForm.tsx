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

import React from "react";
import withValidation, {
  IFieldState,
  IValidationResult,
} from "../elements/Validation";

import PassphraseField from "./PassphraseField";

import Field from "../elements/Field";
import { ValidatedServerConfig } from "../util/AutoDiscoveryUtils";
import { looksValidEmail } from "../util/email";
import { phoneNumberLooksValid } from "../util/phonenumber";

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
  }): Promise<void>;
  onEditServerDetailsClick?(): void;
}

interface IState {
  // Field error codes by field ID
  fieldValid: Partial<Record<RegistrationField, boolean>>;
  // The ISO2 country code selected in the phone number entry
  phoneCountry?: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  passwordConfirm: string;
  passwordComplexity?: number;
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
      fieldValid: {},
      phoneCountry: this.props.defaultPhoneCountry,
      username: this.props.defaultUsername || "",
      email: this.props.defaultEmail || "",
      phoneNumber: this.props.defaultPhoneNumber || "",
      password: this.props.defaultPassword || "",
      passwordConfirm: this.props.defaultPassword || "",
      passwordComplexity: undefined,
    };
  }

  private onSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    ev.persist();

    if (!this.props.canSubmit) return;

    const allFieldsValid = await this.verifyFieldsBeforeSubmit();
    if (!allFieldsValid) {
      return;
    }

    if (this.state.email === "") {
      if (this.showEmail()) {
        console.error("not implemented (email dialog)");
        return;
        // Modal.createTrackedDialog(
        //   "Email prompt dialog",
        //   "",
        //   RegistrationEmailPromptDialog,
        //   {
        //     onFinished: async (confirmed: boolean, email?: string) => {
        //       if (confirmed) {
        //         this.setState(
        //           {
        //             email,
        //           },
        //           () => {
        //             this.doSubmit(ev);
        //           }
        //         );
        //       }
        //     },
        //   }
        // );
      } else {
        // user can't set an e-mail so don't prompt them to
        this.doSubmit(ev);
        return;
      }
    } else {
      this.doSubmit(ev);
    }
  };

  private doSubmit(ev: React.FormEvent<HTMLFormElement>) {
    const email = this.state.email.trim();
    const promise = this.props.onRegisterClick({
      username: this.state.username.trim(),
      password: this.state.password.trim(),
      email: email,
      phoneCountry: this.state.phoneCountry,
      phoneNumber: this.state.phoneNumber,
    });

    if (promise) {
      (ev.target as HTMLFormElement).disabled = true;
      promise.finally(function () {
        (ev.target as HTMLFormElement).disabled = false;
      });
    }
  }

  private async verifyFieldsBeforeSubmit() {
    // Blur the active element if any, so we first run its blur validation,
    // which is less strict than the pass we're about to do below for all fields.
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      activeElement.blur();
    }

    const fieldIDsInDisplayOrder = [
      RegistrationField.Username,
      RegistrationField.Password,
      RegistrationField.PasswordConfirm,
      RegistrationField.Email,
      RegistrationField.PhoneNumber,
    ];

    // Run all fields with stricter validation that no longer allows empty
    // values for required fields.
    for (const fieldID of fieldIDsInDisplayOrder) {
      const field = this[fieldID];
      if (!field) {
        continue;
      }
      // We must wait for these validations to finish before queueing
      // up the setState below so our setState goes in the queue after
      // all the setStates from these validate calls (that's how we
      // know they've finished).
      await field.validate({ allowEmpty: false });
    }

    // Validation and state updates are async, so we need to wait for them to complete
    // first. Queue a `setState` callback and wait for it to resolve.
    await new Promise<void>((resolve) => this.setState({}, resolve));

    if (this.allFieldsValid()) {
      return true;
    }

    const invalidField = this.findFirstInvalidField(fieldIDsInDisplayOrder);

    if (!invalidField) {
      return true;
    }

    // Focus the first invalid field and show feedback in the stricter mode
    // that no longer allows empty values for required fields.
    invalidField.focus();
    invalidField.validate({ allowEmpty: false, focused: true });
    return false;
  }

  /**
   * @returns {boolean} true if all fields were valid last time they were validated.
   */
  private allFieldsValid() {
    const keys = Object.keys(this.state.fieldValid);
    for (let i = 0; i < keys.length; ++i) {
      if (!(this.state.fieldValid as any)[keys[i]]) {
        return false;
      }
    }
    return true;
  }

  private findFirstInvalidField(fieldIDs: RegistrationField[]) {
    for (const fieldID of fieldIDs) {
      if (!this.state.fieldValid[fieldID] && this[fieldID]) {
        return this[fieldID];
      }
    }
    return null;
  }

  private markFieldValid(fieldID: RegistrationField, valid: boolean) {
    const { fieldValid } = this.state;
    fieldValid[fieldID] = valid;
    this.setState({
      fieldValid,
    });
  }

  private onEmailChange = (ev: React.ChangeEvent<any>) => {
    this.setState({
      email: ev.target.value,
    });
  };

  private onEmailValidate = async (fieldState: IFieldState) => {
    const result = await this.validateEmailRules(fieldState);
    this.markFieldValid(RegistrationField.Email, !!result.valid);
    return result;
  };

  private validateEmailRules = withValidation<RegistrationForm>({
    description: () => "Use an email address to recover your account",
    hideDescriptionIfValid: true,
    rules: [
      {
        key: "required",
        test(this: RegistrationForm, { value, allowEmpty }) {
          return (
            allowEmpty ||
            !this.authStepIsRequired("m.login.email.identity") ||
            !!value
          );
        },
        invalid: () => "Enter email address (required on this homeserver)",
      },
      {
        key: "email",
        test: ({ value }) => !value || looksValidEmail(value),
        invalid: () => "Doesn't look like a valid email address",
      },
    ],
  });

  private onPasswordChange = (ev: React.ChangeEvent<any>) => {
    this.setState({
      password: ev.target.value,
    });
  };

  private onPasswordValidate = (result: IValidationResult) => {
    this.markFieldValid(RegistrationField.Password, !!result.valid);
  };

  private onPasswordConfirmChange = (ev: React.ChangeEvent<any>) => {
    this.setState({
      passwordConfirm: ev.target.value,
    });
  };

  private onPasswordConfirmValidate = async (fieldState: IFieldState) => {
    const result = await this.validatePasswordConfirmRules(fieldState);
    this.markFieldValid(RegistrationField.PasswordConfirm, !!result.valid);
    return result;
  };

  private validatePasswordConfirmRules = withValidation<RegistrationForm>({
    rules: [
      {
        key: "required",
        test: ({ value, allowEmpty }) => allowEmpty || !!value,
        invalid: () => "Confirm password",
      },
      {
        key: "match",
        test(this: RegistrationForm, { value }) {
          return !value || value === this.state.password;
        },
        invalid: () => "Passwords don't match",
      },
    ],
  });

  //   private onPhoneCountryChange = (newVal) => {
  //     this.setState({
  //       phoneCountry: newVal.iso2,
  //     });
  //   };

  //   private onPhoneNumberChange = (ev: React.ChangeEvent<any>) => {
  //     this.setState({
  //       phoneNumber: ev.target.value,
  //     });
  //   };

  //   private onPhoneNumberValidate = async (fieldState) => {
  //     const result = await this.validatePhoneNumberRules(fieldState);
  //     this.markFieldValid(RegistrationField.PhoneNumber, result.valid);
  //     return result;
  //   };

  private validatePhoneNumberRules = withValidation<RegistrationForm>({
    description: () =>
      "Other users can invite you to rooms using your contact details",
    hideDescriptionIfValid: true,
    rules: [
      {
        key: "required",
        test(this: RegistrationForm, { value, allowEmpty }) {
          return (
            allowEmpty || !this.authStepIsRequired("m.login.msisdn") || !!value
          );
        },
        invalid: () => "Enter phone number (required on this homeserver)",
      },
      {
        key: "email",
        test: ({ value }) => !value || phoneNumberLooksValid(value),
        invalid: () =>
          "That phone number doesn't look quite right, please check and try again",
      },
    ],
  });

  private onUsernameChange = (ev: React.ChangeEvent<any>) => {
    this.setState({
      username: ev.target.value,
    });
  };

  private onUsernameValidate = async (fieldState: IFieldState) => {
    const result = await this.validateUsernameRules(fieldState);
    this.markFieldValid(RegistrationField.Username, !!result.valid);
    return result;
  };

  private validateUsernameRules = withValidation<RegistrationForm>({
    description: () =>
      "Use lowercase letters, numbers, dashes and underscores only",
    hideDescriptionIfValid: true,
    rules: [
      {
        key: "required",
        test: ({ value, allowEmpty }) => allowEmpty || !!value,
        invalid: () => "Enter username",
      },
      {
        key: "safeLocalpart",
        test: ({ value }) => !value || /^[a-z0-9_\-]+$/.test(value), // SAFE_LOCALPART_REGEX but modified (more strict TC)
        invalid: () => "Some characters not allowed",
      },
    ],
  });

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
        value={this.state.email}
        onChange={this.onEmailChange}
        onValidate={this.onEmailValidate}
      />
    );
  }

  private renderPassword() {
    return (
      <PassphraseField
        id="mx_RegistrationForm_password"
        fieldRef={(field) => (this[RegistrationField.Password] = field)}
        minScore={PASSWORD_MIN_SCORE}
        value={this.state.password}
        onChange={this.onPasswordChange}
        onValidate={this.onPasswordValidate}
      />
    );
  }

  renderPasswordConfirm() {
    return (
      <Field
        id="mx_RegistrationForm_passwordConfirm"
        ref={(field) => (this[RegistrationField.PasswordConfirm] = field)}
        type="password"
        autoComplete="new-password"
        label={"Confirm password"}
        value={this.state.passwordConfirm}
        onChange={this.onPasswordConfirmChange}
        onValidate={this.onPasswordConfirmValidate}
      />
    );
  }

  /*
  renderPhoneNumber() {
    if (!this.showPhoneNumber()) {
      return null;
    }

    const phoneLabel = this.authStepIsRequired("m.login.msisdn")
      ? "Phone"
      : "Phone (optional)";
    const phoneCountry = (
      <CountryDropdown
        value={this.state.phoneCountry}
        isSmall={true}
        showPrefix={true}
        onOptionChange={this.onPhoneCountryChange}
      />
    );
    return (
      <Field
        ref={(field) => (this[RegistrationField.PhoneNumber] = field)}
        type="text"
        label={phoneLabel}
        value={this.state.phoneNumber}
        prefixComponent={phoneCountry}
        onChange={this.onPhoneNumberChange}
        onValidate={this.onPhoneNumberValidate}
      />
    );
  }*/

  renderUsername() {
    return (
      <Field
        id="mx_RegistrationForm_username"
        ref={(field) => (this[RegistrationField.Username] = field)}
        type="text"
        autoFocus={true}
        label={"Username"}
        placeholder={"Username".toLocaleLowerCase()}
        value={this.state.username}
        onChange={this.onUsernameChange}
        onValidate={this.onUsernameValidate}
      />
    );
  }

  render() {
    const registerButton = (
      <input
        className="mx_Login_submit"
        type="submit"
        value={"Register"}
        disabled={!this.props.canSubmit}
      />
    );

    let emailHelperText = null;
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
      <div>
        <form onSubmit={this.onSubmit}>
          <div className="mx_AuthBody_fieldRow">{this.renderUsername()}</div>
          <div className="mx_AuthBody_fieldRow">
            {this.renderPassword()}
            {this.renderPasswordConfirm()}
          </div>
          <div className="mx_AuthBody_fieldRow">
            {this.renderEmail()}
            {/* {this.renderPhoneNumber()} */}
          </div>
          {emailHelperText}
          {registerButton}
        </form>
      </div>
    );
  }
}
