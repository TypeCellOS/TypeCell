import { ModalTransition } from "@atlaskit/modal-dialog";
import { observer } from "mobx-react-lite";

import Button from "@atlaskit/button";
import Checkbox from "@atlaskit/checkbox";
import Modal, {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@atlaskit/modal-dialog";
import { useResource } from "@typecell-org/util";
import { useState } from "react";
import { Identifier } from "../../../../identifiers/Identifier";
import { DocConnection } from "../../../../store/DocConnection";
import { DocumentResource } from "../../../../store/DocumentResource";
import { SessionStore } from "../../../../store/local/SessionStore";
// import { SupabaseSessionStore } from "../../SupabaseSessionStore";

const PluginCheckbox = (props: {
  id: string;
  sessionStore: SessionStore;
  onChange: (checked: boolean) => void;
  checked?: boolean;
  disabled?: boolean;
}) => {
  const { sessionStore } = props;

  const doc = useResource(() => {
    const d = DocConnection.load(props.id, sessionStore);
    return [
      d,
      () => {
        d.dispose();
      },
    ];
  }, [props.id, sessionStore]);

  if (typeof doc.doc === "string") {
    return <div>Loading...</div>;
  }

  const dr = doc.doc.getSpecificType(DocumentResource);
  return (
    <div>
      <Checkbox
        isChecked={props.checked}
        isDisabled={props.disabled}
        onChange={(e) => {
          props.onChange(e.target.checked);
        }}
        value={doc.doc.id}
        label={`${dr.title} (${doc.doc.id})`}
        size="medium"
      />
      {/*  */}
    </div>
  );
};

const PluginDialog = observer(
  (props: {
    isOpen: boolean;
    close: () => void;
    identifier: Identifier;
    sessionStore: SessionStore;
    document: DocumentResource;
  }) => {
    const { sessionStore } = props;
    // const user = sessionStore.user;
    // if (typeof user === "string" || user.type === "guest-user") {
    // return null;
    // }
    const availablePlugins = [
      ...(props.sessionStore.documentCoordinator?.documents.values() || []),
    ]
      .filter((d) => d.has_plugins)
      .map((el) => el.id);

    const enabledPlugins = [...props.document.plugins.keys()];

    const oldPlugins = enabledPlugins.filter(
      (p) => !availablePlugins.includes(p),
    );

    const availableNotEnabledPlugins = availablePlugins.filter(
      (p) => !enabledPlugins.includes(p),
    );

    const [changedStates, setChangedStates] = useState<Record<string, boolean>>(
      {},
    );

    return (
      <ModalTransition>
        {props.isOpen && (
          <Modal
            // TODO
            // css={{ overflow: "visible" }}
            onClose={() => props.close()}>
            <ModalHeader>
              <ModalTitle>Plugins</ModalTitle>
            </ModalHeader>
            <ModalBody>
              {enabledPlugins.map((plugin) => (
                <div key={plugin}>
                  <PluginCheckbox
                    onChange={(val) => {
                      setChangedStates((prev) => ({ ...prev, [plugin]: val }));
                    }}
                    checked={changedStates[plugin] ?? true}
                    sessionStore={sessionStore}
                    id={plugin}
                  />
                </div>
              ))}
              {oldPlugins.map((plugin) => (
                <div key={plugin}>
                  <PluginCheckbox
                    onChange={(val) => {
                      setChangedStates((prev) => ({ ...prev, [plugin]: val }));
                    }}
                    checked={changedStates[plugin] ?? true}
                    disabled={true}
                    sessionStore={sessionStore}
                    id={plugin}
                  />
                </div>
              ))}
              {availableNotEnabledPlugins.map((plugin) => (
                <div key={plugin}>
                  <PluginCheckbox
                    onChange={(val) => {
                      setChangedStates((prev) => ({ ...prev, [plugin]: val }));
                    }}
                    checked={changedStates[plugin] ?? false}
                    sessionStore={sessionStore}
                    id={plugin}
                  />
                </div>
              ))}
            </ModalBody>
            <ModalFooter>
              <Button
                appearance="primary"
                autoFocus
                type="submit"
                onClick={() => {
                  for (const [plugin, enabled] of Object.entries(
                    changedStates,
                  )) {
                    if (enabled) {
                      props.document.plugins.set(plugin, true);
                    } else {
                      props.document.plugins.delete(plugin);
                    }
                  }
                  props.close();
                }}>
                Apply
              </Button>
              <Button appearance="subtle" onClick={() => props.close()}>
                Cancel
              </Button>
            </ModalFooter>
          </Modal>
        )}
      </ModalTransition>
    );
  },
);

export default PluginDialog;
