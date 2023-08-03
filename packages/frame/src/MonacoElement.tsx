import { NodeViewProps } from "@tiptap/core";

import * as monaco from "monaco-editor";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { VscChevronDown, VscChevronRight } from "react-icons/vsc";

import { useResource } from "@typecell-org/util";
import styles from "./MonacoElement.module.css";
import {
  applyDecorationsToMonaco,
  applyNodeChangesToMonaco,
  bindMonacoAndProsemirror,
} from "./MonacoProsemirrorHelpers";
import { RichTextContext } from "./RichTextContext";
import { MonacoTypeCellCodeModel } from "./models/MonacoCodeModel";
import { getMonacoModel } from "./models/MonacoModelManager";

const MonacoElementComponent = function MonacoElement(
  props: NodeViewProps & { block: any; selectionHack: any }
) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  const refa = useRef<any>(Math.random());
  const context = useContext(RichTextContext);

  const models = useResource(() => {
    console.log("create", props.block.id, refa.current);
    const uri = monaco.Uri.parse(
      `file:///!${context.documentId}/${props.block.id}.cell.tsx`
    );
    console.log("allocate model", uri.toString());
    let model = getMonacoModel(
      props.node.textContent,
      "typescript",
      uri,
      monaco
    );

    const codeModel = new MonacoTypeCellCodeModel(model.object);
    context.compiler.registerModel(codeModel); // TODO: cleanup

    return [
      {
        model: model.object,
        codeModel,
        state: {
          isUpdating: false,
          node: props.node,
          lastDecorations: [] as string[],
        },
      },
      () => {
        console.log("dispose model", model.object.uri.toString());
        codeModel.dispose();
        model.dispose();
      },
    ];
  }, [context.compiler]);

  useEffect(() => {
    if (models.model.isDisposed()) {
      return;
    }
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
  }, [props.node, props.decorations, models]);

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

    console.log("create editor");
    let newEditor = monaco.editor.create(el, {
      model: models.model,
      theme: "typecellTheme",
    });

    bindMonacoAndProsemirror(
      newEditor,
      props.editor.view,
      props.getPos,
      models.state
    );

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
          width: newEditor.getContainerDomNode()!.offsetWidth,
        });
      } finally {
      }
    });

    editorRef.current = newEditor;
  }, []);
  const [codeVisible, setCodeVisible] = useState(true);

  return (
    <div
      contentEditable={false}
      className={[
        styles.codeCell,
        codeVisible ? styles.expanded : styles.collapsed,
      ].join(" ")}>
      {codeVisible ? (
        <VscChevronDown
          title="Show / hide code"
          className={styles.codeCellSideIcon}
          onClick={() => setCodeVisible(false)}
        />
      ) : (
        <VscChevronRight
          title="Show / hide code"
          className={styles.codeCellSideIcon}
          onClick={() => setCodeVisible(true)}
        />
      )}
      {}
      <div className={styles.codeCellContent}>
        {codeVisible && (
          <div className={styles.codeCellCode}>
            {/* {props.toolbar && props.toolbar} */}
            <div className={styles.monacoContainer} ref={codeRefCallback}></div>
          </div>
        )}

        <div className={styles.codeCellOutput} contentEditable={false}>
          {context.executionHost.renderOutput(
            models.model.uri.toString(),
            () => {}
          )}
        </div>
      </div>
    </div>
  );
};

// TODO: check why this doesn't work
export const MonacoElement = React.memo(MonacoElementComponent);
