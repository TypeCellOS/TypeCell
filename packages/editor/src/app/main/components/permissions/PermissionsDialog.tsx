import { ModalTransition } from "@atlaskit/modal-dialog";
import React from "react";
import PermissionSettings from "./PermissionsSettings";

export default function PermissionsDialog(props: {
  isOpen: boolean;
  close: () => void;
  user: string | undefined;
}) {
  return (
    <ModalTransition>
      {props.isOpen && (
        <PermissionSettings user={props.user} closeCallback={props.close} />
      )}
    </ModalTransition>
  );
}
