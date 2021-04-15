import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import React from 'react'

export default function TypeCellComponent(props: any) {

  return (<NodeViewWrapper as="div" className="react-component">

    <div>
      {/* <div {...attributes} className={classNames.root}> */}
      <div style={{ background: "gray" }}>
        <div>hello</div>
        <NodeViewContent as="div" />
      </div>
    </div>
  </NodeViewWrapper>
  )
}