import { Editor, Extension, isNodeEmpty } from "@tiptap/core";
import { Node as ProsemirrorNode } from "prosemirror-model";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Plugin } from "prosemirror-state";
import { AiFillCodeSandboxCircle } from "react-icons/ai";

export interface PlaceholderOptions {
  emptyEditorClass: string;
  emptyNodeClass: string;
  placeholder:
    | ((PlaceholderProps: { editor: Editor; node: ProsemirrorNode }) => string)
    | string;
  showOnlyWhenEditable: boolean;
  showOnlyCurrent: boolean;
}

export const Placeholder = Extension.create<PlaceholderOptions>({
  name: "placeholder",

  defaultOptions: {
    emptyEditorClass: "is-editor-empty",
    emptyNodeClass: "is-empty",
    placeholder: "Write something …",
    showOnlyWhenEditable: true,
    showOnlyCurrent: true,
  },

  // debugging statements
  // doc.descendants((node, pos) => { console.log("node type is ", node.type.name) )});
  // console.log(doc.toString());

  // default placeholder implementation using ProseMirror decorations:
  // https://github.com/ueberdosis/tiptap/blob/main/packages/extension-placeholder/src/placeholder.ts

  /**
   * Exact copy of default implementation, in order to be able to change behavior.
   * Default behavior puts decorations on the outer div element.
   *
   * If this method remains untouched, the extension can be included
   * from the library instead of this file.
   */
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations: ({ doc, selection }) => {
            const active =
              this.editor.isEditable || !this.options.showOnlyWhenEditable;
            const { anchor } = selection;
            const decorations: Decoration[] = [];

            if (!active) {
              return;
            }

            doc.descendants((node, pos) => {
              const hasAnchor = anchor >= pos && anchor <= pos + node.nodeSize;
              const isEmpty = !node.isLeaf && !node.textContent;

              doc.descendants((node, pos) => {
                console.log("node type is ", node.type.name);
              });

              if ((hasAnchor || !this.options.showOnlyCurrent) && isEmpty) {
                const classes = [this.options.emptyNodeClass];

                if (this.editor.isEmpty) {
                  classes.push(this.options.emptyEditorClass);
                }

                const decoration = Decoration.node(pos, pos + node.nodeSize, {
                  class: classes.join(" "),
                  "data-placeholder":
                    typeof this.options.placeholder === "function"
                      ? this.options.placeholder({
                          editor: this.editor,
                          node,
                        })
                      : this.options.placeholder,
                });

                decorations.push(decoration);
              }

              return false;
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
