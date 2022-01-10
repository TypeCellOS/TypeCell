import { observer } from "mobx-react-lite";
import React, { useContext, useEffect, useMemo, useRef } from "react";
import { VscDiffAdded } from "react-icons/vsc";
import SourceModelCompiler from "../../../runtime/compiler/SourceModelCompiler";
import { MonacoContext } from "../../../runtime/editor/MonacoContext";
// import LocalExecutionHost from "../../../runtime/executor/executionHosts/local/LocalExecutionHost"
import { ExecutionHost } from "../../../runtime/executor/executionHosts/ExecutionHost";
import SandboxedExecutionHost from "../../../runtime/executor/executionHosts/sandboxed/SandboxedExecutionHost";
import { DocumentResource } from "../../../store/DocumentResource";
import CellListDraggableCell from "./CellListDraggableCell";
import NotebookLanguageSelector from "./LanguageSelector";
import NotebookCell from "./NotebookCell";
import { MonacoColorManager } from "./MonacoColorManager";
import { getStoreService } from "../../../store/local/stores";

type Props = {
  document: DocumentResource;
};

const USE_SAFE_IFRAME = true;

const NotebookRenderer: React.FC<Props> = observer((props) => {
  const sessionStore = getStoreService().sessionStore;
  const disposer = useRef<() => void>();
  const monaco = useContext(MonacoContext).monaco;

  useEffect(() => {
    // make sure color info is broadcast, and color info from other users are reflected in monaco editor styles
    if (props.document.webrtcProvider?.awareness) {
      const colorManager = new MonacoColorManager(
        props.document.webrtcProvider.awareness,
        sessionStore.loggedInUserId || "Anonymous",
        sessionStore.userColor
      );
      return () => {
        colorManager.dispose();
      };
    }
  }, [
    props.document.webrtcProvider?.awareness,
    sessionStore.loggedInUserId,
    sessionStore.userColor,
  ]);

  const [compiler, executionHost] = useMemo(() => {
    if (disposer.current) {
      disposer.current();
      disposer.current = undefined;
    }
    const newCompiler = new SourceModelCompiler(monaco);
    if (!USE_SAFE_IFRAME) {
      throw new Error(
        "LocalExecutionHost disabled to prevent large bundle size"
      );
      // newExecutionHost = new LocalExecutionHost(props.document.id, newCompiler, monaco);
    }
    const newExecutionHost: ExecutionHost = new SandboxedExecutionHost(
      props.document.id,
      newCompiler,
      monaco
    );

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