import { observer } from "mobx-react-lite";
import React, { useContext, useEffect, useMemo, useRef } from "react";
import {
  VscDiffAdded,
  VscFile,
  VscFileCode,
  VscFileMedia,
  VscTrash,
} from "react-icons/vsc";
import { MonacoContext } from "../../../runtime/editor/MonacoContext";
import { DocumentResource } from "../../../store/DocumentResource";
import SandboxedExecutionHost from "../../../runtime/executor/executionHosts/sandboxed/SandboxedExecutionHost";
import CellListDraggableCell from "./CellListDraggableCell";
import NotebookCell from "./NotebookCell";
import LocalExecutionHost from "../../../runtime/executor/executionHosts/local/LocalExecutionHost";
import { ExecutionHost } from "../../../runtime/executor/executionHosts/ExecutionHost";
import SourceModelCompiler from "../../../runtime/compiler/SourceModelCompiler";

type Props = {
  document: DocumentResource;
};

const USE_SAFE_IFRAME = false;

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
  }, [props.document.id]);

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
        {cells.map((e, i: number) => (
          <CellListDraggableCell
            key={e.id} // TODO: good that we use id here, but NotebookCell should also be robust to using "i" as key, which it currently isn't
            onAddBefore={() => onAdd(i)}
            onAddAfter={() => onAdd(i + 1)}
            onRemove={() => remove(i)}
            index={i}
            moveCard={props.document.cellList.moveCell}>
            <NotebookCell
              cell={e}
              executionHost={executionHost}
              compiler={compiler}
              awareness={props.document.webrtcProvider?.awareness}
              toolbarContent={
                <>
                  <button
                    title="TypeScript"
                    className={e.language === "typescript" ? "active" : ""}>
                    <VscFileCode onClick={() => e.setLanguage("typescript")} />
                  </button>
                  {/* <button title="TypeScript (node)" className={props.cell.language === "node-typescript" ? "active" : ""}>
                <VscServerProcess onClick={() => props.cell.setLanguage("node-typescript")} />
              </button> */}
                  <button
                    title="Markdown"
                    className={e.language === "markdown" ? "active" : ""}>
                    <VscFile onClick={() => e.setLanguage("markdown")} />
                  </button>
                  <button
                    title="Markdown"
                    className={e.language === "css" ? "active" : ""}>
                    <VscFileMedia onClick={() => e.setLanguage("css")} />
                  </button>
                  <button title="Delete" onClick={() => remove(i)}>
                    <VscTrash />
                  </button>
                  {/* <button title="More">
                <VscEllipsis />
              </button> */}
                </>
              }
            />
          </CellListDraggableCell>
        ))}
      </div>
    </div>
  );
});

export default NotebookRenderer;
