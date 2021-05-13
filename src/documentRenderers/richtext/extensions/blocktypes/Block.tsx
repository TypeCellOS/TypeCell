import React, {
	ElementType,
	PropsWithChildren
} from "react";
import {
	NodeViewContent,
	NodeViewRendererProps,
	NodeViewWrapper
} from "@tiptap/react";
import Tippy from "@tippyjs/react";
import SideMenu from "../../SideMenu";

import styles from "./Block.module.css";

/**
 * This function creates a React component that represents a block in the editor. This is so that editor blocks can be
 * rendered with a functional drag handle next to them. The pop-up menu that appears after clicking a drag handle is
 * also handled here.
 * @param type	The type of HTML element to be rendered as a block.
 * @returns			A React component, to be used in a TipTap node view.
 */
function Block(type: ElementType="p") {
	return (function Component(props: PropsWithChildren<NodeViewRendererProps>) {
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
						data-drag-handle // Ensures that the element can only be dragged using the drag handle.
					/>
				</Tippy>
				{type ===  "code" ? // Wraps content in "pre" tags if the content is code.
					<pre><NodeViewContent className={styles.content} as={type}/></pre> :
					<NodeViewContent className={styles.content} as={type}/>}
			</NodeViewWrapper>
		);
	});
}

export default Block;