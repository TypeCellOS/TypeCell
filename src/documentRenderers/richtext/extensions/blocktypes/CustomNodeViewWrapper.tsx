import React from "react";

export interface NodeViewWrapperProps {
  [key: string]: any;
  as?: React.ElementType;
}

// delete this file when merged into tiptap: https://github.com/ueberdosis/tiptap/pull/1452
export const CustomNodeViewWrapper: React.FC<NodeViewWrapperProps> =
  React.forwardRef((props, ref) => {
    //   const { onDragStart } = useReactNodeView()
    const Tag = props.as || "div";

    return (
      <Tag
        {...props}
        data-node-view-wrapper=""
        //   onDragStart={onDragStart}
        style={{
          ...props.style,
          whiteSpace: "normal",
        }}
        ref={ref}
      />
    );
  });
