import { Location, NavigateFunction, To } from "react-router-dom";
import { Identifier } from "../../identifiers/Identifier";
import { identifiersToPath } from "../../identifiers/paths/identifierPathHelpers";
import { BaseResource } from "../../store/BaseResource";


export function OpenPermissionsDialog(navigate: NavigateFunction) {
  navigate({}, { state: { permissionsDialog: true } });
}

export function ClosePermissionsDialog(navigate: NavigateFunction) {
  navigate({}, { state: { permissionsDialog: undefined } });
}

export function IsPermissionsDialogOpen(location: Location) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (location as any).state?.permissionsDialog;
}

export function toRegisterScreen(): To {
  return { pathname: "/register" };
}

export function toLoginScreen(): To {
  return { pathname: "/login" };
}

export function toRecoverPasswordScreen(): To {
  return { pathname: "/recover" };
}

export function toStartScreen(): To {
  return { pathname: "/" };
}

export function toDocs(): To {
  return { pathname: "/docs" };
}

export function toTutorial(): To {
  return { pathname: "/docs/interactive-introduction.md" };
}

export function toDocument(doc: BaseResource): To {
  return toIdentifier(doc.identifier);
}

export function toIdentifier(identifier: Identifier): To {
  return { pathname: "/" + identifiersToPath(identifier) };
}

export function toNewGuestNotebook(): To {
  return "/TODO";
  // return toIdentifier(parseIdentifier({ owner: "@typecell", document: "new" }));
}

export function toProfilePage(owner: string): To {
  if (!owner.startsWith("@")) {
    throw new Error("invalid user id");
  }
  return { pathname: "/" + owner };
}
