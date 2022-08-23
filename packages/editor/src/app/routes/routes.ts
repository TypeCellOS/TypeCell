import { Location, NavigateFunction, To } from "react-router-dom";
import { parseIdentifier } from "../../identifiers";
import { Identifier } from "../../identifiers/Identifier";
import { BaseResource } from "../../store/BaseResource";

export function OpenNewDocumentDialog(navigate: NavigateFunction) {
  navigate({}, { state: { newDocumentDialog: true } });
}

export function CloseNewDocumentDialog(navigate: NavigateFunction) {
  navigate({}, { state: { newDocumentDialog: undefined } });
}

export function IsNewDocumentDialogOpen(location: Location) {
  return (location as any).state?.newDocumentDialog;
}

export function OpenPermissionsDialog(navigate: NavigateFunction) {
  navigate({}, { state: { permissionsDialog: true } });
}

export function ClosePermissionsDialog(navigate: NavigateFunction) {
  navigate({}, { state: { permissionsDialog: undefined } });
}

export function IsPermissionsDialogOpen(location: Location) {
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
  return { pathname: identifier.toRouteString() };
}

export function toIdentifierString(identifier: string): To {
  return toIdentifier(parseIdentifier(identifier));
}

export function toNewGuestNotebook(): To {
  return toIdentifier(parseIdentifier({ owner: "@typecell", document: "new" }));
}

export function toProfilePage(owner: string): To {
  if (!owner.startsWith("@")) {
    throw new Error("invalid user id");
  }
  return { pathname: "/" + owner };
}
