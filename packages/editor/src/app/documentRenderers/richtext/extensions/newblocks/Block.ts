import { mergeAttributes, Node } from "@tiptap/core";
import { Selection } from "prosemirror-state";
import styles from "./Block.module.css";
import { PreviousBlockTypePlugin } from "./PreviousBlockTypePlugin";
import { textblockTypeInputRuleSameNodeType } from "./rule";

export interface IBlock {
  HTMLAttributes: Record<string, any>;
}

export type Level = 1 | 2 | 3;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blockHeading: {
      /**
       * Set a heading node
       */
      setBlockHeading: (attributes: { headingType: Level }) => ReturnType;
      /**
       * Toggle a heading node
       */
      toggleBlockHeading: (attributes: { level: Level }) => ReturnType;
    };
  }
}

export const ContentBlock = Node.create<IBlock>({
  name: "tccontent",

  defaultOptions: {
    HTMLAttributes: {},
  },

  content: "inline*",

  parseHTML() {
    return [
      {
        tag: "div",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },
});

export const BlockGroup = Node.create({
  name: "blockGroup",

  defaultOptions: {
    HTMLAttributes: {},
  },

  // group: "block list",

  // Take indentItem as children instead of listItem
  content: "tcblock+",

  parseHTML() {
    return [{ tag: "div" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: styles.blockGroup,
      }),
      0,
    ];
  },
});

export const Block = Node.create<IBlock>({
  name: "tcblock",
  group: "block",
  defaultOptions: {
    HTMLAttributes: {},
  },

  content: "tccontent blockGroup?",

  defining: true,

  addAttributes() {
    return {
      listType: {
        default: undefined,
        renderHTML: (attributes) => {
          return {
            "data-listType": attributes.listType,
          };
        },
        parseHTML: (element) => element.getAttribute("data-listType"),
      },
      blockColor: {
        default: undefined,
        renderHTML: (attributes) => {
          return {
            "data-blockColor": attributes.blockColor,
          };
        },
        parseHTML: (element) => element.getAttribute("data-blockColor"),
      },
      blockStyle: {
        default: undefined,
        renderHTML: (attributes) => {
          return {
            "data-blockStyle": attributes.blockStyle,
          };
        },
        parseHTML: (element) => element.getAttribute("data-blockStyle"),
      },
      headingType: {
        default: undefined,
        keepOnSplit: false,
        renderHTML: (attributes) => {
          return {
            "data-headingType": attributes.headingType,
          };
        },
        parseHTML: (element) => element.getAttribute("data-headingType"),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: styles.blockOuter,
      }),
      [
        "div",
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          class: styles.block,
        }),
        0,
      ],
    ];
  },

  addInputRules() {
    return [
      ...[1, 2, 3].map((level) => {
        return textblockTypeInputRuleSameNodeType({
          find: new RegExp(`^(#{1,${level}})\\s$`),
          type: this.type,
          getAttributes: {
            headingType: level,
          },
        });
      }),
      textblockTypeInputRuleSameNodeType({
        find: /^\s*([-+*])\s$/,
        type: this.type,
        getAttributes: {
          listType: "li",
        },
      }),
    ];
  },

  addCommands() {
    return {
      setBlockHeading:
        (attributes) =>
        ({ commands }) => {
          // TODO
          return false;
          // return commands.setNode(this.name, attributes);
        },
      toggleBlockHeading:
        (attributes) =>
        ({ commands }) => {
          // TODO
          return commands.updateAttributes(this.name, {
            headingType: attributes.level,
          });
        },
    };
  },
  addProseMirrorPlugins() {
    return [PreviousBlockTypePlugin()];
  },
  addKeyboardShortcuts() {
    const handleBackspace = () =>
      this.editor.commands.first(({ commands }) => [
        () => commands.undoInputRule(),
        // maybe convert first text block node to default node
        () =>
          commands.command(({ tr }) => {
            const { selection, doc } = tr;
            const { empty, $anchor } = selection;
            const { pos, parent } = $anchor;
            const isAtStart = Selection.atStart(doc).from === pos;

            if (
              !empty ||
              !isAtStart ||
              !parent.type.isTextblock ||
              parent.textContent.length
            ) {
              return false;
            }

            return commands.clearNodes();
          }),
        () => commands.deleteSelection(),
        // () =>
        //   commands.command(({ tr }) => {
        //     const isAtStartOfNode = tr.selection.$anchor.parentOffset === 0;
        //     if (isAtStartOfNode) {
        //       // if ()
        //       return commands.first([
        //         // () =>
        //         // commands.updateAttributes("tcblock", { listType: undefined }),
        //         () => commands.liftListItem("tcblock"),
        //       ]);
        //     }
        //     // console.log(tr.selection);
        //     return false;
        //   }),
        // () => {
        //   commands.command(({}))
        // },
        // () => {
        //   const first = commands.joinBackward();
        //   return first;
        // },
        ({ chain }) =>
          chain()
            .command(({ tr, state }) => {
              const isAtStartOfNode = tr.selection.$anchor.parentOffset === 0;
              if (isAtStartOfNode) {
                const anchor = tr.selection.$anchor;
                const node = anchor.node(-1);
                if (node.type.name === "tcblock") {
                  if (node.childCount === 2) {
                    // const nestedBlockRange = {
                    //   start: anchor.posAtIndex(1, -1) + 1,
                    //   end: anchor.posAtIndex(2, -1),
                    // };

                    const startSecondChild = anchor.posAtIndex(1, -1) + 1; // start of blockgroup
                    state.doc
                      .resolve(startSecondChild)
                      .blockRange(
                        state.doc.resolve(37),
                        (node) => node.type.name === "blockGroup"
                      );
                    const endSecondChild = anchor.posAtIndex(2, -1) - 1;
                    const range = state.doc
                      .resolve(startSecondChild)
                      .blockRange(state.doc.resolve(endSecondChild));
                    // const range2 = state.doc
                    //   .resolve(anchor.posAtIndex(1, -1) + 1)
                    //   .blockRange(state.doc.resolve(anchor.posAtIndex(2, -1)));
                    tr.lift(range!, anchor.depth - 2);
                    // tr.step(new ReplaceAroundStep(start, end, gapStart, gapEnd,
                    //   new Slice(before.append(after), openStart, openEnd),
                    //   before.size - openStart, true))
                    // const pos = anchor.posAtIndex(node.firstChild!.nodeSize + 1, -1);
                  }
                  return true;
                }
              }
              return false;
            })
            .joinBackward()
            .run(),
        () => {
          debugger;
          return false;
        },
        () => commands.selectNodeBackward(),
        // () => true,
      ]);

    return {
      Enter: () => this.editor.commands.splitListItem("tcblock"),
      Tab: () => this.editor.commands.sinkListItem("tcblock"),
      "Shift-Tab": () => {
        debugger;
        return this.editor.commands.liftListItem("tcblock");
      },
      Backspace: handleBackspace,
    };
  },
  //   addKeyboardShortcuts() {
  //     return {
  //       Enter: () => this.editor.commands.splitListItem("indentItem"),
  //     };
  //   },
});

// <block>
//   <content>sdf</content>
//   <group>
//     <content>sdf</content>
//   </group>
// </block>
// <block>
//   <content>aaa</content>
//   <group>
//     <block></block>
//     <block></block>
//   </group>
// </block>
