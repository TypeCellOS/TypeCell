import React from "react";

export interface NodeViewContentProps {
  [key: string]: any;
  as?: React.ElementType;
}

// delete this file when merged into tiptap: https://github.com/ueberdosis/tiptap/pull/1452
export const CustomNodeViewContent: React.FC<NodeViewContentProps> =
  React.forwardRef((props, ref) => {
    const Tag = props.as || "div";

    return (
      <Tag
        {...props}
        ref={ref}
        data-node-view-content=""
        style={{
          ...props.style,
          whiteSpace: "pre-wrap",
        }}
      />
    );
  });
