import Heading from "@tiptap/extension-heading";
import {
	ReactNodeViewRenderer,
} from "@tiptap/react";
import React from "react";
import Block from "./Block";

// Extends headings to make them draggable and give them drag handles.
const HeadingBlock = Heading.extend({
	draggable: true,
	selectable: false,

	// Used for rendering a React component inside the node, i.e. to add a drag handle to it.
	addNodeView() {
		return ReactNodeViewRenderer(Block("h1"));
	}
})

export default HeadingBlock;