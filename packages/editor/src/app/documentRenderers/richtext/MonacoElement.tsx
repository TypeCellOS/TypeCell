import { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import * as monaco from "monaco-editor";
import { useCallback, useEffect, useRef } from "react";

export function MonacoElement(props: NodeViewProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();

  useEffect(() => {
    if (props.selected) {
      editorRef.current?.focus();
    }
  }, [props.selected]);

  const codeRefCallback = useCallback((el: HTMLDivElement) => {
    let editor = editorRef.current;

    if (editor && editor?.getContainerDomNode() !== el) {
      editor.dispose();
      editorRef.current = undefined;
    }

    if (!el) {
      return;
    }

    console.log("crate");
    let newEditor = monaco.editor.create(el, {
      value: "hello",
      language: "javascript",
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

  return (
    <NodeViewWrapper>
      <div contentEditable={false} ref={codeRefCallback}>
        Monaco
      </div>
    </NodeViewWrapper>
  );
}

/*
// @ts-ignore
    return ({
      editor,
      node,
      getPos,
      HTMLAttributes,
      decorations,
      extension,
    }: any) => {
      console.log("new monaco", decorations);
      theNode = node;
      const dom = document.createElement("div");
      dom.style.height = "500px";
      const mon = monaco.editor.create(dom, {
        value: node.textContent,
        language: "javascript",
      });
      // mon.layout({
      //   width: mon.getContainerDomNode()!.offsetWidth,
      //   height: 500,
      // });
      // dom.innerHTML = "Hello, I’m a node view!";

      mon.onDidChangeCursorSelection((e) => {
        console.log("change selection");

        if (typeof getPos === "boolean") {
          throw new Error("getPos is boolean");
        }

        if (updating) {
          return;
        }

        let offset = getPos() + 1;

        let tr = editor.view.state.tr;
        getTransactionForSelectionUpdate(
          mon.getSelection(),
          mon.getModel(),
          offset,
          tr as any
        );
        try {
          editor.view.dispatch(tr);
        } catch (e) {
          console.error(e);
        }
      });

      // mon.onDidChangeCursorPosition((e) => {
      //   console.log("change position");
      // });

      mon.onDidChangeModelContent((e) => {
        if (typeof getPos === "boolean") {
          throw new Error("getPos is boolean");
        }

        if (updating) {
          return;
        }
        let offset = getPos() + 1;
        // { main } = update.state.selection;

        let tr = editor.view.state.tr;

        e.changes.forEach((change) => {
          if (change.text.length) {
            tr.replaceWith(
              offset + change.rangeOffset,
              offset + change.rangeOffset + change.rangeLength,
              editor.view.state.schema.text(change.text.toString())
            );
          } else {
            tr.delete(
              offset + change.rangeOffset,
              offset + change.rangeOffset + change.rangeLength
            );
          }
          // TODO: update offset?
        });
        getTransactionForSelectionUpdate(
          mon.getSelection(),
          mon.getModel(),
          offset,
          tr as any
        );
        try {
          editor.view.dispatch(tr);

          setTimeout(() => mon.focus(), 1000);
          console.log(mon);
        } catch (e) {
          console.error(e);
        }
      });

      mon.onKeyDown((e) => {
        if (typeof getPos === "boolean") {
          throw new Error("getPos is boolean");
        }
        // const { node, view, getPos } = propsRef.current;
        // 删除
        // if (e.code === "Delete" || e.code === "Backspace") {
        //   if (node.textContent === "") {
        //     view.dispatch(
        //       view.state.tr.deleteRange(getPos(), getPos() + node.nodeSize)
        //     );
        //     view.focus();
        //     return;
        //   }
        // }
        // // 移动光标
        const { lineNumber = 1, column = 1 } = mon.getPosition() || {};
        const model = mon.getModel();
        const maxLines = model?.getLineCount() || 1;
        let dir: -1 | 1 | null = null;
        if (e.code === "ArrowLeft") {
          if (lineNumber !== 1 || column !== 1) {
            return;
          }
          dir = -1;
        } else if (e.code === "ArrowRight") {
          if (
            lineNumber !== maxLines ||
            column - 1 !== model?.getLineLength(maxLines)
          ) {
            return;
          }
          dir = 1;
        } else if (e.code === "ArrowUp") {
          if (lineNumber !== 1) {
            return;
          }
          dir = -1;
        } else if (e.code === "ArrowDown") {
          if (lineNumber !== maxLines) {
            return;
          }
          dir = 1;
        }
        if (dir !== null) {
          console.log("dir", dir, theNode.nodeSize);
          selectionDir(editor.view as any, getPos(), theNode.nodeSize, dir);
          return;
        }
      });
      let lastDecorations: string[] = [];
      return {
        dom,

        update(
          node: any,
          decorations: any,
          innerDecorations: DecorationSource
        ) {
          console.log("update incoming", decorations, innerDecorations);
          if (node.type !== theNode.type) {
            return false;
          }
          theNode = node;
          const modal = mon.getModel();
          if (!modal) {
            console.error("no modal");
            return;
          }

          let newText = node.textContent;
          let curText = modal.getValue();
          if (newText !== curText) {
            let start = 0,
              curEnd = curText.length,
              newEnd = newText.length;
            while (
              start < curEnd &&
              curText.charCodeAt(start) === newText.charCodeAt(start)
            ) {
              ++start;
            }
            while (
              curEnd > start &&
              newEnd > start &&
              curText.charCodeAt(curEnd - 1) == newText.charCodeAt(newEnd - 1)
            ) {
              curEnd--;
              newEnd--;
            }

            updating = true;
            modal.applyEdits([
              {
                range: monaco.Range.fromPositions(
                  modal.getPositionAt(start),
                  modal.getPositionAt(curEnd)
                ),
                text: newText.slice(start, newEnd),
              },
            ]);
          }

          const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];
          const decs = (innerDecorations as any).local as Decoration[];

          decs
            .filter((d) => d.spec.type === "cursor")
            .forEach((cursorDec) => {
              const selectionDec = decs.find(
                (d) =>
                  d.spec.type === "selection" &&
                  d.spec.clientID === cursorDec.spec.clientID
              );

              let start: monaco.Position;
              let end: monaco.Position;
              let afterContentClassName: string | undefined;
              let beforeContentClassName: string | undefined;

              const to = cursorDec.to;
              const from = selectionDec
                ? selectionDec.from === to
                  ? selectionDec.to
                  : selectionDec.from
                : to;

              if (from < to) {
                start = modal.getPositionAt(from);
                end = modal.getPositionAt(to);
                afterContentClassName =
                  "yRemoteSelectionHead yRemoteSelectionHead-" +
                  cursorDec.spec.clientID;
              } else {
                start = modal.getPositionAt(to);
                end = modal.getPositionAt(from);
                beforeContentClassName =
                  "yRemoteSelectionHead yRemoteSelectionHead-" +
                  cursorDec.spec.clientID;
              }
              newDecorations.push({
                range: new monaco.Range(
                  start.lineNumber,
                  start.column,
                  end.lineNumber,
                  end.column
                ),
                options: {
                  className:
                    "yRemoteSelection yRemoteSelection-" +
                    cursorDec.spec.clientID,
                  afterContentClassName,
                  beforeContentClassName,
                },
              });
            });

          lastDecorations = mon.deltaDecorations(
            lastDecorations,
            newDecorations
          );
          // const collection = mon.createDecorationsCollection(newDecorations);
          // TODO: update / clear decorations?
          // console.log(collection);
          // mon.deltaDecorations
          updating = false;

          return true;
        },
        deselectNode() {
          console.error("deselectNode not implemented");
        },
        selectNode() {
          console.log("selectNode");
          mon.focus();
        },
        stopEvent() {
          return true;
        },
        setSelection(anchor: number, head: number, root: any) {
          console.log("setSelection", anchor, head, root);
          const model = mon.getModel();
          if (!model) {
            return;
          }

          mon.focus();

          let startPos = model.getPositionAt(anchor);
          let endPos = model.getPositionAt(head);
          updating = true;
          mon.setSelection(monaco.Selection.fromPositions(startPos, endPos));
          updating = false;
        },
      };
    };*/
