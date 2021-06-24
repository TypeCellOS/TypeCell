/*
Copyright 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2019, 2020 The Matrix.org Foundation C.I.C.

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

import React, { createRef, FormEvent } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";

import AccessibleButton from "../elements/AccessibleButton";
import CaptchaForm from "./CaptchaForm";
import Field from "../elements/Field";
import Spinner from "../elements/Spinner";

/* This file contains a collection of components which are used by the
 * InteractiveAuth to prompt the user to enter the information needed
 * for an auth stage. (The intention is that they could also be used for other
 * components, such as the registration flow).
 *
 * Call getEntryComponentForLoginType() to get a component suitable for a
 * particular login type. Each component requires the same properties:
 *
 * matrixClient:           A matrix client. May be a different one to the one
 *                         currently being used generally (eg. to register with
 *                         one HS whilst beign a guest on another).
 * loginType:              the login type of the auth stage being attempted
 * authSessionId:          session id from the server
 * clientSecret:           The client secret in use for ID server auth sessions
 * stageParams:            params from the server for the stage being attempted
 * errorText:              error message from a previous attempt to authenticate
 * submitAuthDict:         a function which will be called with the new auth dict
 * busy:                   a boolean indicating whether the auth logic is doing something
 *                         the user needs to wait for.
 * inputs:                 Object of inputs provided by the user, as in js-sdk
 *                         interactive-auth
 * stageState:             Stage-specific object used for communicating state information
 *                         to the UI from the state-specific auth logic.
 *                         Defined keys for stages are:
 *                             m.login.email.identity:
 *                              * emailSid: string representing the sid of the active
 *                                          verification session from the ID server, or
 *                                          null if no session is active.
 * fail:                   a function which should be called with an error object if an
 *                         error occurred during the auth stage. This will cause the auth
 *                         session to be failed and the process to go back to the start.
 * setEmailSid:            m.login.email.identity only: a function to be called with the
 *                         email sid after a token is requested.
 * onPhaseChange:          A function which is called when the stage's phase changes. If
 *                         the stage has no phases, call this with DEFAULT_PHASE. Takes
 *                         one argument, the phase, and is always defined/required.
 * continueText:           For stages which have a continue button, the text to use.
 * continueKind:           For stages which have a continue button, the style of button to
 *                         use. For example, 'danger' or 'primary'.
 * onCancel                A function with no arguments which is called by the stage if the
 *                         user knowingly cancelled/dismissed the authentication attempt.
 *
 * Each component may also provide the following functions (beyond the standard React ones):
 *    focus: set the input focus appropriately in the form.
 */

export const DEFAULT_PHASE = 0;

type PasswordAuthEntryProps = {
  matrixClient: any;
  submitAuthDict: (authDict: any) => void;
  errorText: string;
  // is the auth logic currently waiting for something to
  // happen?
  busy: boolean;
  onPhaseChange: (phase: number) => void;
};
export class PasswordAuthEntry extends React.Component<PasswordAuthEntryProps> {
  static LOGIN_TYPE = "m.login.password";

  static propTypes = {
    matrixClient: PropTypes.object.isRequired,
    submitAuthDict: PropTypes.func.isRequired,
    errorText: PropTypes.string,
    // is the auth logic currently waiting for something to
    // happen?
    busy: PropTypes.bool,
    onPhaseChange: PropTypes.func.isRequired,
  };

  componentDidMount() {
    this.props.onPhaseChange(DEFAULT_PHASE);
  }

  state = {
    password: "",
  };

  _onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (this.props.busy) return;

