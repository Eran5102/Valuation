import React from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'

interface EndnoteAttributes {
  id: string | null
  content: string
  number: string
}

interface EndnoteNodeViewProps extends NodeViewProps {
  node: {
    attrs: EndnoteAttributes
  }
}

export const EndnoteComponent: React.FC<EndnoteNodeViewProps> = ({
  node,
  updateAttributes,
  extension,
}) => {
  // Now TypeScript knows node.attrs exists and has the correct shape
  const number = node.attrs.number

  return (
    <NodeViewWrapper className="inline">
      <sup
        className="endnote-ref hover:text-primary-dark cursor-pointer text-primary"
        contentEditable={false}
        data-endnote-ref={number}
      >
        {number}
      </sup>
    </NodeViewWrapper>
  )
}
