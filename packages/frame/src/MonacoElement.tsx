/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
import monacoStyles from "./MonacoSelection.module.css";
import { RichTextContext } from "./RichTextContext";
import { MonacoTypeCellCodeModel } from "./models/MonacoCodeModel";
import { getMonacoModel } from "./models/MonacoModelManager";

const MonacoElementComponent = function MonacoElement(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: NodeViewProps & { block: any; selectionHack: any }
) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  // const refa = useRef<any>(Math.random());
  const context = useContext(RichTextContext);

  const models = useResource(() => {
    // console.log("create", props.block.id, refa.current);
    const uri = monaco.Uri.parse(
      `file:///!${context.documentId}/${props.block.id}.cell.tsx`
    );
    console.log("allocate model", uri.toString());
    const model = getMonacoModel(
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        props.decorations as any,
        editorRef.current!,
        models.state.lastDecorations,
        monacoStyles.yRemoteSelectionHead,
        monacoStyles.yRemoteSelection
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
    const startPos = models.model.getPositionAt(props.selectionHack.anchor);
    const endPos = models.model.getPositionAt(props.selectionHack.head);
    models.state.isUpdating = true;
    editorRef.current?.setSelection(
      monaco.Selection.fromPositions(startPos, endPos)
    );
    models.state.isUpdating = false;
    editorRef.current?.focus();
  }, [models.model, models.state, props.selectionHack]);

  const codeRefCallback = useCallback(
    (el: HTMLDivElement) => {
      const editor = editorRef.current;

      if (editor) {
        if (editor?.getContainerDomNode() !== el) {
          // console.log("DISPOSE EDITOR");
          editor.dispose();
          editorRef.current = undefined;
        } else {
          // no need for new editor
          return;
        }
      }

      if (!el) {
        return;
      }

      console.log("create editor");
      const newEditor = monaco.editor.create(el, {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (newEditor as any)._standaloneKeybindingService.addDynamicKeybinding(
        "-actions.find",
        null, // keybinding
        () => {
          // need to pass an empty handler
        }
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

        newEditor.layout({
          height: contentHeight,
          width: newEditor.getContainerDomNode()!.offsetWidth,
        });
      });

      editorRef.current = newEditor;
    },
    [models.model, models.state, props.editor.view, props.getPos]
  );

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
            () => {
              // noop
            }
          )}
        </div>
      </div>
    </div>
  );
};

// TODO: check why this doesn't work
export const MonacoElement = React.memo(MonacoElementComponent);