    this.props.submitAuthDict({
      type: PasswordAuthEntry.LOGIN_TYPE,
      // TODO: Remove `user` once servers support proper UIA
      // See https://github.com/vector-im/element-web/issues/10312
      user: this.props.matrixClient.credentials.userId,
      identifier: {
        type: "m.id.user",
        user: this.props.matrixClient.credentials.userId,
      },
      password: this.state.password,
    });
  };

  _onPasswordFieldChange = (ev: React.ChangeEvent<any>) => {
    // enable the submit button iff the password is non-empty
    this.setState({
      password: ev.target.value,
    });
  };

  render() {
    const passwordBoxClass = classnames({
      error: this.props.errorText,
    });

    let submitButtonOrSpinner;
    if (this.props.busy) {
      submitButtonOrSpinner = <Spinner />;
    } else {
      submitButtonOrSpinner = (
        <input
          type="submit"
          className="mx_Dialog_primary"
          disabled={!this.state.password}
          value={"Continue"}
        />
      );
    }

    let errorSection;
    if (this.props.errorText) {
      errorSection = (
        <div className="error" role="alert">
          {this.props.errorText}
        </div>
      );
    }

    return (
      // TODO: Change this to be compatible with Atlaskit Form
      // This form uses the old structure of forms, which has been
      // replaced by Atlaskit Form's. See mainly Fields.tsx
      <div>
        <p>Confirm your identity by entering your account password below.</p>
        <form
          onSubmit={this._onSubmit}
          className="mx_InteractiveAuthEntryComponents_passwordSection">
          <Field
            className={passwordBoxClass}
            type="password"
            name="passwordField"
            label={"Password"}
            autoFocus={true}
            value={this.state.password}
            onChange={this._onPasswordFieldChange}
          />
          <div className="mx_button_row">{submitButtonOrSpinner}</div>
        </form>
        {errorSection}
      </div>
    );
  }
}

type RecaptchaAuthEntryProps = {
  submitAuthDict: (authDict: any) => void;
  stageParams: any;
  errorText: string;
  busy: boolean;
  onPhaseChange: (phase: number) => void;
};

export class RecaptchaAuthEntry extends React.Component<RecaptchaAuthEntryProps> {
  static LOGIN_TYPE = "m.login.recaptcha";

  static propTypes = {
    submitAuthDict: PropTypes.func.isRequired,
    stageParams: PropTypes.object.isRequired,
    errorText: PropTypes.string,
    busy: PropTypes.bool,
    onPhaseChange: PropTypes.func.isRequired,
  };

  componentDidMount() {
    this.props.onPhaseChange(DEFAULT_PHASE);
  }

  _onCaptchaResponse = (response: any) => {
    this.props.submitAuthDict({
      type: RecaptchaAuthEntry.LOGIN_TYPE,
      response: response,
    });
  };

  render() {
    if (this.props.busy) {
      return <Spinner />;
    }

    let errorText = this.props.errorText;

    let sitePublicKey;
    if (!this.props.stageParams || !this.props.stageParams.public_key) {
      errorText =
        "Missing captcha public key in homeserver configuration. Please report " +
        "this to your homeserver administrator.";
    } else {
      sitePublicKey = this.props.stageParams.public_key;
    }

    let errorSection;
    if (errorText) {
      errorSection = (
        <div className="error" role="alert">
          {errorText}
        </div>
      );
    }

    return (
      <div>
        <CaptchaForm
          sitePublicKey={sitePublicKey}
          onCaptchaResponse={this._onCaptchaResponse}
        />
        {errorSection}
      </div>
    );
  }
}

type LangPolicy = {
  name: string;
  url: string;
  id: string | undefined;
};

type Policy = {
  [lang: string]: LangPolicy;
};
type TermsAuthEntryProps = {
  submitAuthDict: (authDict: any) => void;
  stageParams: {
    policies: {
      [policy: string]: Policy;
    };
  };
  errorText: string;
  busy: boolean;
  showContinue: boolean;
  onPhaseChange: (phase: number) => void;
};

type TermsAuthEntryState = {
  toggledPolicies: {
    [id: string]: boolean;
  };
  policies: LangPolicy[];
  errorText?: string;
};

export class TermsAuthEntry extends React.Component<
  TermsAuthEntryProps,
  TermsAuthEntryState
