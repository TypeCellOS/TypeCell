import BlockQuote from "@tiptap/extension-blockquote";
import {
	ReactNodeViewRenderer,
} from "@tiptap/react";
import React from "react";
import Block from "./Block";

// Extends block quotes to make them draggable and give them drag handles.
const BlockQuoteBlock = BlockQuote.extend({
	draggable: true,
	selectable: false,

	// Used for rendering a React component inside the node, i.e. to add a drag handle to it.
	addNodeView() {
		return ReactNodeViewRenderer(Block("blockquote"));
	}
})

export default BlockQuoteBlock;