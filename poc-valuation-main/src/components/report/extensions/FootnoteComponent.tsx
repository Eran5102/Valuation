import React from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'

interface FootnoteAttributes {
  id: string | null
  content: string
  number: number
}

interface FootnoteNodeViewProps extends NodeViewProps {
  node: {
    attrs: FootnoteAttributes
  }
}

export const FootnoteComponent: React.FC<FootnoteNodeViewProps> = ({
  node,
  updateAttributes,
  extension,
}) => {
  // Now TypeScript knows node.attrs exists and has the correct shape
  const number = node.attrs.number

  return (
    <NodeViewWrapper className="inline">
      <sup
        className="footnote-ref hover:text-primary-dark cursor-pointer text-primary"
        contentEditable={false}
        data-footnote-ref={number}
      >
        {number}
      </sup>
    </NodeViewWrapper>
  )
}
