/* eslint-disable @typescript-eslint/no-explicit-any */
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

import {
  autoUpdate,
  safePolygon,
  size,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
} from "@floating-ui/react";
import { useResource } from "@typecell-org/util";
import { RichTextContext } from "../RichTextContext";
import { MonacoTypeCellCodeModel } from "../models/MonacoCodeModel";
import { getMonacoModel } from "../models/MonacoModelManager";
import LanguageSelector from "./LanguageSelector";
import styles from "./MonacoElement.module.css";
import {
  applyDecorationsToMonaco,
  applyNodeChangesToMonaco,
  bindMonacoAndProsemirror,
  textFromPMNode,
} from "./MonacoProsemirrorHelpers";
import monacoStyles from "./MonacoSelection.module.css";

export type MonacoElementProps = NodeViewProps & {
  modelUri: monaco.Uri;
  language: string;
  setLanguage: (lang: string) => void;
  selectionHack: any;
  inline: boolean;
};

const MonacoElementComponent = function MonacoElement(
  props: MonacoElementProps,
) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  // const refa = useRef<any>(Math.random());
  const context = useContext(RichTextContext);

  const models = useResource(() => {
    // console.log("create", props.block.id, refa.current);
    // const uri = monaco.Uri.parse(
    //   `file:///!${context.documentId}/${props.block.id}.cell.tsx`,
    // );
    // console.log("allocate model", props.modelUri.toString());

    const model = getMonacoModel(
      textFromPMNode(props.node),
      props.language,
      props.modelUri,
      monaco,
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
    if (!editorRef.current) {
      console.warn("no editor");
      return;
    }
    models.state.isUpdating = true;
    models.state.node = props.node;
    try {
      if (props.language !== models.codeModel.language) {
        monaco.editor.setModelLanguage(models.model, props.language);
      }
      applyNodeChangesToMonaco(props.node, models.model);
      models.state.lastDecorations = applyDecorationsToMonaco(
        models.model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        props.decorations as any,
        editorRef.current!,
        models.state.lastDecorations,
        monacoStyles.yRemoteSelectionHead,
        monacoStyles.yRemoteSelection,
      );
    } finally {
      models.state.isUpdating = false;
    }
  }, [props.node, props.language, props.decorations, models]);

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
    // if (props.selected) {
    //   editorRef.current?.focus();
    // }
  }, [props.selected]);

  useEffect(() => {
    console.log("selectionHack effect", props.selectionHack);
    if (!props.selectionHack) {
      return;
    }
    const startPos = models.model.getPositionAt(props.selectionHack.anchor);
    const endPos = models.model.getPositionAt(props.selectionHack.head);
    models.state.isUpdating = true;
    editorRef.current?.setSelection(
      monaco.Selection.fromPositions(startPos, endPos),
    );
    models.state.isUpdating = false;
    editorRef.current?.focus();
  }, [models.model, models.state, props.selectionHack]);

  const codeRefCallback = useCallback(
    (el: HTMLDivElement, onLayoutChange?: (newHeight: number) => void) => {
      const editor = editorRef.current;

      if (editor) {
        if (editor?.getContainerDomNode() !== el) {
          // console.log("DISPOSE EDITOR");
          editor.dispose();
          editorRef.current = undefined;
        } else {
          // no need for new editor
          return undefined;
        }
      }

      if (!el) {
        return undefined;
      }

      console.log("create editor");
      const newEditor = monaco.editor.create(el, {
        model: models.model,
        theme: "typecellTheme",
        renderLineHighlight: props.inline ? "none" : "all",
      });

      bindMonacoAndProsemirror(
        newEditor,
        props.editor.view,
        props.getPos,
        models.state,
      );

      // disable per-cell find command (https://github.com/microsoft/monaco-editor/issues/102)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (newEditor as any)._standaloneKeybindingService.addDynamicKeybinding(
        "-actions.find",
        null, // keybinding
        () => {
          // need to pass an empty handler
        },
      );

      // if (initialFocus && initial.current) {
      //   initial.current = false;
      //   // newEditor.focus();
      // }

      newEditor.onDidBlurEditorWidget(() => {
        newEditor.trigger("blur", "editor.action.formatDocument", {});
      });

      newEditor.onDidContentSizeChange(() => {
        console.log("content size", newEditor.getContentHeight());
        const contentHeight = Math.min(500, newEditor.getContentHeight());

        newEditor.layout({
          height: contentHeight,
          width: props.inline
            ? newEditor.getContentWidth() + 50
            : newEditor.getContainerDomNode()!.offsetWidth,
        });

        onLayoutChange?.(contentHeight);
      });

      editorRef.current = newEditor;
      return newEditor;
    },
    [
      models.model,
      models.state,
      props.editor.view,
      props.getPos,
      props.inline,
      editorRef,
    ],
  );

  // useEffect(() => {
  //   console.log("mount main");
  //   return () => {
  //     console.log("unmount main");
  //   };
  // }, []);

  return props.inline ? (
    <MonacoInlineElement
      {...props}
      model={models.model}
      codeRefCallback={codeRefCallback}
    />
  ) : (
    <MonacoBlockElement
      {...props}
      model={models.model}
      codeRefCallback={codeRefCallback}
    />
  );
};

