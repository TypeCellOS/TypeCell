import { observer } from "mobx-react-lite";
import * as monaco from "monaco-editor";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
type Props = {
  documentid: string;
  code: string;
  onChange: (code: string) => void;
};

const MonacoEdit: React.FC<Props> = observer((props) => {
  const uri = useMemo(
    () => monaco.Uri.parse(`${props.documentid}.edit.${Math.random()}.tsx`),
    []
  );

  const model = useMemo(
    () =>
      monaco.editor.createModel(
        "export default " + props.code,
        "typescript",
        uri
      ),
    []
  );

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  const codeRefCallback = useCallback((el: HTMLDivElement) => {
    let editor = editorRef.current;

    if (editor && editor?.getContainerDomNode() !== el) {
      editor.dispose();
      editorRef.current = undefined;
    }

    if (!el) {
      return;
    }
    // const uri = monaco.Uri.parse(
    //   `${props.documentid}.edit.${Math.random()}.tsx`
    // );

    let newEditor = monaco.editor.create(el, {
      model: model,
      theme: "typecellTheme",
      renderLineHighlight: "none",
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
      const height = Math.min(500, newEditor.getContentHeight());
      const width = (newEditor.getDomNode()!.parentNode! as any).offsetWidth;
      try {
        newEditor.layout({
          height,
          width,
        });
      } finally {
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

  useEffect(() => {
    const dispose = model.onDidChangeContent(async () => {
      const val = model.getValue();
      if (!val.startsWith("export default ")) {
        return;
      }
      const worker = await monaco.languages.typescript.getTypeScriptWorker();

      let ts = (await worker(uri))!;

      const completions = await ts.getCompletionsAtPosition(uri.toString(), 0);

      const diags = await ts.getSyntacticDiagnostics(uri.toString());
      if (diags.length > 0) {
        return;
      }
      const diags2 = await ts.getSemanticDiagnostics(uri.toString());
      if (diags2.length > 0) {
        return;
      }

      props.onChange(val.replace("export default ", ""));
    });
    return () => {
      dispose.dispose();
    };
  }, [props.onChange]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setValue("export default " + props.code);
    }
  }, [props.code]);

  return (
    <div className="notebookCell-codeContainer">
      <div
        className="code"
        ref={codeRefCallback}
        style={{ height: "100%" }}></div>
    </div>
  );
});

const btnStyle = {
  border: 0,
  position: "relative" as "relative",
  bottom: -10,
  left: -10,
  background: "none",
};

const btnStyleActive = {
  ...btnStyle,
  textDecoration: "underline" as "underline",
};

export default MonacoEdit;
