import { Extension, Command } from "@tiptap/core";
import { UndoManager, XmlElement } from "yjs";
import {
  redo,
  undo,
  ySyncPlugin,
  yUndoPlugin,
  yUndoPluginKey,
} from "y-prosemirror";
import { BaseResource } from "../../../../store/BaseResource";
import { DocConnection } from "../../../../store/DocConnection";
import { autorun } from "mobx";

declare module "@tiptap/core" {
  interface Commands {
    collaboration: {
      /**
       * Undo recent changes
       */
      undo: () => Command;
      /**
       * Reapply reverted changes
       */
      redo: () => Command;
    };
  }
}

export interface CollaborationOptions {
  /**
   * An initialized Y.js document.
   */
  document: any;
  /**
   * Name of a Y.js fragment, can be changed to sync multiple fields with one Y.js document.
   */
  field: string;
  /**
   * A raw Y.js fragment, can be used instead of `document` and `field`.
   */
  fragment: any;
}

export const Collaboration = Extension.create<CollaborationOptions>({
  name: "collaboration",

  defaultOptions: {
    document: null,
    field: "default",
    fragment: null,
  },

  onCreate() {
    if (
      this.editor.extensionManager.extensions.find(
        (extension) => extension.name === "history"
      )
    ) {
      console.warn(
        '[tiptap warn]: "@tiptap/extension-collaboration" comes with its own history support and is not compatible with "@tiptap/extension-history".'
      );
    }
  },

  addCommands() {
    return {
      undo:
        () =>
        ({ tr, state, dispatch }) => {
          tr.setMeta("preventDispatch", true);

          const undoManager: UndoManager = yUndoPluginKey.getState(
            state as any
          ).undoManager;

          if (undoManager.undoStack.length === 0) {
            return false;
          }

          if (!dispatch) {
            return true;
          }

          return undo(state);
        },
      redo:
        () =>
        ({ tr, state, dispatch }) => {
          tr.setMeta("preventDispatch", true);

          const undoManager: UndoManager = yUndoPluginKey.getState(
            state as any
          ).undoManager;

          if (undoManager.redoStack.length === 0) {
            return false;
          }

          if (!dispatch) {
            return true;
          }

          return redo(state);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-z": () => this.editor.commands.undo(),
      "Mod-y": () => this.editor.commands.redo(),
      "Shift-Mod-z": () => this.editor.commands.redo(),
    };
  },

  addProseMirrorPlugins() {
    const fragment = this.options.fragment
      ? this.options.fragment
      : this.options.document.getXmlFragment(this.options.field);

    const resolveRef = (el: XmlElement, attrs: any) => {
      const docId = el.getAttribute("documentId") || attrs.documentId;
      if (!docId) {
        throw new Error("no documentId on ref");
      }
      const resource = DocConnection.load(docId);

      const getElement = () => {
        let doc = resource.doc;
        if (typeof doc !== "string" && doc.doc.type === "!richtext") {
          return doc.doc.data.firstChild;
        }
        return undefined;
      };
      const element = getElement();
      if (element) {
        return Promise.resolve(element);
      } else {
        // Maybe use when()?
        return new Promise((resolve) => {
          const disposeAutorun = autorun(() => {
            const element = getElement();
            if (element) {
              disposeAutorun();
              resolve(element);
            }
          });
        });
      }
    };
    return [ySyncPlugin(fragment, resolveRef), yUndoPlugin()];
  },
});
