import { Location, NavigateFunction } from "react-router-dom";
import { parseIdentifier } from "../../identifiers";
import { Identifier } from "../../identifiers/Identifier";
import { BaseResource } from "../../store/BaseResource";

export function OpenNewNotebookDialog(navigate: NavigateFunction) {
  navigate({}, { state: { newNotebookDialog: true } });
}

export function CloseNewNotebookDialog(navigate: NavigateFunction) {
  navigate({}, { state: { newNotebookDialog: undefined } });
}

export function IsNewNotebookDialogOpen(location: Location) {
  return (location as any).state?.newNotebookDialog;
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

export function gotoRegisterScreen(navigate: NavigateFunction) {
  return navigate({ pathname: "/register" });
}

export function gotoLoginScreen(navigate: NavigateFunction) {
  return navigate({ pathname: "/login" });
}

export function gotoRecoverPasswordScreen(navigate: NavigateFunction) {
  return navigate({ pathname: "/recover" });
}

export function gotoStartScreen(navigate: NavigateFunction) {
  return navigate({ pathname: "/" });
}

export function gotoDocs(navigate: NavigateFunction) {
  return navigate({ pathname: "/docs" });
}

export function gotoTutorial(navigate: NavigateFunction) {
  return navigate("/docs/interactive-introduction.md");
}

export function gotoDocument(navigate: NavigateFunction, doc: BaseResource) {
  return gotoIdentifier(navigate, doc.identifier);
}

export function gotoIdentifier(
  navigate: NavigateFunction,
  identifier: Identifier
) {
  return navigate({ pathname: "/" + identifier.toRouteString() });
}

export function gotoIdentifierString(
  navigate: NavigateFunction,
  identifier: string
) {
  return gotoIdentifier(navigate, parseIdentifier(identifier));
}

export function gotoNewGuestNotebook(navigate: NavigateFunction) {
  return gotoIdentifier(
    navigate,
    parseIdentifier({ owner: "@typecell", document: "new" })
  );
}

export function gotoProfilePage(navigate: NavigateFunction, owner: string) {
  if (!owner.startsWith("@")) {
    throw new Error("invalid user id");
  }
  return navigate({ pathname: "/" + owner });
}
