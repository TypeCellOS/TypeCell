import { untracked } from "mobx";
import { observer } from "mobx-react-lite";
// import useCellModel from "./useCellModel.ts.bak";
import type * as Monaco from "monaco-editor";
import * as monaco from "monaco-editor";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    VscChevronDown,
    VscChevronRight,

    VscFile,
    VscFileCode,

    VscTrash
} from "react-icons/vsc";
import { MonacoBinding } from "y-monaco";

import { CellModel } from "../../models/CellModel";
import { getModel, releaseModel } from "../../models/modelCache";
import EngineWithOutput from "../../typecellEngine/EngineWithOutput";
import Output from "./Output";
import { Awareness } from "y-protocols/awareness";

// const MonacoMarkdown = require("monaco-markdown");
let idd = 0;
type Props = {
    cell: CellModel;
    engine: EngineWithOutput,
    onRemove?: () => void;
    classList?: string;
    defaultCollapsed?: boolean;
    initialFocus?: boolean;
    awareness: Awareness
};

const NotebookCell: React.FC<Props> = observer((props) => {
    const initial = useRef(true);
    const [model, setModel] = useState<monaco.editor.ITextModel>();
    const [editor, setEditor] = useState<Monaco.editor.IStandaloneCodeEditor>();
    const disposeHandlers = useRef<Array<() => void>>();
    // const [codeRef, setCodeRef] = useState<HTMLDivElement>();

    const [codeVisible, setCodeVisible] = useState(
        untracked(() => !(props.defaultCollapsed === true || props.cell.language === "markdown"))
    );

    const codeRefCallback = useCallback((el: HTMLDivElement) => {
        let disposed = false;
        if (editor && editor?.getContainerDomNode() !== el) {
            disposeHandlers.current?.forEach(dispose => dispose());
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
            });

            if (props.initialFocus && initial.current) {
                initial.current = false;
                // newEditor.focus();
            }

            newEditor.onDidBlurEditorWidget(() => {
                newEditor.trigger("blur", "editor.action.formatDocument", {});
            });
            setEditor(newEditor);
        }
    }, [editor]);

    useEffect(() => {
        if (!editor) {
            return;
        }
        const newModel = getModel(props.cell, editor);
        props.engine.engine.registerModel(newModel);

        editor.setModel(newModel);
        setModel(newModel);

        const sizeDisposer = editor.onDidContentSizeChange(() => {
            if (!editor) {
                return;
            }
            const contentHeight = Math.min(500, editor.getContentHeight());
            try {
                editor.layout({ height: contentHeight, width: editor.getDomNode()!.offsetWidth });
            } finally {
            }
        });

        return () => {
            sizeDisposer.dispose();
            releaseModel(props.cell, editor);
            setModel(undefined);
        };
    }, [editor, props.cell, props.cell.code, props.engine, props.awareness]);


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


    return (
        <div
            className={`notebookCell ${codeVisible ? "expanded" : "collapsed"} ${props.cell.language} ${props.classList || ""
                }`}
            style={{ display: "flex", flexDirection: "row" }}
        >
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
            <div style={{ flex: 1 }} className="notebookCell-content">
                {codeVisible && (
                    <div className="notebookCell-codeContainer">
                        <div className="code-toolbar">
                            <button title="TypeScript" className={props.cell.language === "typescript" ? "active" : ""}>
                                <VscFileCode onClick={() => props.cell.language = ("typescript")} />
                            </button>
                            {/* <button title="TypeScript (node)" className={props.cell.language === "node-typescript" ? "active" : ""}>
                <VscServerProcess onClick={() => props.cell.setLanguage("node-typescript")} />
              </button> */}
                            <button title="Markdown" className={props.cell.language === "markdown" ? "active" : ""}>
                                <VscFile onClick={() => props.cell.language = ("markdown")} />
                            </button>
                            {props.onRemove && (
                                <button title="Delete" onClick={props.onRemove}>
                                    <VscTrash />
                                </button>
                            )}
                            {/* <button title="More">
                <VscEllipsis />
              </button> */}
                        </div>
                        {/* <div>{Math.random()}</div> */}
                        <div className="code" ref={codeRefCallback} style={{ height: "100%" }}></div>
                    </div>
                )}
                <div className="output">
                    {/* <CellContext.Provider value={{ cell: props.cell }}> */}
                    {/* <div>hello</div> */}
                    {model && <Output outputs={props.engine.outputs} model={model} />}
                    {/* TODO: {props.cell.viewPluginsAvailable} */}
                    {/* </CellContext.Provider> */}
                </div>
            </div>
        </div>
    );
});

export default NotebookCell;