const MonacoBlockElement = (
  props: NodeViewProps & {
    inline: boolean;
    setLanguage: (lang: string) => void;
    language: string;
    model: monaco.editor.IModel;
    codeRefCallback?: (el: HTMLDivElement) => void;
  },
) => {
  const [codeVisible, setCodeVisible] = useState(
    () => props.node.textContent.startsWith("// @default-collapsed") === false,
  );

  const context = useContext(RichTextContext);

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
            <LanguageSelector
              language={props.language as any}
              onChangeLanguage={(lang) => {
                props.setLanguage(lang);
              }}
            />
            <div
              className={styles.monacoContainer}
              ref={props.codeRefCallback}></div>
          </div>
        )}

        <div className={styles.codeCellOutput} contentEditable={false}>
          {context.executionHost.renderOutput(
            props.model.uri.toString(),
            () => {
              // noop
            },
          )}
        </div>
      </div>
    </div>
  );
};

const MonacoInlineElement = (
  props: NodeViewProps & {
    inline: boolean;
    model: monaco.editor.IModel;
    selectionHack: any;
    codeRefCallback?: (
      el: HTMLDivElement,
      onLayoutChange: (newHeight: number) => void,
    ) => monaco.editor.IStandaloneCodeEditor | undefined;
  },
) => {
  const [codeVisible, setCodeVisible] = useState(false);
  const height = useRef(50);
  const [editorFocus, setEditorFocused] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: codeVisible,
    onOpenChange: setCodeVisible,
    placement: "top-start",
    whileElementsMounted: autoUpdate,
    middleware: [
      size({
        apply(args) {
          args.elements.floating.style.height = height.current + "px";
          // console.log("size");
          // debugger;
        },
      }),
    ],
  });

  const dismiss = useDismiss(context);
  const hover = useHover(context, {
    delay: {
      open: 0,
      close: 400,
    },
    enabled: !codeVisible || !editorFocus,
    handleClose: safePolygon(),
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    dismiss,
  ]);

  const codeRef = useCallback(
    (el: HTMLDivElement) => {
      console.log(codeVisible);
      const editor = props.codeRefCallback?.(el, (newHeight: number) => {
        height.current = newHeight;
        context.update();
      });
      if (editor) {
        editor.onDidBlurEditorWidget(() => {
          setCodeVisible(false);
          setEditorFocused(false);
        });
        editor.onDidFocusEditorWidget(() => {
          setEditorFocused(true);
        });
        setEditorFocused(editor.hasWidgetFocus());
      }
      refs.setFloating(el);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.codeRefCallback, refs.setFloating, codeVisible],
  );

  useEffect(() => {
    console.log("selectionHack effect", props.selectionHack);
    if (!props.selectionHack) {
      return;
    }

    setCodeVisible(true);
  }, [props.selectionHack]);

  // useEffect(() => {
  //   console.log("mount inline");
  //   return () => {
  //     console.log("unmount inline");
  //   };
  // }, []);

  const rtcontext = useContext(RichTextContext);
  // debugger;
  return (
    <>
      {codeVisible && (
        <div
          key="code"
          className={styles.monacoContainer}
          style={{
            zIndex: 1000,
            borderRadius: "4px",
            boxShadow: "rgb(235, 236, 240) 0px 0px 0px 1.2px",
            height: "50px",
            ...floatingStyles,
          }}
          {...getFloatingProps()}
          ref={codeRef}></div>
      )}

      <span
        className={styles.codeCellOutput + " " + styles.inline}
        contentEditable={false}
        ref={refs.setReference}
        {...getReferenceProps()}>
        {rtcontext.executionHost.renderOutput(
          props.model.uri.toString(),
          () => {
            // noop
          },
        )}
      </span>
    </>
  );
};

// TODO: check why this doesn't work
export const MonacoElement = React.memo(MonacoElementComponent);
