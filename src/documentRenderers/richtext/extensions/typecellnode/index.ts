import { isTextSelection, Node } from "@tiptap/core";
import { Command, mergeAttributes, ReactNodeViewRenderer } from "@tiptap/react";
import { Plugin, TextSelection } from "prosemirror-state";
import { ResolvedPos } from "prosemirror-model";

export const inputRegex = /^\s*q\s$/gm;

declare module "@tiptap/core" {
  interface Commands {
    test: {
      /**
       * Toggle a paragraph
       */
      test: () => Command;
    };
  }
}

// type TypeCellNodePluginState = {
//   active: boolean;
//   startPos?: ResolvedPos<any>;
//   endPos?: ResolvedPos<any>;
// };

export const TypeCellNode = Node.create({
  // configuration …
  name: "typecell",
  group: "block",

  // NOTE: probably something wrong with this configuration?
  content: "text*",
  //    content: 'inline*', al
  defining: true,
  atom: true,

  // The node view is added in ../blocktypes/index.ts
  // addNodeView() {
  //   return ReactNodeViewRenderer(TypeCellComponent);
  // },

  addAttributes() {
    return {
      id: {
        default: undefined,
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "typecell",
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["typecell", mergeAttributes(HTMLAttributes)];
  },
  // addInputRules() {
  //     return [
  //       wrappingInputRule(inputRegex, this.type)
  //     ]
  //   },

  // addProseMirrorPlugins() {
  //   const nodeType = this.type;

  //   return [
  //     new Plugin({
  //       state: {
  //         init(): TypeCellNodePluginState {
  //           return {
  //             active: false,
  //             startPos: undefined,
  //             endPos: undefined,
  //           };
  //         },

  //         apply(tr, value, oldState, newState) {
  //           const { $from, $to } = newState.selection;

  //           // The next plugin state
  //           let next: TypeCellNodePluginState = {
  //             active: false,
  //             startPos: undefined,
  //             endPos: undefined,
  //           };

  //           console.log($from.pos, $to.pos);

  //           // Set state to active when the cursor is inside a typecell node
  //           if (
  //             $from.nodeAfter?.type === nodeType &&
  //             $to.nodeBefore?.type === nodeType
  //           ) {
  //             console.log("active!");
  //             next.active = true;
  //             next.startPos = $from;
  //             next.endPos = $to;
  //           }

  //           return next;
  //         },
  //       },
  //       props: {
  //         handleKeyDown(view, event) {
  //           const state = this.getState(view.state) as TypeCellNodePluginState;

  //           if (!state.active) return false;

  //           if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
  //             console.log(`Left/Up @ ${state.startPos!}`);
  //             view.dispatch(
  //               view.state.tr.setSelection(
  //                 new TextSelection(
  //                   view.state.doc.resolve(state.startPos!.pos - 1)
  //                 )
  //               )
  //             );
  //             return true;
  //           }

  //           if (event.key === "ArrowRight" || event.key === "ArrowDown") {
  //             console.log(`Right/Down @ ${state.startPos!}`);
  //             view.dispatch(
  //               view.state.tr.setSelection(
  //                 new TextSelection(
  //                   view.state.doc.resolve(state.endPos!.pos + 1)
  //                 )
  //               )
  //             );
  //             return true;
  //           }

  //           // Return true iff the plugin is in active state (i.e. the cursor is inside of a typecell node)
  //           return true;
  //         },
  //       },
  //     }),
  //   ];
  // },
});
