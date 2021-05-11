import React from "react";
import { observer } from "mobx-react-lite";
import { DocumentResource } from "../../../../store/DocumentResource";

import { ReactNodeViewRenderer, NodeViewContent, NodeViewWrapper } from "@tiptap/react"
import HorizontalRule from "@tiptap/extension-horizontal-rule";

import styles from "./Block.module.css"

type Props = {
	document: DocumentResource;
};

// React component which adds a drag handle to the node.
const Component: React.FC<Props> = observer((props) => {
	return(
		<NodeViewWrapper className={styles.block}>
			<div
				className={styles.handle}
				style={{marginLeft: -0.4, display: "initial"}}
				contentEditable="false"
				draggable="true"
				data-drag-handle
			/>
			<NodeViewContent className={styles.content} as={"hr"}/>
		</NodeViewWrapper>
	);
})

// Extends paragraphs to make them draggable and give them drag handles.
const HorizontalRuleBlock = HorizontalRule.extend({
	draggable: true,

	// Used for rendering a React component inside the node. Here it's just used to add a drag handle to each block.
	addNodeView() {
		return ReactNodeViewRenderer(Component);
	}
})

export default HorizontalRuleBlock;