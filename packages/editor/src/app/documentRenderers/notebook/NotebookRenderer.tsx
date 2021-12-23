import { observer } from "mobx-react-lite";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { VscDiffAdded } from "react-icons/vsc";
import { MonacoContext } from "../../../runtime/editor/MonacoContext";
import { DocumentResource } from "../../../store/DocumentResource";
import SandboxedExecutionHost from "../../../runtime/executor/executionHosts/sandboxed/SandboxedExecutionHost";
import CellListDraggableCell from "./CellListDraggableCell";
import NotebookCell from "./NotebookCell";
import LocalExecutionHost from "../../../runtime/executor/executionHosts/local/LocalExecutionHost";
import { ExecutionHost } from "../../../runtime/executor/executionHosts/ExecutionHost";
import SourceModelCompiler from "../../../runtime/compiler/SourceModelCompiler";
import NotebookLanguageSelector from "./LanguageSelector";
import { arrays } from "vscode-lib";
import { getStoreService } from "../../../store/local/stores";

type Props = {
  document: DocumentResource;
};

type User = {
  name: string;
  color: string;
  clientID: number;
};

const colors = [
  "#958DF1",
  "#F98181",
  "#FBBC88",
  "#FAF594",
  "#70CFF8",
  "#94FADB",
  "#B9F18D",
];

function generateUserAwarenessCSS(user: User) {
  const selectionClassName = `user-selection-${user.clientID}`;
  const headClassName = `user-selection-head-${user.clientID}`;

  const css =
    `.${selectionClassName}, .${selectionClassName}::after, .${selectionClassName}::before,
     .${headClassName}, .${headClassName}::after, .${headClassName}::before
     {
       background-color: ${user.color} !important;
       border-color: ${user.color} !important;
     }
     
     .${selectionClassName}::after {
       content: '${user.name}'
     }
     `.trim();

  const styleElement = document.createElement("style");

  styleElement.innerText = css;
  document.head.appendChild(styleElement);
}

const USE_SAFE_IFRAME = true;

const NotebookRenderer: React.FC<Props> = observer((props) => {
  const sessionStore = getStoreService().sessionStore;

  const user = sessionStore.loggedInUser;

  if (!user) return <div>Not logged in</div>

  const disposer = useRef<() => void>();
  const monaco = useContext(MonacoContext).monaco;
  const [userStore, setUserStore] = useState<Map<number, User>>(new Map())

  const addUserAwarenessCSS = (clientID: number, name: string, color?: string): string => {
    if (!userStore.has(clientID)) {
      // Generate a random color
      // const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
      color = color ?? (arrays.getRandomElement(colors) ?? '#eee')

      const user = {
        clientID,
        name,
        color,
      }

      generateUserAwarenessCSS(user);

      userStore.set(clientID, user);

      setUserStore(userStore);
    }

    return userStore.get(clientID)!.color;
  }

  const [compiler, executionHost] = useMemo(() => {
    if (disposer.current) {
      disposer.current();
      disposer.current = undefined;
    }
    const newCompiler = new SourceModelCompiler(monaco);
    const newExecutionHost: ExecutionHost = USE_SAFE_IFRAME
      ? new SandboxedExecutionHost(props.document.id, newCompiler, monaco)
      : new LocalExecutionHost(props.document.id, newCompiler, monaco);

    disposer.current = () => {
      newCompiler.dispose();
      newExecutionHost.dispose();
    };

    return [newCompiler, newExecutionHost];
  }, [props.document.id, monaco]);

  useEffect(() => {
    return () => {
      if (disposer.current) {
        disposer.current();
        disposer.current = undefined;
      }
    };
  }, []);

  const onAdd = (i: number) => {
    props.document.cellList.addCell(i, "typescript", "// Enter code here");
  };

  const remove = (i: number) => {
    props.document.cellList.removeCell(i);
  };

  const cells = props.document.cells;
  // renderLogger.log("cellList");
  return (
    <div className="cellList">
      <div style={{ position: "relative" }}>
        {executionHost.renderContainer()}
        {/* <p>{engine && engine.id} {Math.random()}</p> */}
        {cells.length === 0 && (
          <VscDiffAdded
            onClick={() => onAdd(0)}
            className="cellList-add-single"
          />
        )}
        {cells.map((cell, i: number) => (
          <CellListDraggableCell
            key={cell.id} // TODO: good that we use id here, but NotebookCell should also be robust to using "i" as key, which it currently isn't
            onAddBefore={() => onAdd(i)}
            onAddAfter={() => onAdd(i + 1)}
            onRemove={() => remove(i)}
            index={i}
            moveCard={props.document.cellList.moveCell}>
            <NotebookCell
              cell={cell}
              executionHost={executionHost}
              compiler={compiler}
              awareness={props.document.webrtcProvider?.awareness}
              addUserAwarenessCSS={addUserAwarenessCSS}
              toolbar={
                <NotebookLanguageSelector
                  language={cell.language}
                  onChangeLanguage={(language) => cell.setLanguage(language)}
                // onRemove={() => remove(i)}
                />
              }
            />
          </CellListDraggableCell>
        ))}
      </div>
    </div>
  );
});

export default NotebookRenderer;