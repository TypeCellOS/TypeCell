/*
Copyright 2020 The Matrix.org Foundation C.I.C.

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

import Button from "@atlaskit/button";
import { MatrixClient } from "matrix-js-sdk";
import { startSingleSignOn } from "../../AuthStoreUtil";
import AuthStyles from "../AuthStyles.module.css";
import {
  IdentityProviderBrand,
  IIdentityProvider,
  ISSOFlow,
} from "../LoginHelper";
import { mediaFromMxc } from "../util/Media";
import apple from "./res/apple.svg";
import facebook from "./res/facebook.svg";
import github from "./res/github.svg";
import gitlab from "./res/gitlab.svg";
import google from "./res/google.svg";
import twitter from "./res/twitter.svg";

interface ISSOButtonProps extends Omit<IProps, "flow"> {
  idp: IIdentityProvider;
}

const getIcon = (brand: IdentityProviderBrand | string) => {
  switch (brand) {
    case IdentityProviderBrand.Apple:
      return apple;
    case IdentityProviderBrand.Facebook:
      return facebook;
    case IdentityProviderBrand.Github:
      return github;
    case IdentityProviderBrand.Gitlab:
      return gitlab;
    case IdentityProviderBrand.Google:
      return google;
    case IdentityProviderBrand.Twitter:
      return twitter;
    default:
      return null;
  }
};

const SSOButton: React.FC<ISSOButtonProps> = ({
  matrixClient,
  loginType,
  pageAfterLogin,
  idp,
  primary,
  ...props
}) => {
  const label = idp
    ? `Continue with ${idp.name}`
    : "Sign in with single sign-on";

  const onClick = () => {
    startSingleSignOn(matrixClient, loginType as any, pageAfterLogin, idp?.id);
  };

  let icon;
  let brandClass: string | undefined;

  const brandIcon = idp && idp.brand ? getIcon(idp.brand) : null;
  if (brandIcon && idp.brand) {
    const brandName = idp.brand.split(".").pop();
    brandClass = `mx_SSOButton_brand_${brandName}`;
    icon = <img src={brandIcon} height="24" width="24" alt={brandName} />;
  } else if (typeof idp?.icon === "string" && idp.icon.startsWith("mxc://")) {
    const src = mediaFromMxc(idp.icon, matrixClient).getSquareThumbnailHttp(24);
    icon = <img src={src} height="24" width="24" alt={idp.name} />;
  }

  const classes = classNames(AuthStyles.SSOButton, AuthStyles.AuthButton, {
    [brandClass!]: brandClass,
    mx_SSOButton_default: !idp,
    mx_SSOButton_primary: primary,
  });

  //   if (mini) {
  //     // TODO fallback icon
  //     return (
  //       <AccessibleTooltipButton
  //         {...props}
  //         title={label}
  //         className={classes}
  //         onClick={onClick}>
  //         {icon}
  //       </AccessibleTooltipButton>
  //     );
  //   }

  return (
    <Button
      {...props}
      shouldFitContainer
      className={classes}
      onClick={onClick}
      iconBefore={icon}>
      {label}
    </Button>
  );
};

interface IProps {
  matrixClient: MatrixClient;
  flow: ISSOFlow;
  loginType?: "sso" | "cas";
  pageAfterLogin?: string;
  primary?: boolean;
}

const SSOButtons: React.FC<IProps> = ({
  matrixClient,
  flow,
  loginType,
  pageAfterLogin,
  primary,
}) => {
  const providers = flow.identity_providers || [];

  return (
    <div className="mx_SSOButtons">
      {providers.map((idp: any) => (
        <SSOButton
          key={idp.id}
          matrixClient={matrixClient}
          loginType={loginType}
          pageAfterLogin={pageAfterLogin}
          idp={idp}
          primary={primary}
        />
      ))}
    </div>
  );
};

export default SSOButtons;
