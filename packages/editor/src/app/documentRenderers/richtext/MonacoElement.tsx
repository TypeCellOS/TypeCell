import Tippy from "@tippyjs/react";
import { NodeViewProps } from "@tiptap/core";
import { untracked } from "mobx";
import * as monaco from "monaco-editor";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  VscChevronDown,
  VscChevronRight,
  VscSettingsGear,
} from "react-icons/vsc";
import { roundArrow } from "tippy.js";
import "tippy.js/dist/svg-arrow.css";
import { MonacoTypeCellCodeModel } from "../../../models/MonacoTypeCellCodeModel";
import LocalExecutionHost from "../../../runtime/executor/executionHosts/local/LocalExecutionHost";
import NotebookLanguageSelector from "../notebook/LanguageSelector";
import {
  applyDecorationsToMonaco,
  applyNodeChangesToMonaco,
  bindMonacoAndProsemirror,
} from "./MonacoProsemirrorHelpers";
import { RichTextContext } from "./RichTextContext";
const MonacoElementComponent = function MonacoElement(
  props: NodeViewProps & { block: any; selectionHack: any; inline: boolean }
) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  const tippyRef = useRef<any>();
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
      props.block?.props.language || "typescript", // TODO: string type
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
    if (!editorRef.current) {
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
  }, [props.node, props.decorations]);

  useEffect(() => {
    if (props.selected) {
      editorRef.current?.focus();
    }
  }, [props.selected]);

  useEffect(() => {
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

    if (tippyRef.current) {
      tippyRef.current.show();
    }

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

    let newEditor = monaco.editor.create(el, {
      model: models.model,
      theme: "typecellTheme",
      renderLineHighlight: props.inline ? "none" : "all",
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
      const height = Math.min(500, newEditor.getContentHeight());
      const width = props.inline
        ? newEditor.getContentWidth() + 50
        : newEditor.getContainerDomNode()!.offsetWidth;
      try {
        newEditor.layout({
          height,
          width,
        });
      } finally {
      }
    });

    newEditor.onDidBlurEditorText(() => {
      if (tippyRef.current) {
        tippyRef.current.hide();
      }
    });

    // setInterval(() => {
    //   const contentHeight = Math.min(500, newEditor.getContentHeight());
    //   newEditor.layout({
    //     height: contentHeight,
    //     width: props.inline
    //       ? 600
    //       : newEditor.getContainerDomNode()!.offsetWidth,
    //   });
    // }, 10000);
    editorRef.current = newEditor;
  }, []);

  const [codeVisible, setCodeVisible] = useState(
    untracked(() => !props.node.textContent.startsWith("// @default-collapsed"))
  );

  useEffect(() => {
    if (!codeVisible || !editorRef.current) {
      return;
    }
    const editor = editorRef.current;
    const height = Math.min(500, editor.getContentHeight());
    const width = props.inline
      ? editor.getContentWidth() + 50
      : editor.getContainerDomNode()!.offsetWidth;
    try {
      editor.layout({
        height,
        width,
      });
    } finally {
    }
  }, [codeVisible]);

  const [settingsVisible, setSettingsVisible] = useState(false);

  if (props.inline) {
    return (
      <>
        <Tippy
          interactive={true}
          interactiveBorder={20}
          arrow={roundArrow}
          maxWidth={600}
          placement="top-start"
          appendTo={document.body}
          onCreate={(tip) => (tippyRef.current = tip)}
          onHide={(p) => {
            if (editorRef.current?.hasTextFocus()) {
              return false;
            }
          }}
          onMount={(p) => {
            const contentWidth = editorRef.current!.getContentWidth() + 50;
            const contentHeight = editorRef.current!.getContentHeight();
            editorRef.current?.layout({
              height: contentHeight,
              width: contentWidth,
            });
            // p.popperInstance?.update();
          }}
          delay={[0, 200]}
          content={
            <div
              className="code"
              contentEditable={false}
              ref={codeRefCallback}
              style={{
                // width: "300px",
                // height: "20px",
                zIndex: 1000,
                borderRadius: "4px",
                boxShadow: "rgb(235, 236, 240) 0px 0px 0px 1.2px",
              }}></div>
          }>
          <span
            contentEditable={false}
            style={{
              display: "inline-block",
              verticalAlign: "top",
            }}
            // onMouseOver={() => setCodeVisible(true)}
            // onMouseOut={() => setCodeVisible(false)}
          >
            {context.executionHost.renderOutput(
              models.model.uri.toString(),
              () => {}
            )}
          </span>
        </Tippy>
        {/* {props.toolbar && props.toolbar} */}
        {/* {codeVisible && (
          
        )} */}
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
    );
  }

  return (
    <div
      contentEditable={false}
      className={`notebookCell ${
        codeVisible ? "expanded" : "collapsed"
      } ${"props.cell.language TODO"}`}
      style={{ display: "flex", flexDirection: "row" }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
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
        {props.block?.props.moduleName && (
          <VscSettingsGear
            size={12}
            style={{ marginTop: "10px" }}
            onClick={() => setSettingsVisible(!settingsVisible)}
          />
        )}
      </div>
      {}
      <div style={{ flex: 1 }} className="notebookCell-content">
        <div
          className="notebookCell-codeContainer"
          style={{ display: codeVisible ? "block" : "none" }}>
          <NotebookLanguageSelector
            language={props.block.props.language}
            onChangeLanguage={(language) => {
              // TODO: use blocknote api
              props.updateAttributes({
                language,
              });
            }}
            // onRemove={() => remove(i)}
          />

          <div
            className="code"
            ref={codeRefCallback}
            style={{ height: "100%" }}></div>
        </div>

        <div
          className="output"
          contentEditable={false}
          style={{ position: "relative" }}>
          {context.executionHost.renderOutput(
            models.model.uri.toString(),
            () => {}
          )}
        </div>
        {settingsVisible && (
          <div>
            {(context.executionHost as LocalExecutionHost).renderEditArea(
              models.model.uri.toString(),
              models.codeModel.getValue(),
              (code) => {
                models.model.setValue(code);
              },
              props.node.attrs.key,
              props.node.attrs.bindings,
              (bindings: string) => {
                // models.state.isUpdating = true;
                props.updateAttributes({
                  bindings,
                });
                // models.state.isUpdating = false;
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// TODO: check why this doesn't work
export const MonacoElement = React.memo(MonacoElementComponent);
