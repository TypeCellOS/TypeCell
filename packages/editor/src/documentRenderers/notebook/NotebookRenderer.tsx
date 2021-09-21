import { observer } from "mobx-react-lite";
import React, { useContext, useEffect, useMemo, useRef } from "react";
import {
  VscDiffAdded,
  VscFile,
  VscFileCode,
  VscFileMedia,
  VscTrash,
} from "react-icons/vsc";
import { MonacoContext } from "../../sandbox/MonacoContext";
import { DocumentResource } from "../../store/DocumentResource";
import EngineWithOutput from "../../typecellEngine/EngineWithOutput";
import IframeEngine from "../../typecellEngine/IframeEngine";
import CellListDraggableCell from "./CellListDraggableCell";
import NotebookCell from "./NotebookCell";

type Props = {
  document: DocumentResource;
};

const USE_SAFE_IFRAME = false;

const NotebookRenderer: React.FC<Props> = observer((props) => {
  const disposer = useRef<() => void>();
  const monaco = useContext(MonacoContext).monaco;
  const engine = useMemo(() => {
    if (disposer.current) {
      disposer.current();
      disposer.current = undefined;
    }
    const newEngine = USE_SAFE_IFRAME
      ? new IframeEngine(props.document.id, true)
      : new EngineWithOutput(props.document.id, monaco);
    disposer.current = () => {
      newEngine.dispose();
    };

    return newEngine;
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
        {engine.renderContainer()}
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
              engine={engine}
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
