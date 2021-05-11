import Tippy from "@tippyjs/react";
import CodeBlock from "@tiptap/extension-code-block";
import {
	NodeViewContent,
	NodeViewRendererProps,
	NodeViewWrapper,
	ReactNodeViewRenderer,
} from "@tiptap/react";
import { observer } from "mobx-react-lite";
import React from "react";
import SideMenu from "../../SideMenu";

import styles from "./Block.module.css"

// React component which adds a drag handle to the node.
const Component: React.FC<NodeViewRendererProps> = observer((props) => {
	function onDelete() {
		if (typeof props.getPos === "boolean") {
			throw new Error("unexpected");
		}
		const pos = props.getPos();

		props.editor.commands.deleteRange({
			from: pos,
			to: pos + props.node.nodeSize,
		});
	}

	return (
		<NodeViewWrapper className="block">
			<Tippy
				content={<SideMenu onDelete={onDelete}></SideMenu>}
				trigger={"click"}
				placement={"left"}
				interactive={true}>
				<div
					className={styles.handle}
					contentEditable="false"
					draggable="true"
					data-drag-handle
				/>
			</Tippy>
			<pre>
			<NodeViewContent className={styles.content} as={"code"}/>
			</pre>
		</NodeViewWrapper>
	);
});

// Extends paragraphs to make them draggable and give them drag handles.
const CodeBlockBlock = CodeBlock.extend({
	draggable: true,

	// Used for rendering a React component inside the node. Here it's just used to add a drag handle to each block.
	addNodeView() {
		return ReactNodeViewRenderer(Component);
	}
})

export default CodeBlockBlock;