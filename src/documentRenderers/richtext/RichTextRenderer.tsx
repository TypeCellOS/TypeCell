import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Placeholder from "@tiptap/extension-placeholder";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo, useRef } from "react";

import { DocumentResource } from "../../store/DocumentResource";
import TypeCellNode from "./extensions/typecellnode";
import SlashCommandExtension from "./extensions/slashcommand";

import "./RichTextRenderer.css";
import { editor } from "monaco-editor";
import EngineWithOutput from "../../typecellEngine/EngineWithOutput";
import { EngineContext } from "./extensions/typecellnode/EngineContext";

type Props = {
  document: DocumentResource;
};
const RichText: React.FC<Props> = observer((props) => {
  const disposer = useRef<() => void>();

  const engine = useMemo(() => {
    if (disposer.current) {
      disposer.current();
      disposer.current = undefined;
    }
    const newEngine = new EngineWithOutput(props.document.id, true);
    disposer.current = () => {
      newEngine.dispose();
    };

    return newEngine;
  }, [props.document.id]);

  useEffect(() => {
    return () => {
      if (disposer.current) {
        disposer.current();
        disposer.current = undefined;
      }
    };
  }, []);

  const editor = useEditor({
    onUpdate: ({ editor }) => {
      console.log(editor.getJSON());
    },
    extensions: [
      StarterKit,

      CollaborationCursor.configure({
        provider: props.document.webrtcProvider,
        user: { name: "Hello", color: "#f783ac" },
      }),
      Collaboration.configure({
        fragment: props.document.data,
      }),

      Placeholder.configure({
        placeholder: "Use '/' to insert a new block.",
        showOnlyCurrent: true,
      }),

      TypeCellNode,
      SlashCommandExtension.configure({
        commands: {},
      }),
    ],
    // content: "This text is in a TipTap editor, feel free to change it. Live collaboration is also enabled.",
  });

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <EngineContext.Provider value={{ engine, document: props.document }}>
        <EditorContent editor={editor} />
      </EngineContext.Provider>
    </div>
  );
});

export default RichText;
