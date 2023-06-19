import { NodeViewProps } from "@tiptap/core";

import * as monaco from "monaco-editor";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MonacoTypeCellCodeModel } from "../../../models/MonacoTypeCellCodeModel";
import {
  applyDecorationsToMonaco,
  applyNodeChangesToMonaco,
} from "./MonacoProsemirrorHelpers";
import { RichTextContext } from "./RichTextContext";

const MonacoElementComponent = function MonacoElement(
  props: NodeViewProps & { block: any; selectionHack: any }
) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  const refa = useRef<any>(Math.random());
  const context = useContext(RichTextContext);

  // hacky way to only initialize some resources once
  // probably useMemo is not the best fit for this
  const models = useMemo(() => {
    // console.log("create", props.block.id, refa.current);
    const uri = monaco.Uri.parse(
      `file:///!@${context.document.id}/${Math.random()}.cell.tsx`
    );
    const model = monaco.editor.createModel(
      props.node.textContent,
      "typescript",
      uri
    ); // TODO
    const codeModel = new MonacoTypeCellCodeModel(model);
    context.compiler.registerModel(codeModel); // TODO: cleanup

    return {
      model,
      codeModel,
      state: {
        isUpdating: false,
        node: props.node,
        lastDecorations: [] as string[],
      },
      dispose: () => {
        codeModel.dispose();
        model.dispose();
      },
    };
  }, []);

  // hacky way to dispose of the useMemo values above
  useEffect(() => {
    return () => {
      models.dispose();
    };
  }, []);

  useEffect(() => {
    models.state.isUpdating = true;
    models.state.node = props.node;
    try {
      applyNodeChangesToMonaco(props.node, models.model);
      models.state.lastDecorations = applyDecorationsToMonaco(
        models.model,
        props.decorations as any,
        editorRef.current!,
        models.state.lastDecorations
      );
    } finally {
      models.state.isUpdating = false;
    }
  }, [props.node, props.decorations]);

  // useImperativeHandle(
  //   ref,
  //   () => {
  //     return {
  //       setSelection(anchor: number, head: number) {
  //         console.log("SET");
  //       },
  //     };
  //   },
  //   []
  // );

  useEffect(() => {
    console.log("selected effect", props.selected);
    if (props.selected) {
      editorRef.current?.focus();
    }
  }, [props.selected]);

  useEffect(() => {
    // console.log("selectionHack effect", props.selectionHack);
    if (!props.selectionHack) {
      return;
    }
    let startPos = models.model.getPositionAt(props.selectionHack.anchor);
    let endPos = models.model.getPositionAt(props.selectionHack.head);
    models.state.isUpdating = true;
    editorRef.current?.setSelection(
      monaco.Selection.fromPositions(startPos, endPos)
    );
    models.state.isUpdating = false;
    editorRef.current?.focus();
  }, [props.selectionHack]);

  const codeRefCallback = useCallback((el: HTMLDivElement) => {
    let editor = editorRef.current;

    if (editor && editor?.getContainerDomNode() !== el) {
      editor.dispose();
      editorRef.current = undefined;
    }

    if (!el) {
      return;
    }

    console.log("create");
    let newEditor = monaco.editor.create(el, {
      model: models.model,
      theme: "typecellTheme",
    });

    // bindMonacoAndProsemirror(
    //   newEditor,
    //   props.editor.view,
    //   props.getPos,
    //   models.state
    // );

    // disable per-cell find command (https://github.com/microsoft/monaco-editor/issues/102)
    (newEditor as any)._standaloneKeybindingService.addDynamicKeybinding(
      "-actions.find",
      null, // keybinding
      () => {} // need to pass an empty handler
    );

    // if (initialFocus && initial.current) {
    //   initial.current = false;
    //   // newEditor.focus();
    // }

    newEditor.onDidBlurEditorWidget(() => {
      newEditor.trigger("blur", "editor.action.formatDocument", {});
    });

    newEditor.onDidContentSizeChange(() => {
      const contentHeight = Math.min(500, newEditor.getContentHeight());
      try {
        newEditor.layout({
          height: contentHeight,
          width: 100, //newEditor.getContainerDomNode()!.offsetWidth,
        });
      } finally {
      }
    });

    editorRef.current = newEditor;
  }, []);
  const [codeVisible, setCodeVisible] = useState(true);

  return (
    // <div
    //   contentEditable={false}
    //   className={`notebookCell ${
    //     codeVisible ? "expanded" : "collapsed"
    //   } ${"props.cell.language TODO"}`}
    //   style={{ display: "flex", flexDirection: "row" }}>
    //   {codeVisible ? (
    //     <VscChevronDown
    //       title="Show / hide code"
    //       className="notebookCell-sideIcon"
    //       onClick={() => setCodeVisible(false)}
    //     />
    //   ) : (
    //     <VscChevronRight
    //       title="Show / hide code"
    //       className="notebookCell-sideIcon"
    //       onClick={() => setCodeVisible(true)}
    //     />
    //   )}
    //   {}
    //   <div style={{ flex: 1 }} className="notebookCell-content">
    //     {codeVisible && (
    //       <div className="notebookCell-codeContainer">
    //         {/* {props.toolbar && props.toolbar} */}
    //         <div
    //           className="code"
    //           ref={codeRefCallback}
    //           style={{ height: "100%" }}></div>
    //       </div>
    //     )}

    <>
      <span contentEditable={false}>
        {context.executionHost.renderOutput(
          models.model.uri.toString(),
          () => {}
        )}
      </span>
      {/* {props.toolbar && props.toolbar} */}
      <div
        className="code"
        contentEditable={false}
        ref={codeRefCallback}
        style={{ height: "50px", width: "100px", position: "absolute" }}></div>
      {/* <div
        className="output"
        contentEditable={false}
        style={{ position: "relative" }}>
        {context.executionHost.renderOutput(
          models.model.uri.toString(),
          () => {}
        )}
      </div> */}
    </>
    // </div>
    // </div>
  );
};

// TODO: check why this doesn't work
export const MonacoElement = React.memo(MonacoElementComponent);
