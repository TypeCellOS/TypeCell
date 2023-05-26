import Modal, {
  ModalBody,
  ModalHeader,
  ModalTitle,
} from "@atlaskit/modal-dialog";
import Spinner from "@atlaskit/spinner";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import { Identifier } from "../../../../identifiers/Identifier";
import { TypeCellIdentifier } from "../../../../identifiers/TypeCellIdentifier";
import { SupabaseClientType } from "../../SupabaseSessionStore";
import PermissionSettings from "./PermissionsSettings";
import styles from "./PermissionsSettings.module.css";
import { PermissionData, updatePermissionData } from "./permissionUtils";

const PermissionsLoader = observer(
  (props: {
    identifier: Identifier;
    user: string | undefined;
    supabaseClient: SupabaseClientType;
    closeCallback: () => void;
    currentUserId: string;
  }) => {
    if (!(props.identifier instanceof TypeCellIdentifier)) {
      throw new Error("unexpected identifier");
    }
    const nanoId = props.identifier.documentId;

    const [internalDocId, setInternalDocId] = useState<string>();

    const [permissionData, setPermissionData] = useState<
      PermissionData | undefined
    >();

    const onSave = useCallback(
      async (newData: PermissionData) => {
        if (!internalDocId || !permissionData) {
          throw new Error("unexpected, no internalDocId or permissionData");
        }
        await updatePermissionData(
          props.supabaseClient,
          internalDocId,
          permissionData,
          newData
        );
      },
      [internalDocId, permissionData, props.supabaseClient]
    );

    useEffect(() => {
      async function initReader() {
        const doc = await props.supabaseClient
          .from("documents")
          .select("id,public_access_level")
          .eq("nano_id", nanoId);

        if (!doc.data || doc.data.length !== 1) {
          return;
        }
        const permissionData = await props.supabaseClient
          .from("document_permissions")
          .select()
          .eq("document_id", doc.data[0].id);

        const usernamesRet = await props.supabaseClient
          .from("workspaces")
          .select()
          .eq("is_username", true)
          .in(
            "owner_user_id",
            permissionData.data?.map((p) => p.user_id) || []
          );
        const usernamesMap = new Map<string, string>(
          usernamesRet.data?.map((d) => [d.owner_user_id, d.name])
        );
        const entries =
          permissionData.data?.map(
            (u) =>
              [
                u.user_id!,
                {
                  user: {
                    id: u.user_id!,
                    name: "@" + usernamesMap.get(u.user_id!)!,
                    nameWithoutAtSign: usernamesMap.get(u.user_id!)!,
                  },
                  permission: u.access_level,
                },
              ] as const
          ) || [];

        setInternalDocId(doc.data[0].id);
        setPermissionData({
          doc: doc.data[0].public_access_level,
          users: new Map(entries),
        });
      }
      initReader();
      return () => {
        setPermissionData(undefined);
      };
    }, [nanoId, props.identifier, props.supabaseClient]);

    if (!permissionData) {
      return (
        <Modal css={{ overflow: "visible" }} onClose={props.closeCallback}>
          <ModalHeader>
            <ModalTitle>Sharing & Permissions</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <div className={styles.body}>
              <Spinner />
            </div>
          </ModalBody>
        </Modal>
      );
    }

    return (
      <PermissionSettings
        currentUserId={props.currentUserId}
        supabaseClient={props.supabaseClient}
        // roomId={mxProvider.roomId}
        permissionData={permissionData}
        closeCallback={props.closeCallback}
        onSave={onSave}
      />
    );
  }
);

export default PermissionsLoader;
