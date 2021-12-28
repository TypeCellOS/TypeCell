import { untracked } from "mobx";
import { observer } from "mobx-react-lite";
// import useCellModel from "./useCellModel.ts.bak";
import type * as monaco from "monaco-editor";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { VscChevronDown, VscChevronRight } from "react-icons/vsc";
import { Awareness } from "y-protocols/awareness";
import {
  getTypeCellCodeModel,
  TypeCellCodeModel,
} from "../../../models/TypeCellCodeModel";
import SourceModelCompiler from "../../../runtime/compiler/SourceModelCompiler";
import { MonacoContext } from "../../../runtime/editor/MonacoContext";
import { ExecutionHost } from "../../../runtime/executor/executionHosts/ExecutionHost";
import { getStoreService } from "../../../store/local/stores";
import { HoverTrackerContext } from "./HoverTrackerContext";
import { NotebookCellModel } from "./NotebookCellModel";
// import { MonacoBinding } from "y-monaco";
import { MonacoBinding } from "./y-monaco";

type Props = {
  cell: NotebookCellModel;
  compiler: SourceModelCompiler;
  executionHost: ExecutionHost;
  onRemove?: () => void;
  classList?: string;
  defaultCollapsed?: boolean;
  initialFocus?: boolean;
  awareness: Awareness | undefined;
  toolbar?: React.ReactElement;
};

