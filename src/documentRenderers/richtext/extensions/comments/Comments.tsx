import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import styles from "./Comments.module.css";

// This plugin adds styling to blocks whenever the selection spans more than one block to indicate they're selected.
export const Comments = Extension.create({
  name: "comments",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("Comments"),

        props: {
          decorations(state) {
            // Creates an empty set of decorations.
            let set = DecorationSet.create(state.doc, []);

            const parent = state.doc.resolve(state.selection.head).node();
            parent.descendants(function (node) {
              if (node.marks.length > 0) {
                for (let mark of node.marks) {
                  if (mark.attrs["id"]) {
                    // Gets comments from browser cache.
                    const stringMap: string = localStorage.getItem("comments")!;

                    // Deserializes comments into a map.
                    const comments: Map<string, string> = new Map(
                      JSON.parse(stringMap)
                    );

                    // Creates a DOM element with comment.
                    const dom = document.createElement("div");
                    dom.innerHTML = comments.get(mark.attrs["id"].toString())!;
                    dom.className = styles.comment;
                    set = set.add(state.doc, [
                      Decoration.widget(state.selection.head, dom),
                    ]);
                  }
                }
              }
            });

            return set;
          },
        },
      }),
    ];
  },
});