> {
  static LOGIN_TYPE = "m.login.terms";

  static propTypes = {
    submitAuthDict: PropTypes.func.isRequired,
    stageParams: PropTypes.object.isRequired,
    errorText: PropTypes.string,
    busy: PropTypes.bool,
    showContinue: PropTypes.bool,
    onPhaseChange: PropTypes.func.isRequired,
  };

  constructor(props: TermsAuthEntryProps) {
    super(props);

    // example stageParams:
    //
    // {
    //     "policies": {
    //         "privacy_policy": {
    //             "version": "1.0",
    //             "en": {
    //                 "name": "Privacy Policy",
    //                 "url": "https://example.org/privacy-1.0-en.html",
    //             },
    //             "fr": {
    //                 "name": "Politique de confidentialité",
    //                 "url": "https://example.org/privacy-1.0-fr.html",
    //             },
    //         },
    //         "other_policy": { ... },
    //     }
    // }

    const allPolicies = this.props.stageParams.policies || {};
    const prefLang = "en"; // SettingsStore.getValue("language");
    const initToggles: any = {};
    const pickedPolicies = [];
    for (const policyId of Object.keys(allPolicies)) {
      const policy = allPolicies[policyId];

      // Pick a language based on the user's language, falling back to english,
      // and finally to the first language available. If there's still no policy
      // available then the homeserver isn't respecting the spec.
      let langPolicy = policy[prefLang];
      if (!langPolicy) langPolicy = policy["en"];
      if (!langPolicy) {
        // last resort
        const firstLang = Object.keys(policy).find((e) => e !== "version");
        langPolicy = policy[firstLang!];
      }
      if (!langPolicy)
        throw new Error("Failed to find a policy to show the user");

      initToggles[policyId] = false;

      langPolicy.id = policyId;
      pickedPolicies.push(langPolicy);
    }

    this.state = {
      toggledPolicies: initToggles,
      policies: pickedPolicies,
    };
  }

  componentDidMount() {
    this.props.onPhaseChange(DEFAULT_PHASE);
  }

  tryContinue = () => {
    this._trySubmit();
  };

  _togglePolicy(policyId: string) {
    const newToggles: TermsAuthEntryState["toggledPolicies"] = {};
    for (const policy of this.state.policies) {
      let checked = this.state.toggledPolicies[policy.id!];
      if (policy.id === policyId) checked = !checked;

      newToggles[policy.id!] = checked;
    }
    this.setState({ toggledPolicies: newToggles });
  }

  _trySubmit = () => {
    let allChecked = true;
    for (const policy of this.state.policies) {
      const checked = this.state.toggledPolicies[policy.id!];
      allChecked = allChecked && checked;
    }

    if (allChecked) {
      this.props.submitAuthDict({ type: TermsAuthEntry.LOGIN_TYPE });
    } else {
      this.setState({
        errorText: "Please review and accept all of the homeserver's policies",
      });
    }
  };

  render() {
    if (this.props.busy) {
      return <Spinner />;
    }

    const checkboxes = [];
    let allChecked = true;
    for (const policy of this.state.policies) {
      const checked = this.state.toggledPolicies[policy.id!];
      allChecked = allChecked && checked;

      checkboxes.push(
        // XXX: replace with StyledCheckbox
        <label
          key={"policy_checkbox_" + policy.id}
          className="mx_InteractiveAuthEntryComponents_termsPolicy">
          <input
            type="checkbox"
            onChange={() => this._togglePolicy(policy.id!)}
            checked={checked}
          />
          <a href={policy.url} target="_blank" rel="noreferrer noopener">
            {policy.name}
          </a>
        </label>
      );
    }

    let errorSection;
    if (this.props.errorText || this.state.errorText) {
      errorSection = (
        <div className="error" role="alert">
          {this.props.errorText || this.state.errorText}
        </div>
      );
    }

    let submitButton;
    if (this.props.showContinue !== false) {
      // XXX: button classes
      submitButton = (
        <button
          className="mx_InteractiveAuthEntryComponents_termsSubmit mx_GeneralButton"
          onClick={this._trySubmit}
          disabled={!allChecked}>
          Accept
        </button>
      );
    }

    return (
      <div>
        <p>Please review and accept the policies of this homeserver:</p>
        {checkboxes}
        {errorSection}
        {submitButton}
      </div>
    );
  }
}

type EmailIdentityAuthEntryProps = {
  submitAuthDict: (authDict: any) => void;
  onPhaseChange: (phase: number) => void;
  inputs: any;
  stageState: any;
};
export class EmailIdentityAuthEntry extends React.Component<EmailIdentityAuthEntryProps> {
  static LOGIN_TYPE = "m.login.email.identity";

  static propTypes = {
    matrixClient: PropTypes.object.isRequired,
    submitAuthDict: PropTypes.func.isRequired,
    authSessionId: PropTypes.string.isRequired,
    clientSecret: PropTypes.string.isRequired,
    inputs: PropTypes.object.isRequired,
    stageState: PropTypes.object.isRequired,
    fail: PropTypes.func.isRequired,
    setEmailSid: PropTypes.func.isRequired,
    onPhaseChange: PropTypes.func.isRequired,
  };