const NotebookCell: React.FC<Props> = observer((props) => {
  const initial = useRef(true);
  const [model, setModel] = useState<TypeCellCodeModel>();
  const [monacoModel, setMonacoModel] = useState<
    monaco.editor.ITextModel | undefined
  >();
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>();
  const disposeHandlers = useRef<Array<() => void>>();
  const monaco = useContext(MonacoContext).monaco;
  // const [codeRef, setCodeRef] = useState<HTMLDivElement>();

  const sessionStore = getStoreService().sessionStore;
  const user = sessionStore.loggedInUser;

  const [codeVisible, setCodeVisible] = useState(
    untracked(
      () =>
        !(
          props.defaultCollapsed === true ||
          props.cell.language === "markdown" ||
          props.cell.code.toJSON().startsWith("// @default-collapsed")
        )
    )
  );

  const codeRefCallback = useCallback(
    (el: HTMLDivElement) => {
      let disposed = false;
      if (editor && editor?.getContainerDomNode() !== el) {
        disposeHandlers.current?.forEach((dispose) => dispose());
        editor.dispose();
        disposed = true;
        setEditor(undefined);
      }

      if (el && editor?.getContainerDomNode() !== el) {
        if (editor && !disposed) {
          throw new Error("not expected");
        }

        const newEditor = monaco.editor.create(el, {
          model: null,
          scrollBeyondLastLine: false,
          minimap: {
            enabled: false,
          },
          overviewRulerLanes: 0,
          lineNumbersMinChars: 1,
          lineNumbers: "on",
          tabSize: 2,
          scrollbar: {
            alwaysConsumeMouseWheel: false,
          },
          theme: "typecellTheme",
        });

        if (props.initialFocus && initial.current) {
          initial.current = false;
          // newEditor.focus();
        }

        newEditor.onDidBlurEditorWidget(() => {
          newEditor.trigger("blur", "editor.action.formatDocument", {});
        });

        newEditor.onDidContentSizeChange(() => {
          const contentHeight = Math.min(500, newEditor.getContentHeight());
          try {
            newEditor.layout({
              height: contentHeight,
              width: newEditor.getContainerDomNode()!.offsetWidth,
            });
          } finally {
          }
        });

        setEditor(newEditor);
      }
    },
    [editor, props.initialFocus, monaco.editor]
  );

  useEffect(() => {
    const newModel = getTypeCellCodeModel(props.cell, monaco);
    // TODO: do we want to do this here? At least for PluginRenderer, it will register twice
    // (currently this is ignored in the engine and only logs a warning)
    props.compiler.registerModel(newModel.object);
    const monacoModel = newModel.object.acquireMonacoModel();
    setModel(newModel.object);
    setMonacoModel(monacoModel);
    return () => {
      console.log("dispose newModel", props.cell.path);
      newModel.object.releaseMonacoModel();
      newModel.dispose();
      setModel(undefined);
      setMonacoModel(undefined);
    };
  }, [props.cell, props.compiler, monaco]);

  useEffect(() => {
    if (!editor || !monacoModel) {
      return;
    }
    editor.setModel(monacoModel);

    const monacoBinding = new MonacoBinding(
      props.cell.code,
      monacoModel,
      new Set([editor]),
      props.awareness || null // TODO: fix reference to doc
    );

    // This is a bit of a hack. MonacoBinding sets an eventListener to cell.code.
    // however, getModel() already has an event listener.
    // Make sure that the binding's listener is always raised first, so that:
    // - first, the binding applies edits to monaco with applyEdits
    // - then, the autorun in observer is called, but we notice the value hasn't changed
    // Instead of the other way around:
    // - first: the autorun is called, calling monacomodel.setValue()
    // - then, the edits are applied
    // ---> model value is messed up and we can end up in an infinite loop
    const old = props.cell.code._eH.l.pop()!;
    props.cell.code._eH.l.unshift(old);

    return () => {
      monacoBinding.destroy();
      // releaseModel(props.cell);
    };
  }, [
    editor,
    monacoModel,
    user,
    props,
    props.cell.code,
    props.compiler,
    props.awareness,
  ]);

  // Disabled, feels weird, work on UX
  // editor.current.onKeyUp((e) => {
  //   // TODO: would be better to trigger this via  main.languages.registerOnTypeFormattingEditProvider, but:
  //   // 1) prettier doesn't have a typeformatting provider (might not be critical as we can use prettier to format complete document)
  //   // 2) https://github.com/microsoft/monaco-editor/issues/2296
  //   if (/*e.code === "Enter" ||*/ e.code === "Semicolon" || e.code === "BracketRight") {
  //     // TODO performance impact?
  //     // editor.current!.trigger("enterkey", "editor.action.formatDocument", {});
  //   }
  // });

  // var extension = new MonacoMarkdown.MonacoMarkdownExtension();
  // extension.activate(editor.current);

  //     disposeHandlers.current = [editor.current.onDidContentSizeChange(() => {
  //         if (!editor.current) {
  //             return;
  //         }
  //         const contentHeight = Math.min(500, editor.current.getContentHeight());
  //         try {
  //             editor.current.layout({ height: contentHeight, width: element.offsetWidth });
  //         } finally {
  //         }
  //     }).dispose, () => {
  //         monacoBinding.destroy();
  //     }];

  //     if (props.initialFocus && initial.current) {
  //         initial.current = false;
  //         editor.current.focus();
  //     }
  // }
  //     },
  // [model, codeRefCallback.current]
  // );

  const hoverTrackerContext = useContext(HoverTrackerContext);

  return (
    <div
      className={`notebookCell ${codeVisible ? "expanded" : "collapsed"} ${
        props.cell.language
      } ${props.classList || ""}`}
      style={{ display: "flex", flexDirection: "row" }}>
      {codeVisible ? (
        <VscChevronDown
          title="Show / hide code"
          className="notebookCell-sideIcon"
          onClick={() => setCodeVisible(false)}
        />
      ) : (
        <VscChevronRight
          title="Show / hide code"
          className="notebookCell-sideIcon"
          onClick={() => setCodeVisible(true)}
        />
      )}
      {}
      <div style={{ flex: 1 }} className="notebookCell-content">
        {codeVisible && (
          <div className="notebookCell-codeContainer">
            {props.toolbar && props.toolbar}
            <div
              className="code"
              ref={codeRefCallback}
              style={{ height: "100%" }}></div>
          </div>
        )}

        <div
          className="output"
          contentEditable={false}
          style={{ position: "relative" }}>
          {model &&
            props.executionHost.renderOutput(
              model,
              hoverTrackerContext.setHover
            )}
        </div>
      </div>
    </div>
  );
});

export default NotebookCell;
