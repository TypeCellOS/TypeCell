import React, { useContext, useEffect, useState } from 'react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'

export default (props: any) => {

  return (<NodeViewWrapper as="div" className="react-component">

    <div>
      {/* <div {...attributes} className={classNames.root}> */}
      <div contentEditable={false} style={{ marginLeft: "-21px" }}>
        <div>hello</div>
        <NodeViewContent as="div" />
      </div>
    </div>
  </NodeViewWrapper>
  )
}