  componentDidMount() {
    this.props.onPhaseChange(DEFAULT_PHASE);
  }

  render() {
    // This component is now only displayed once the token has been requested,
    // so we know the email has been sent. It can also get loaded after the user
    // has clicked the validation link if the server takes a while to propagate
    // the validation internally. If we're in the session spawned from clicking
    // the validation link, we won't know the email address, so if we don't have it,
    // assume that the link has been clicked and the server will realise when we poll.
    if (this.props.inputs.emailAddress === undefined) {
      return <Spinner />;
    } else if (this.props.stageState?.emailSid) {
      // we only have a session ID if the user has clicked the link in their email,
      // so show a loading state instead of "an email has been sent to..." because
      // that's confusing when you've already read that email.
      return <Spinner />;
    } else {
      return (
        <div className="mx_InteractiveAuthEntryComponents_emailWrapper">
          <p>
            A confirmation email has been sent to{" "}
            <b>{this.props.inputs.emailAddress}</b>
          </p>
          <p>Open the link in the email to continue registration.</p>
        </div>
      );
    }
  }
}

type MsisdnAuthEntryProps = {
  submitAuthDict: (authDict: any) => void;
  onPhaseChange: (phase: number) => void;
  inputs: any;
  stageState: any;
  matrixClient: any;
  clientSecret: string;
  fail: (e: any) => void;
};

type MsisdnAuthEntryState = {
  errorText?: string;
  token: string;
  requestingToken: boolean;
};

export class MsisdnAuthEntry extends React.Component<
  MsisdnAuthEntryProps,
  MsisdnAuthEntryState
> {
  private _submitUrl: string | null = null;
  private _sid: string | null = null;
  private _msisdn: string | null = null;
  private _tokenBox: string | null = null;

  static LOGIN_TYPE = "m.login.msisdn";

  static propTypes = {
    inputs: PropTypes.shape({
      phoneCountry: PropTypes.string,
      phoneNumber: PropTypes.string,
    }),
    fail: PropTypes.func,
    clientSecret: PropTypes.func,
    submitAuthDict: PropTypes.func.isRequired,
    matrixClient: PropTypes.object,
    onPhaseChange: PropTypes.func.isRequired,
  };

  state = {
    token: "",
    requestingToken: false,
    errorText: undefined,
  };

  componentDidMount() {
    this.props.onPhaseChange(DEFAULT_PHASE);

    this._submitUrl = null;
    this._sid = null;
    this._msisdn = null;
    this._tokenBox = null;

    this.setState({ requestingToken: true });
    this._requestMsisdnToken()
      .catch((e: any) => {
        this.props.fail(e);
      })
      .finally(() => {
        this.setState({ requestingToken: false });
      });
  }

  /*
   * Requests a verification token by SMS.
   */
  _requestMsisdnToken() {
    return this.props.matrixClient
      .requestRegisterMsisdnToken(
        this.props.inputs.phoneCountry,
        this.props.inputs.phoneNumber,
        this.props.clientSecret,
        1 // TODO: Multiple send attempts?
      )
      .then((result: any) => {
        this._submitUrl = result.submit_url;
        this._sid = result.sid;
        this._msisdn = result.msisdn;
      });
  }

  _onTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      token: e.target.value,
    });
  };

  _onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (this.state.token == "") return;

    this.setState({
      errorText: undefined,
    });

    try {
      let result;
      if (this._submitUrl) {
        result = await this.props.matrixClient.submitMsisdnTokenOtherUrl(
          this._submitUrl,
          this._sid,
          this.props.clientSecret,
          this.state.token
        );
      } else {
        throw new Error("The registration with MSISDN flow is misconfigured");
      }
      if (result.success) {
        const creds = {
          sid: this._sid,
          client_secret: this.props.clientSecret,
        };
        this.props.submitAuthDict({
          type: MsisdnAuthEntry.LOGIN_TYPE,
          // TODO: Remove `threepid_creds` once servers support proper UIA
          // See https://github.com/vector-im/element-web/issues/10312
          // See https://github.com/matrix-org/matrix-doc/issues/2220
          threepid_creds: creds,
          threepidCreds: creds,
        });
      } else {
        this.setState({
          errorText: "Token incorrect",
        });
      }
    } catch (e) {
      this.props.fail(e);
      console.log("Failed to submit msisdn token");
    }
  };

  render() {
    if (this.state.requestingToken) {
      return <Spinner />;
    } else {
      const enableSubmit = Boolean(this.state.token);
      const submitClasses = classnames({
        mx_InteractiveAuthEntryComponents_msisdnSubmit: true,
        mx_GeneralButton: true,
      });
      let errorSection;
      if (this.state.errorText) {
        errorSection = (
          <div className="error" role="alert">
            {this.state.errorText}
          </div>
        );
      }
      return (
        <div>
          <p>
            A text message has been sent to <i>{this._msisdn}</i>
          </p>
          <p>Please enter the code it contains:</p>
          <div className="mx_InteractiveAuthEntryComponents_msisdnWrapper">
            <form onSubmit={this._onFormSubmit}>
              <input
                type="text"
                className="mx_InteractiveAuthEntryComponents_msisdnEntry"
                value={this.state.token}
                onChange={this._onTokenChange}
                aria-label={"Code"}
              />
              <br />
              <input
                type="submit"
                value={"Submit"}
                className={submitClasses}
                disabled={!enableSubmit}
              />
            </form>
            {errorSection}
          </div>
        </div>
      );
    }
  }
}

