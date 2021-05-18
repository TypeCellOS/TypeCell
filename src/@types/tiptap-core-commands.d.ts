import { Command, Range } from "@tiptap/core";

import { Node } from "prosemirror-model";

declare module "@tiptap/core" {
  interface Commands {
    replaceRangeCustom: {
      /**
       * Command for replacing a range with a node.
       *
       * This command tries to put the cursor at the start of the newly created node,
       * such that the user can start typing in the new node immediately.
       *
       * **Only use this command works best for inserting nodes that contain editable text.**
       *
       * @param range the range
       * @param node the prosemirror node
       * @returns true iff the command succeeded
       */
      replaceRangeCustom: (range: Range, node: Node) => Command;
    };
  }
}
