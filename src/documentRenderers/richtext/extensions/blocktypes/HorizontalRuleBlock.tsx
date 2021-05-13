import HorizontalRule from "@tiptap/extension-horizontal-rule";
import {
	ReactNodeViewRenderer,
} from "@tiptap/react";
import React from "react";
import Block from "./Block";

// Extends horizontal rules to make them draggable and give them drag handles.
const HorizontalRuleBlock = HorizontalRule.extend({
	draggable: true,

	// Used for rendering a React component inside the node, i.e. to add a drag handle to it.
	addNodeView() {
		return ReactNodeViewRenderer(Block("hr"));
	}
})

export default HorizontalRuleBlock;