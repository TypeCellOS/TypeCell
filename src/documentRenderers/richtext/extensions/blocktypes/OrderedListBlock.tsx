import React from "react";
import { observer } from "mobx-react-lite";
import { DocumentResource } from "../../../../store/DocumentResource";

import { ReactNodeViewRenderer, NodeViewContent, NodeViewWrapper } from "@tiptap/react"
import OrderedList from "@tiptap/extension-ordered-list";

import styles from "./Block.module.css"

type Props = {
	document: DocumentResource;
};

// React component which adds a drag handle to the node.
const Component: React.FC<Props> = observer((props) => {
	return(
		<NodeViewWrapper className={styles.block} as={"ol"}>
			<div
				className={styles.handle}
				style={{marginLeft: 0.4}}
				contentEditable="false"
				draggable="true"
				data-drag-handle
			/>
			<NodeViewContent className={styles.content}/>
		</NodeViewWrapper>
	);
})

// Extends paragraphs to make them draggable and give them drag handles.
const OrderedListBlock = OrderedList.extend({
	draggable: true,

	// Used for rendering a React component inside the node. Here it's just used to add a drag handle to each block.
	addNodeView() {
		return ReactNodeViewRenderer(Component);
	}
})

export default OrderedListBlock;