type SSOAuthEntryProps = {
  submitAuthDict: (authDict: any) => void;
  onPhaseChange: (phase: number) => void;
  stageState: any;
  matrixClient: any;
  loginType: string;
  authSessionId: string;
  continueKind?: string;
  continueText?: string;
  errorText?: string;
  onCancel: () => void;
};

type SSOAuthEntryState = {
  phase: number;
  attemptFailed: boolean;
};

export class SSOAuthEntry extends React.Component<
  SSOAuthEntryProps,
  SSOAuthEntryState
> {
  static propTypes = {
    matrixClient: PropTypes.object.isRequired,
    authSessionId: PropTypes.string.isRequired,
    loginType: PropTypes.string.isRequired,
    submitAuthDict: PropTypes.func.isRequired,
    errorText: PropTypes.string,
    onPhaseChange: PropTypes.func.isRequired,
    continueText: PropTypes.string,
    continueKind: PropTypes.string,
    onCancel: PropTypes.func,
  };

  static LOGIN_TYPE = "m.login.sso";
  static UNSTABLE_LOGIN_TYPE = "org.matrix.login.sso";

  static PHASE_PREAUTH = 1; // button to start SSO
  static PHASE_POSTAUTH = 2; // button to confirm SSO completed

  private _popupWindow: Window | undefined;
  _ssoUrl: string;

  constructor(props: SSOAuthEntryProps) {
    super(props);

    // We actually send the user through fallback auth so we don't have to
    // deal with a redirect back to us, losing application context.
    this._ssoUrl = props.matrixClient.getFallbackAuthUrl(
      this.props.loginType,
      this.props.authSessionId
    );

    this._popupWindow = undefined;
    window.addEventListener("message", this._onReceiveMessage);

    this.state = {
      phase: SSOAuthEntry.PHASE_PREAUTH,
      attemptFailed: false,
    };
  }

  componentDidMount(): void {
    this.props.onPhaseChange(SSOAuthEntry.PHASE_PREAUTH);
  }

  componentWillUnmount() {
    window.removeEventListener("message", this._onReceiveMessage);
    if (this._popupWindow) {
      this._popupWindow.close();
      this._popupWindow = undefined;
    }
  }

  attemptFailed = () => {
    this.setState({
      attemptFailed: true,
    });
  };

  _onReceiveMessage = (event: { data: string; origin: string }) => {
    if (
      event.data === "authDone" &&
      event.origin === this.props.matrixClient.getHomeserverUrl()
    ) {
      if (this._popupWindow) {
        this._popupWindow.close();
        this._popupWindow = undefined;
      }
    }
  };

  onStartAuthClick = () => {
    // Note: We don't use PlatformPeg's startSsoAuth functions because we almost
    // certainly will need to open the thing in a new tab to avoid losing application
    // context.

    this._popupWindow = window.open(this._ssoUrl, "_blank") || undefined;
    this.setState({ phase: SSOAuthEntry.PHASE_POSTAUTH });
    this.props.onPhaseChange(SSOAuthEntry.PHASE_POSTAUTH);
  };

  onConfirmClick = () => {
    this.props.submitAuthDict({});
  };

  render() {
    let continueButton = null;
    const cancelButton = (
      <AccessibleButton
        onClick={this.props.onCancel}
        kind={
          this.props.continueKind
            ? this.props.continueKind + "_outline"
            : "primary_outline"
        }>
        Cancel
      </AccessibleButton>
    );
    if (this.state.phase === SSOAuthEntry.PHASE_PREAUTH) {
      continueButton = (
        <AccessibleButton
          onClick={this.onStartAuthClick}
          kind={this.props.continueKind || "primary"}>
          {this.props.continueText || "Single Sign On"}
        </AccessibleButton>
      );
    } else {
      continueButton = (
        <AccessibleButton
          onClick={this.onConfirmClick}
          kind={this.props.continueKind || "primary"}>
          {this.props.continueText || "Confirm"}
        </AccessibleButton>
      );
    }

    let errorSection;
    if (this.props.errorText) {
      errorSection = (
        <div className="error" role="alert">
          {this.props.errorText}
        </div>
      );
    } else if (this.state.attemptFailed) {
      errorSection = (
        <div className="error" role="alert">
          Something went wrong in confirming your identity. Cancel and try
          again.
        </div>
      );
    }

    return (
      <React.Fragment>
        {errorSection}
        <div className="mx_InteractiveAuthEntryComponents_sso_buttons">
          {cancelButton}
          {continueButton}
        </div>
      </React.Fragment>
    );
  }
}

