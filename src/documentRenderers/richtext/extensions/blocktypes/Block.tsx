import React, {
	ElementType,
	PropsWithChildren,
    useRef
} from "react";
import {
	NodeViewContent,
	NodeViewRendererProps,
	NodeViewWrapper
} from "@tiptap/react";
import Tippy from "@tippyjs/react";
import {ConnectableElement, DragSourceMonitor, DropTargetMonitor, useDrag, useDrop} from 'react-dnd'
import SideMenu from "../../SideMenu";

import styles from "./Block.module.css";

/**
 * This function creates a React component that represents a block in the editor. This is so that editor blocks can be
 * rendered with a functional drag handle next to them. The pop-up menu that appears after clicking a drag handle is
 * also handled here.
 * @param type	The type of HTML element to be rendered as a block.
 * @returns			A React component, to be used in a TipTap node view.
 */
function Block(type: ElementType) {
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

		const [{ isDragging }, dragRef, dragPreviewRef] = useDrag(() => ({
			// "type" is required. It is used by the "accept" specification of drop targets.
			type: 'BOX',
			// The collect function utilizes a "monitor" instance (see the Overview for what this is)
			// to pull important pieces of state from the DnD system.
			collect: (monitor: DragSourceMonitor) => ({
				isDragging: monitor.isDragging(),
			})
		}))

		const [{ canDrop }, dropRef] = useDrop(() => ({
			// The type (or types) to accept - strings or symbols
			accept: 'BOX',
			collect: (monitor) => ({
				canDrop: monitor.canDrop(),
			}),
			drop(item, monitor) {
				console.log("Dropped")
			},
			hover(item, monitor) {

			}
		}))

		// if (typeof props.getPos === "boolean") {
		// 	throw new Error("unexpected");
		// }
		//
		// const parent = props.editor.state.doc.resolve(props.getPos()).parent;
		//
		// if (type === "p" && parent.type.name === "blockquote") {
		// 	return (
		// 		<NodeViewWrapper>
		// 			<NodeViewContent className={styles.content} as={type}/>
		// 		</NodeViewWrapper>
		// 	)
		// }

		function dropAndPreviewRefs(el: ConnectableElement) {
			dropRef(el)
			dragPreviewRef(el)
		}

		return (
			<NodeViewWrapper className={styles.wrapper}>
				<div
					// Entire block within the node view wrapper
					ref={dropAndPreviewRefs}
					className={styles.block}
				>
					<div
						// Drag handle
						ref={dragRef}
						className={styles.handle}
					/>
				{type ===  "code" ? // Wraps content in "pre" tags if the content is code.
					<pre><NodeViewContent className={styles.content} as={type}/></pre> :
					<NodeViewContent className={styles.content} as={type}/>}
				</div>
			</NodeViewWrapper>
		)
	});
}

export default Block;