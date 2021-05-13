import OrderedList from "@tiptap/extension-ordered-list";
import {
	ReactNodeViewRenderer,
} from "@tiptap/react";
import React from "react";
import Block from "./Block";

// Extends ordered lists to make them draggable and give them drag handles.
const OrderedListBlock = OrderedList.extend({
	draggable: true,
	selectable: false,

	// Used for rendering a React component inside the node, i.e. to add a drag handle to it.
	addNodeView() {
		return ReactNodeViewRenderer(Block("ol"));
	}
})

export default OrderedListBlock;