type FallbackAuthEntryProps = {
  matrixClient: any;
  authSessionId: string;
  loginType: string;
  submitAuthDict: (dict: any) => void;
  errorText: string;
  onPhaseChange: (phase: number) => void;
};

export class FallbackAuthEntry extends React.Component<FallbackAuthEntryProps> {
  static propTypes = {
    matrixClient: PropTypes.object.isRequired,
    authSessionId: PropTypes.string.isRequired,
    loginType: PropTypes.string.isRequired,
    submitAuthDict: PropTypes.func.isRequired,
    errorText: PropTypes.string,
    onPhaseChange: PropTypes.func.isRequired,
  };

  // we have to make the user click a button, as browsers will block
  // the popup if we open it immediately.
  private _popupWindow: Window | undefined;
  private _fallbackButton = createRef<HTMLAnchorElement>();
  constructor(props: FallbackAuthEntryProps) {
    super(props);

    window.addEventListener("message", this._onReceiveMessage);
  }

  componentDidMount() {
    this.props.onPhaseChange(DEFAULT_PHASE);
  }

  componentWillUnmount() {
    window.removeEventListener("message", this._onReceiveMessage);
    if (this._popupWindow) {
      this._popupWindow.close();
    }
  }

  focus = () => {
    if (this._fallbackButton.current) {
      this._fallbackButton.current.focus();
    }
  };

  _onShowFallbackClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const url = this.props.matrixClient.getFallbackAuthUrl(
      this.props.loginType,
      this.props.authSessionId
    );
    this._popupWindow = window.open(url, "_blank") || undefined;
  };

  _onReceiveMessage = (event: { data: string; origin: string }) => {
    if (
      event.data === "authDone" &&
      event.origin === this.props.matrixClient.getHomeserverUrl()
    ) {
      this.props.submitAuthDict({});
    }
  };

  render() {
    let errorSection;
    if (this.props.errorText) {
      errorSection = (
        <div className="error" role="alert">
          {this.props.errorText}
        </div>
      );
    }
    return (
      <div>
        <a
          href=""
          ref={this._fallbackButton}
          onClick={this._onShowFallbackClick}>
          {"Start authentication"}
        </a>
        {errorSection}
      </div>
    );
  }
}

const AuthEntryComponents = [
  PasswordAuthEntry,
  RecaptchaAuthEntry,
  EmailIdentityAuthEntry,
  MsisdnAuthEntry,
  TermsAuthEntry,
  SSOAuthEntry,
];

export default function getEntryComponentForLoginType(loginType: string) {
  for (const c of AuthEntryComponents) {
    if (
      c.LOGIN_TYPE === loginType ||
      (c as any).UNSTABLE_LOGIN_TYPE === loginType
    ) {
      return c;
    }
  }
  return FallbackAuthEntry;
}
