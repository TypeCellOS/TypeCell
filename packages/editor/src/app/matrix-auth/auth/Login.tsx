/*
Copyright 2015-2021 The Matrix.org Foundation C.I.C.

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
import { HelperMessage } from "@atlaskit/form";
import SectionMessage from "@atlaskit/section-message";
import Spinner from "@atlaskit/spinner";
import React, { Fragment, ReactNode } from "react";
import { Logo } from "../../main/components/Logo";
import AuthStyles from "./AuthStyles.module.css";
import SSOButtons from "./elements/SSOButtons";
import LoginHelper, { ISSOFlow, LoginFlow } from "./LoginHelper";
import AutoDiscoveryUtils, {
  ValidatedServerConfig,
} from "./util/AutoDiscoveryUtils";
import { IMatrixClientCreds } from "./util/matrix";
import { messageForResourceLimitError } from "./util/messages";
import PasswordLogin from "./views/PasswordLogin";

interface IProps {
  serverConfig: ValidatedServerConfig;
  // If true, the component will consider itself busy.
  busy?: boolean;
  isSyncing?: boolean;
  // Secondary HS which we try to log into if the user is using
  // the default HS but login fails. Useful for migrating to a
  // different homeserver without confusing users.
  fallbackHsUrl?: string;
  defaultDeviceDisplayName?: string;
  pageAfterLogin?: string;

  // Called when the user has logged in. Params:
  // - The object returned by the login API
  // - The user's password, if applicable, (may be cached in memory for a
  //   short time so the user is not required to re-enter their password
  //   for operations like uploading cross-signing keys).
  onLoggedIn(data: IMatrixClientCreds, password: string): void;

  // login shouldn't know or care how registration, password recovery, etc is done.
  onRegisterClick(): void;
  onForgotPasswordClick?(): void;
  onServerConfigChange(config: ValidatedServerConfig): void;
}

interface IState {
  busy: boolean;
  busyLoggingIn?: boolean;
  errorText?: React.ReactNode;
  loginIncorrect: boolean;
  // can we attempt to log in or are there validation errors?
  canTryLogin: boolean;

  flows?: LoginFlow[];

  // used for preserving form values when changing homeserver
  username: string;
  phoneCountry?: string;
  phoneNumber: string;

  // We perform liveliness checks later, but for now suppress the errors.
  // We also track the server dead errors independently of the regular errors so
  // that we can render it differently, and override any other error the user may
  // be seeing.
  serverIsAlive: boolean;
  serverErrorIsFatal: boolean;
  serverDeadError?: ReactNode;
}

/*
 * A wire component which glues together login UI components and Login logic
 */
export default class LoginComponent extends React.PureComponent<
  IProps,
  IState
