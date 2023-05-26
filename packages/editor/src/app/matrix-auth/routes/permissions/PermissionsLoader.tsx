import Modal, {
  ModalBody,
  ModalHeader,
  ModalTitle,
} from "@atlaskit/modal-dialog";
import Spinner from "@atlaskit/spinner";
import { MatrixMemberReader, getMatrixRoomAccess } from "matrix-crdt";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { MatrixRemote } from "../../../../store/yjs-sync/remote/MatrixRemote";
import PermissionSettings from "./PermissionsSettings";
import styles from "./PermissionsSettings.module.css";
import { PermissionData, UserPermission } from "./permissionUtils";

const PermissionsLoader = observer(
  (props: {
    remote: MatrixRemote;
    user: string | undefined;
    matrixClient: any;
    closeCallback: () => void;
    currentUserId: string;
  }) => {
    const [permissionData, setPermissionData] = useState<
      PermissionData | undefined
    >();

    const mxRemote = props.remote;

    if (!(mxRemote instanceof MatrixRemote)) {
      throw new Error("MatrixRemote not available");
    }
    const mxProvider = mxRemote.matrixProvider;
    const mxReader = mxProvider?.matrixReader;

    if (!mxRemote || !mxReader || !mxProvider || !mxProvider.roomId) {
      throw new Error("MatrixProvider / MatrixReader not available");
    }

    useEffect(() => {
      async function initReader() {
        const roomSettings = await getMatrixRoomAccess(
          props.matrixClient,
          mxProvider!.roomId!
        );
        if (typeof roomSettings !== "string") {
          throw new Error("unexpected roomSettings" + roomSettings);
        }
        const mreader = new MatrixMemberReader(props.matrixClient, mxReader!);
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
    }, [props.remote, mxProvider, mxReader, props.matrixClient]);

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
        matrixClient={props.matrixClient}
        roomId={mxProvider.roomId}
        permissionData={permissionData}
        closeCallback={props.closeCallback}
      />
    );
  }
);

export default PermissionsLoader;
