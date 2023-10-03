import { observer } from "mobx-react-lite";
import * as monaco from "monaco-editor";
import React, { useCallback, useEffect, useMemo, useRef } from "react";

import styles from "./MonacoEdit.module.css";

type Props = {
  documentid: string;
  value: string;
  onChange: (value: string) => void;
};

const MonacoEdit: React.FC<Props> = observer((props) => {
  console.log(props);
  const uri = useMemo(
    () => monaco.Uri.parse(`${props.documentid}.edit.${Math.random()}.tsx`),
    [props.documentid],
  );

  const model = useMemo(
    () => monaco.editor.createModel(props.value, "typescript", uri),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  const codeRefCallback = useCallback(
    (el: HTMLDivElement) => {
      const editor = editorRef.current;

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

      const newEditor = monaco.editor.create(el, {
        model: model,
        theme: "typecellTheme",
        renderLineHighlight: "none",
      });

      // disable per-cell find command (https://github.com/microsoft/monaco-editor/issues/102)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (newEditor as any)._standaloneKeybindingService.addDynamicKeybinding(
        "-actions.find",
        null, // keybinding
        () => {
          return;
        }, // need to pass an empty handler
      );

      newEditor.onDidBlurEditorWidget(() => {
        newEditor.trigger("blur", "editor.action.formatDocument", {});
      });

      newEditor.onDidContentSizeChange(() => {
        //   const height = Math.min(500, newEditor.getContentHeight());
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any
        const height = (newEditor.getDomNode()!.parentNode as any).offsetHeight;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any
        const width = (newEditor.getDomNode()!.parentNode as any).offsetWidth;

        newEditor.layout({
          height,
          width,
        });
      });

      editorRef.current = newEditor;
    },
    [model],
  );

  useEffect(() => {
    const dispose = model.onDidChangeContent(() => {
      const val = model.getValue();
      if (!val.startsWith("export default ")) {
        return;
      }
      // const worker = await monaco.languages.typescript.getTypeScriptWorker();

      // const ts = (await worker(uri))!;

      // const completions = await ts.getCompletionsAtPosition(uri.toString(), 0);

      // const diags = await ts.getSyntacticDiagnostics(uri.toString());
      // if (diags.length > 0) {
      //   return;
      // }
      // const diags2 = await ts.getSemanticDiagnostics(uri.toString());
      // if (diags2.length > 0) {
      //   return;
      // }

      props.onChange(val);
    });
    return () => {
      dispose.dispose();
    };
  }, [model, props, props.onChange]);

  useEffect(() => {
    if (
      editorRef.current &&
      editorRef.current.getValue().trim() !== props.value.trim()
    ) {
      editorRef.current.setValue(props.value);
    }
  }, [props.value]);

  return (
    <div className={styles.codeContainer}>
      <div className={styles.code} ref={codeRefCallback}></div>
    </div>
  );
});

export default MonacoEdit;