> {
  private unmounted = false;
  private loginLogic: LoginHelper | undefined;

  private readonly stepRendererMap: Record<string, () => ReactNode>;

  constructor(props: IProps) {
    super(props);

    this.state = {
      busy: false,
      busyLoggingIn: undefined,
      errorText: undefined,
      loginIncorrect: false,
      canTryLogin: true,

      flows: undefined,

      username: "",
      phoneCountry: undefined,
      phoneNumber: "",

      serverIsAlive: true,
      serverErrorIsFatal: false,
      serverDeadError: "",
    };

    // map from login step type to a function which will render a control
    // letting you do that login type
    this.stepRendererMap = {
      "m.login.password": this.renderPasswordStep,

      // CAS and SSO are the same thing, modulo the url we link to
      "m.login.cas": () => this.renderSsoStep("cas"),
      "m.login.sso": () => this.renderSsoStep("sso"),
    };
  }

  // TODO: [REACT-WARNING] Replace with appropriate lifecycle event
  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
    this.initLoginLogic(this.props.serverConfig);
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  // TODO: [REACT-WARNING] Replace with appropriate lifecycle event
  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(newProps: IProps) {
    if (
      newProps.serverConfig.hsUrl === this.props.serverConfig.hsUrl &&
      newProps.serverConfig.isUrl === this.props.serverConfig.isUrl
    )
      return;

    // Ensure that we end up actually logging in to the right place
    this.initLoginLogic(newProps.serverConfig);
  }

  isBusy = () => this.state.busy || this.props.busy;

  onPasswordLogin = async (
    username: string,
    phoneCountry: string | undefined,
    phoneNumber: string | undefined,
    password: string
  ) => {
    if (!this.state.serverIsAlive) {
      this.setState({ busy: true });
      // Do a quick liveliness check on the URLs
      let aliveAgain = true;
      try {
        await AutoDiscoveryUtils.validateServerConfigWithStaticUrls(
          this.props.serverConfig.hsUrl,
          this.props.serverConfig.isUrl
        );
        this.setState({ serverIsAlive: true, errorText: "" });
      } catch (e: any) {
        const componentState = AutoDiscoveryUtils.authComponentStateForError(e);
        this.setState({
          busy: false,
          busyLoggingIn: false,
          ...componentState,
        });
        aliveAgain = !componentState.serverErrorIsFatal;
      }

      // Prevent people from submitting their password when something isn't right.
      if (!aliveAgain) {
        return;
      }
    }

    this.setState({
      busy: true,
      busyLoggingIn: true,
      errorText: null,
      loginIncorrect: false,
    });

    this.loginLogic!.loginViaPassword(
      username,
      phoneCountry,
      phoneNumber,
      password
    ).then(
      (data) => {
        this.setState({ serverIsAlive: true }); // it must be, we logged in.
        this.props.onLoggedIn(data, password);
      },
      (error) => {
        if (this.unmounted) {
          return;
        }
        let errorText;

        // Some error strings only apply for logging in
        const usingEmail = username.indexOf("@") > 0;
        if (error.httpStatus === 400 && usingEmail) {
          errorText =
            "This homeserver does not support login using email address.";
        } else if (error.errcode === "M_RESOURCE_LIMIT_EXCEEDED") {
          const errorTop = messageForResourceLimitError(error.data.limit_type, {
            monthly_active_user:
              "This homeserver has hit its Monthly Active User limit.",
            hs_blocked:
              "This homeserver has been blocked by it's administrator.",
            "": "This homeserver has exceeded one of its resource limits.",
          });
          const errorDetail = messageForResourceLimitError(
            error.data.limit_type,
            {
              "": "Please contact your service administrator to continue using this service.", // TODO: link to error.data.admin_contact
            }
          );
          errorText = (
            <div>
              <div>{errorTop}</div>
              <div className="mx_Login_smallError">{errorDetail}</div>
            </div>
          );
        } else if (error.httpStatus === 401 || error.httpStatus === 403) {
          if (error.errcode === "M_USER_DEACTIVATED") {
            errorText = "This account has been deactivated.";
            //   } else if (SdkConfig.get()["disable_custom_urls"]) {
          } else if (false) {
            errorText = (
              <div>
                <div>{"Incorrect username and/or password."}</div>
                <div className="mx_Login_smallError">
                  Please note you are logging into the{" "}
                  {this.props.serverConfig.hsName} server, not matrix.org.
                </div>
              </div>
            );
          } else {
            errorText = "Incorrect username and/or password.";
          }
        } else {
          // other errors, not specific to doing a password login
          errorText = this.errorTextFromError(error);
        }

        this.setState({
          busy: false,
          busyLoggingIn: false,
          errorText: errorText,
          // 401 would be the sensible status code for 'incorrect password'
          // but the login API gives a 403 https://matrix.org/jira/browse/SYN-744
          // mentions this (although the bug is for UI auth which is not this)
          // We treat both as an incorrect password
          loginIncorrect: error.httpStatus === 401 || error.httpStatus === 403,
        });
      }
    );
  };

  // TODO (maybe later): restore
  // onUsernameBlur = async (username: string) => {
  //   const doWellknownLookup = username[0] === "@";
  //   this.setState({
  //     username: username,
  //     busy: doWellknownLookup,
  //     errorText: null,
  //     canTryLogin: true,
  //   });
  //   if (doWellknownLookup) {
  //     const serverName = username.split(":").slice(1).join(":");
  //     try {
  //       const result = await AutoDiscoveryUtils.validateServerName(serverName);
  //       this.props.onServerConfigChange(result);
  //       // We'd like to rely on new props coming in via `onServerConfigChange`
  //       // so that we know the servers have definitely updated before clearing
  //       // the busy state. In the case of a full MXID that resolves to the same
  //       // HS as Element's default HS though, there may not be any server change.
  //       // To avoid this trap, we clear busy here. For cases where the server
  //       // actually has changed, `initLoginLogic` will be called and manages
  //       // busy state for its own liveness check.
  //       this.setState({
  //         busy: false,
  //       });
  //     } catch (e) {
  //       console.error(
  //         "Problem parsing URL or unhandled error doing .well-known discovery:",
  //         e
  //       );

  //       let message = "Failed to perform homeserver discovery";
  //       if (e.translatedMessage) {
  //         message = e.translatedMessage;
  //       }

  //       let errorText: ReactNode = message;
  //       let discoveryState = {};
  //       if (AutoDiscoveryUtils.isLivelinessError(e)) {
  //         errorText = this.state.errorText;
  //         discoveryState = AutoDiscoveryUtils.authComponentStateForError(e);
  //       }

  //       this.setState({
  //         busy: false,
  //         errorText,
  //         ...discoveryState,
  //       });
  //     }
  //   }
  // };

  onRegisterClick = (ev: React.MouseEvent<HTMLElement>) => {
    ev.preventDefault();
    ev.stopPropagation();
    this.props.onRegisterClick();
  };

  onTryRegisterClick = (ev: React.MouseEvent<HTMLElement>) => {
    const hasPasswordFlow = this.state.flows?.find(
      (flow) => flow.type === "m.login.password"
    );
    const ssoFlow = this.state.flows?.find(
      (flow) => flow.type === "m.login.sso" || flow.type === "m.login.cas"
    );
    // If has no password flow but an SSO flow guess that the user wants to register with SSO.
    // TODO: instead hide the Register button if registration is disabled by checking with the server,
    // has no specific errCode currently and uses M_FORBIDDEN.
    if (ssoFlow && !hasPasswordFlow) {
      ev.preventDefault();
      ev.stopPropagation();
      // TODO: restore for sso
      //   const ssoKind = ssoFlow.type === "m.login.sso" ? "sso" : "cas";
      //   PlatformPeg.get().startSingleSignOn(
      //     this.loginLogic!.createTemporaryClient(),
      //     ssoKind,
      //     this.props.fragmentAfterLogin
      //   );
      throw new Error("sso not implemented");
    } else {
      // Don't intercept - just go through to the register page
      this.onRegisterClick(ev);
    }
  };

  private async initLoginLogic({ hsUrl, isUrl }: ValidatedServerConfig) {
    let isDefaultServer = false;
    if (
      this.props.serverConfig.isDefault &&
      hsUrl === this.props.serverConfig.hsUrl &&
      isUrl === this.props.serverConfig.isUrl
    ) {
      isDefaultServer = true;
    }

    const fallbackHsUrl = isDefaultServer
      ? this.props.fallbackHsUrl
      : undefined;

    const loginLogic = new LoginHelper(hsUrl, isUrl, fallbackHsUrl, {
      defaultDeviceDisplayName: this.props.defaultDeviceDisplayName,
    });
    this.loginLogic = loginLogic;

    this.setState({
      busy: true,
      loginIncorrect: false,
    });

    // Do a quick liveliness check on the URLs
    try {
      const { warning } =
        await AutoDiscoveryUtils.validateServerConfigWithStaticUrls(
          hsUrl,
          isUrl
        );
      if (warning) {
        this.setState({
          ...AutoDiscoveryUtils.authComponentStateForError(warning),
          errorText: "",
        });
      } else {
        this.setState({
          serverIsAlive: true,
          errorText: "",
        });
      }
    } catch (e: any) {
      this.setState({
        busy: false,
        ...AutoDiscoveryUtils.authComponentStateForError(e),
      });
    }

    loginLogic
      .getFlows()
      .then(
        (flows) => {
          // look for a flow where we understand all of the steps.
          const supportedFlows = flows.filter(this.isSupportedFlow);

          if (supportedFlows.length > 0) {
            this.setState({
              flows: supportedFlows,
            });
            return;
          }

          // we got to the end of the list without finding a suitable flow.
          this.setState({
            errorText:
              "This homeserver doesn't offer any login flows which are supported by this client.",
          });
        },
        (err) => {
          this.setState({
            errorText: this.errorTextFromError(err),
            loginIncorrect: false,
            canTryLogin: false,
          });
        }
      )
      .finally(() => {
        this.setState({
          busy: false,
        });
      });
  }

  private isSupportedFlow = (flow: LoginFlow): boolean => {
    // technically the flow can have multiple steps, but no one does this
    // for login and loginLogic doesn't support it so we can ignore it.
    if (!this.stepRendererMap[flow.type]) {
      console.log(
        "Skipping flow",
        flow,
        "due to unsupported login type",
        flow.type
      );
      return false;
    }
    return true;
  };

  private errorTextFromError(err: any): ReactNode {
    let errCode = err.errcode;
    if (!errCode && err.httpStatus) {
      errCode = "HTTP " + err.httpStatus;
    }

    let errorText: ReactNode =
      "There was a problem communicating with the homeserver, " +
      "please try again later." +
      (errCode ? " (" + errCode + ")" : "");

    if (err.cors === "rejected") {
      if (
        window.location.protocol === "https:" &&
        (this.props.serverConfig.hsUrl.startsWith("http:") ||
          !this.props.serverConfig.hsUrl.startsWith("http"))
      ) {
        errorText = (
          <span>
            Can't connect to homeserver via HTTP when an HTTPS URL is in your
            browser bar. Either use HTTPS or{" "}
            <a
              target="_blank"
              rel="noreferrer noopener"
              href="https://www.google.com/search?&q=enable%20unsafe%20scripts">
              enable unsafe scripts
            </a>
          </span>
        );
      } else {
        errorText = (
          <span>
            Can't connect to homeserver - please check your connectivity, ensure
            your
            <a
              target="_blank"
              rel="noreferrer noopener"
              href={this.props.serverConfig.hsUrl}>
              homeserver's SSL certificate
            </a>{" "}
            is trusted, and that a browser extension is not blocking requests.
          </span>
        );
      }
    }

    return errorText;
  }

  renderLoginComponentForFlows() {
    if (!this.state.flows) return null;

    // this is the ideal order we want to show the flows in
    const order = ["m.login.password", "m.login.sso"];

    const flows = order
      .map((type) => this.state.flows!.find((flow) => flow.type === type)!)
      .filter(Boolean);
    return (
      <React.Fragment>
        {flows.map((flow, i) => {
          const stepRenderer = this.stepRendererMap[flow.type];
          return (
            <React.Fragment key={flow.type}>
              {i > 0 && <div className={AuthStyles.OrSeparator}>OR</div>}
              {stepRenderer()}
            </React.Fragment>
          );
        })}
      </React.Fragment>
    );
  }

  private renderPasswordStep = () => {
    return (
      <PasswordLogin
        // We do not control these values, but on submission they do get
        // recorded in the state, so we use the values of the state as
        // default value.
        onSubmit={this.onPasswordLogin}
        defaultUsernameOrEmail={this.state.username}
        defaultPhoneCountry={this.state.phoneCountry}
        defaultPhoneNumber={this.state.phoneNumber}
        // onForgotPasswordClick={this.props.onForgotPasswordClick}
        loginIncorrect={this.state.loginIncorrect}
        serverConfig={this.props.serverConfig}
        disableSubmit={this.isBusy()}
        busy={this.props.isSyncing || this.state.busyLoggingIn}
      />
    );
  };

  private renderSsoStep = (loginType: string) => {
    const flow = this.state.flows!.find(
      (flow) => flow.type === "m.login." + loginType
    ) as ISSOFlow;

    return (
      <SSOButtons
        matrixClient={this.loginLogic!.createTemporaryClient()}
        flow={flow}
        loginType={loginType as any}
        pageAfterLogin={this.props.pageAfterLogin}
        primary={
          !this.state.flows!.find((flow) => flow.type === "m.login.password")
        }
      />
    );
  };

  render() {
    const loader =
      this.isBusy() && !this.state.busyLoggingIn ? <Spinner /> : null;

    const errorText = this.state.errorText;

    let errorTextSection;
    if (errorText) {
      errorTextSection = (
        <SectionMessage appearance="error" key="error">
          <p>{errorText}</p>
        </SectionMessage>
      );
    }

    // let serverDeadSection;
    // if (!this.state.serverIsAlive) {
    //   const classes = classNames({
    //     mx_Login_error: true,
    //     mx_Login_serverError: true,
    //     mx_Login_serverErrorNonFatal: !this.state.serverErrorIsFatal,
    //   });
    //   serverDeadSection = (
    //     <div className={classes}>{this.state.serverDeadError}</div>
    //   );
    // }

    let footer;
    if (this.props.isSyncing || this.state.busyLoggingIn) {
      footer = (
        <Fragment>
          {/* TODO <Spinner />
          {this.props.isSyncing ? "Syncing..." : "Signing In..."} */}
        </Fragment>
      );
      // } else if (SettingsStore.getValue(UIFeature.Registration)) {
    } else {
      footer = (
        <>
          {this.props.onForgotPasswordClick && (
            <>
              <Button
                appearance="link"
                onClick={(e, _) => this.props.onForgotPasswordClick!()}
                href="#">
                Forgot password
              </Button>{" "}
              •{" "}
            </>
          )}
          <Button
            appearance="link"
            onClick={(e, _) => this.onTryRegisterClick(e)}
            href="#">
            Sign up for an account
          </Button>
        </>
      );
    }

    // Renders the components that make up the login page
    return (
      <div className={AuthStyles.AuthPage}>
        <div className={AuthStyles.AuthHeader}>
          <div className={AuthStyles.AuthHeaderLogo}>
            <Logo></Logo>
          </div>
        </div>
        <div className={AuthStyles.AuthBody}>
          <div className={AuthStyles.AuthForm}>
            {errorTextSection}
            {loader}
            {this.renderLoginComponentForFlows()}
            <div className={AuthStyles.AuthFormFooter}>{footer}</div>
          </div>
        </div>
        <div className={AuthStyles.AuthFooter}>
          <HelperMessage>Powered by Matrix</HelperMessage>
        </div>
      </div>
    );
  }
}
