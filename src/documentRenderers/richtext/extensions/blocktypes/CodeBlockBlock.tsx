import CodeBlock from "@tiptap/extension-code-block";
import {
	ReactNodeViewRenderer,
} from "@tiptap/react";
import React from "react";
import Block from "./Block";

// Extends code blocks to make them draggable and give them drag handles.
const CodeBlockBlock = CodeBlock.extend({
	draggable: true,
	selectable: false,

	// Used for rendering a React component inside the node, i.e. to add a drag handle to it.
	addNodeView() {
		return ReactNodeViewRenderer(Block("code"));
	}
})

export default CodeBlockBlock;