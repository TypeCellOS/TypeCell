import { Command } from "@tiptap/core";
import { Extension, getNodeType } from "@tiptap/react";
import { Fragment, NodeType, Slice } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { ReplaceAroundStep, ReplaceStep } from "prosemirror-transform";

export interface NestedBlocksOptions {}

declare module "@tiptap/core" {
  interface Commands {
    nestedblocks: {
      sinkBlock: (typeOrName: any) => Command;
    };
  }
}

export const sinkItem =
  (typeOrName: any) =>
  ({ state, dispatch }: any) => {
    const type = getNodeType(typeOrName, state.schema);

    return originalSinkListItem(
      type,
      getNodeType("parentblock", state.schema),
      getNodeType("childrenblock", state.schema)
    )(state, dispatch);
  };

{
  /* <div> // parent
  <p>hello</p> // 1
  <div> // children

  </div>
</div> */
}
// :: (NodeType) → (state: EditorState, dispatch: ?(tr: Transaction)) → bool
// Create a command to sink the list item around the selection down
// into an inner list.
export function originalSinkListItem(
  itemType: NodeType<any>,
  parentContainerType: NodeType<any>,
  childContainerType: NodeType<any>
) {
  return function (state: EditorState, dispatch: any) {
    let { $from, $to } = state.selection;
    let range = $from.blockRange(
      $to,
      // (node) => !!(node.childCount && node.firstChild!.type === itemType)
      (node) => {
        let found = false;
        node.forEach((c) => {
          if (c.type === itemType) {
            found = true;
          }
        });
        return found;
      }
    );
    if (!range) return false;
    let startIndex = range.startIndex;
    if (startIndex == 0) return false; // first element of document, or first element in already nested item
    let parent = range.parent,
      nodeBefore = parent.child(startIndex - 1);
    // if (nodeBefore.type != itemType) return false;

    // if (nodeBefore.type === parentContainerType) {
    // we are below an already indented section. Add to this section
    // } else {
    let nestedBefore = nodeBefore.type === parentContainerType; //nodeBefore.lastChild && nodeBefore.lastChild.type == parent.type;

    if (nestedBefore) {
      let fragment = Fragment.from(
        parentContainerType.create(null, childContainerType.create(null))
      );
      // debugger;
      // fragment = fragment.cut(fragment.size - 3);
      let slice = new Slice(fragment, 2, 0);

      dispatch(
        state.tr
          .step(
            new ReplaceAroundStep(
              range.start - 2,
              range.end,
              range.start,
              range.end,
              slice,
              0,
              true
            )
          )
          .scrollIntoView()
      );
    } else {
      const fragment = Fragment.from(
        parentContainerType.create(null, [
          nodeBefore,
          childContainerType.create(null, range.parent.child(startIndex)),
        ])
      );
      const slice = new Slice(fragment, 0, 0);
      // Fragment.from(state.doc.content).cut(range.start, range.end);
      // const testSlice = new Slice(state.doc.content, range.start, range.end);
      dispatch(
        state.tr
          .step(
            new ReplaceStep(
              range.start - nodeBefore.nodeSize,
              range.end,
              slice,
              false
            )
          )
          .scrollIntoView()
      );
    }
    // let inner = Fragment.from(nestedBefore ? itemType.create() : undefined);
    // let slice = new Slice(
    //   Fragment.from(
    //     itemType.create(
    //       null,
    //       Fragment.from(childContainerType.create(null, inner))
    //     )
    //   ),
    //   nestedBefore ? 3 : 1,
    //   0
    // );
    // let before = range.start,
    //   after = range.end;
    // dispatch(
    //   state.tr
    //     .step(
    //       new ReplaceAroundStep(
    //         before - (nestedBefore ? 3 : 1),
    //         after,
    //         before,
    //         after,
    //         slice,
    //         1,
    //         true
    //       )
    //     )
    //     .scrollIntoView()
    // );
    // }
    return true;
  };
}

export const NestedBlocks = Extension.create<NestedBlocksOptions>({
  name: "nestedBlocks",

  defaultOptions: {},

  addCommands() {
    return {
      sinkBlock:
        (typeOrName: any) =>
        ({ state, dispatch }) => {
          return sinkItem(typeOrName)({ state, dispatch });
        },
    };
  },

  // addKeyboardShortcuts() {
  //   return {
  //     "Mod-u": () => this.editor.commands.toggleUnderline(),
  //   };
  // },
});
