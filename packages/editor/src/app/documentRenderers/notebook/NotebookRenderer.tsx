import { observer } from "mobx-react-lite";
import React, { useContext, useEffect, useMemo, useRef } from "react";
import { VscDiffAdded } from "react-icons/vsc";
import { MonacoContext } from "../../../runtime/editor/MonacoContext";
import { DocumentResource } from "../../../store/DocumentResource";
import SandboxedExecutionHost from "../../../runtime/executor/executionHosts/sandboxed/SandboxedExecutionHost";
import CellListDraggableCell from "./CellListDraggableCell";
import NotebookCell from "./NotebookCell";
import LocalExecutionHost from "../../../runtime/executor/executionHosts/local/LocalExecutionHost";
import { ExecutionHost } from "../../../runtime/executor/executionHosts/ExecutionHost";
import SourceModelCompiler from "../../../runtime/compiler/SourceModelCompiler";
import NotebookToolbar from "./LanguageSelector";

type Props = {
  document: DocumentResource;
};

const USE_SAFE_IFRAME = true;

const NotebookRenderer: React.FC<Props> = observer((props) => {
  const disposer = useRef<() => void>();
  const monaco = useContext(MonacoContext).monaco;
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
              toolbar={
                <NotebookToolbar
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
