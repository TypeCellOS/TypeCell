import Modal, {
  ModalBody,
  ModalHeader,
  ModalTitle,
} from "@atlaskit/modal-dialog";
import Spinner from "@atlaskit/spinner";
import { getMatrixRoomAccess, MatrixMemberReader } from "matrix-crdt";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { DocConnection } from "../../../../store/DocConnection";
import PermissionSettings from "./PermissionsSettings";
import styles from "./PermissionsSettings.module.css";
import { PermissionData, UserPermission } from "./permissionUtils";

const PermissionsLoader = observer(
  (props: {
    document: DocConnection;
    user: string | undefined;
    matrixClient: any;
    closeCallback: () => void;
    currentUserId: string;
  }) => {
    const [permissionData, setPermissionData] = useState<
      PermissionData | undefined
    >();

    useEffect(() => {
      const mxProvider = props.document.matrixProvider!;
      const mxReader = props.document.matrixProvider?.matrixReader!;
      if (!mxProvider || !mxReader || !mxProvider.roomId) {
        throw new Error("MatrixProvider / MatrixReader not available");
      }
      async function initReader() {
        const roomSettings = await getMatrixRoomAccess(
          props.matrixClient,
          mxProvider.roomId!
        );
        if (typeof roomSettings !== "string") {
          throw new Error("unexpected roomSettings" + roomSettings);
        }
        const mreader = new MatrixMemberReader(props.matrixClient, mxReader);
        await mreader.initialize();

        const entries = [...mreader.members.values()].map((u) => {
          const ret: [string, UserPermission] = [
            u.user_id,
            mreader.hasWriteAccess(u.user_id, "org.typecell.doc_update")
              ? "edit"
              : "view",
          ];
          return ret;
        });
        mreader.dispose();
        setPermissionData({
          doc: roomSettings,
          users: new Map(entries),
        });
      }
      initReader();
      return () => {
        setPermissionData(undefined);
      };
    }, [
      props.document,
      props.document.matrixProvider?.matrixReader,
      props.matrixClient,
    ]);

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

    const mxProvider = props.document.matrixProvider!;
    if (!mxProvider || !mxProvider.roomId) {
      throw new Error("roomId not available");
    }

    return (
      <PermissionSettings
        currentUserId={props.currentUserId}
        matrixClient={props.matrixClient}
        roomId={mxProvider.roomId}
        permissionData={permissionData}
        closeCallback={props.closeCallback}
      />
    );
  }
);

export default PermissionsLoader;
