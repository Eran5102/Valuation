import { Extension, Editor, Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import React, { useEffect, useState } from 'react'
import './tableOfContents.css'

// Interface for a TOC item
interface TocItem {
  id: string
  level: number
  text: string
}

// Define the TableOfContentsNode component
const TableOfContentsNode = ({ editor }: { editor: Editor }) => {
  const [items, setItems] = useState<TocItem[]>([])

  useEffect(() => {
    // Function to generate TOC items from content
    const generateTocItems = () => {
      const headings: TocItem[] = []
      const transaction = editor.state.tr

      // Go through all nodes in the document
      editor.state.doc.descendants((node, pos) => {
        // If the node is a heading, add it to our items
        if (node.type.name === 'heading' && node.attrs.level <= 3) {
          // Create a unique ID for the heading if it doesn't have one
          const id = node.attrs.id || `heading-${headings.length + 1}`

          // Try to get the text content from the heading node
          let text = ''
          node.forEach((child) => {
            if (child.type.name === 'text') {
              text += child.text
            }
          })

          // Add to our array of headings
          headings.push({
            id,
            level: node.attrs.level,
            text,
          })

          // Add id attribute to the heading in the document for linking
          if (!node.attrs.id) {
            transaction.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              id,
            })
          }
        }
        return true
      })

      // Apply the transaction to add IDs to headings
      if (transaction.steps.length) {
        editor.view.dispatch(transaction)
      }

      return headings
    }

    // Generate TOC when component mounts or editor content changes
    const items = generateTocItems()
    setItems(items)

    // Set up event listener for content changes
    const onUpdate = () => {
      const updatedItems = generateTocItems()
      setItems(updatedItems)
    }

    editor.on('update', onUpdate)

    return () => {
      editor.off('update', onUpdate)
    }
  }, [editor])

  // Generate indentation for different heading levels
  const getIndentation = (level: number) => {
    return { marginLeft: `${(level - 1) * 1.5}rem` }
  }

  if (items.length === 0) {
    return (
      <NodeViewWrapper className="table-of-contents mb-6 rounded-md border bg-gray-50 p-4">
        <h3 className="mb-2 text-lg font-medium">Table of Contents</h3>
        <p className="text-muted-foreground">
          No headings found. Add headings to your document to generate a table of contents.
        </p>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper className="table-of-contents mb-6 rounded-md border bg-gray-50 p-4">
      <h3 className="mb-2 text-lg font-medium">Table of Contents</h3>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={index} style={getIndentation(item.level)}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault()
                // Find the heading element and scroll to it
                const element = document.getElementById(item.id)
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }}
              className="cursor-pointer text-primary hover:underline"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </NodeViewWrapper>
  )
}

// Create the Table of Contents extension
export const TableOfContentsExtension = Node.create({
  name: 'tableOfContents',

  group: 'block',

  atom: true, // Cannot be split or merged

  draggable: true,

  selectable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="table-of-contents"]' }]
  },

  renderHTML() {
    return ['div', { 'data-type': 'table-of-contents', class: 'table-of-contents-container' }]
  },

  addNodeView() {
    return ReactNodeViewRenderer(TableOfContentsNode)
  },
})
