import React from 'react'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { DynamicContentElement } from './DynamicContentElement'
import { DynamicContentValue } from './DynamicContentValue'
import { FormatOptions } from './DynamicContentFormatting'

// This component renders as a React component within the TipTap editor
const DynamicContentNodeView = ({ node }: { node: any }) => {
  const attrs = node.attrs

  // If it's a value type, render the DynamicContentValue component
  if (attrs.type === 'value') {
    return (
      <NodeViewWrapper>
        <DynamicContentValue
          contentId={attrs.contentId}
          format={{
            ...attrs.formatOptions?.format,
            color: attrs.formatOptions?.textColor, // Apply text color if specified
          }}
        />
      </NodeViewWrapper>
    )
  }

  // Otherwise, render the standard DynamicContentElement (for tables, charts, etc)
  return (
    <NodeViewWrapper>
      <DynamicContentElement
        type={attrs.type}
        contentId={attrs.contentId}
        name={attrs.name}
        category={attrs.category}
        formatOptions={attrs.formatOptions}
      />
    </NodeViewWrapper>
  )
}

// Extension for TipTap editor to handle dynamic content nodes
export const DynamicContentExtension = Node.create({
  name: 'dynamicContent',

  group: 'block',

  atom: true, // Cannot be split or merged

  draggable: true,

  inline: false,

  // Define attributes that can be stored with the node
  addAttributes() {
    return {
      type: {
        default: 'text',
      },
      contentId: {
        default: '',
      },
      name: {
        default: 'Dynamic Content',
      },
      category: {
        default: '',
      },
      formatOptions: {
        default: {},
        parseHTML: (element) => {
          const formatAttr = element.getAttribute('data-format-options')
          if (formatAttr) {
            try {
              return JSON.parse(formatAttr)
            } catch (e) {
              console.error('Error parsing format options:', e)
              return {}
            }
          }
          return {}
        },
      },
    }
  },

  // Parse HTML when loading the editor content
  parseHTML() {
    return [
      {
        tag: 'div[data-type="dynamic-content"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return {}

          const element = node as HTMLElement
          let formatOptions = {}

          try {
            const formatAttr = element.getAttribute('data-format-options')
            if (formatAttr) {
              formatOptions = JSON.parse(formatAttr)
            }
          } catch (e) {
            console.error('Error parsing format options:', e)
          }

          return {
            type: element.getAttribute('data-content-type') || 'text',
            contentId: element.getAttribute('data-content-id') || '',
            name: element.getAttribute('data-content-name') || 'Dynamic Content',
            category: element.getAttribute('data-content-category') || '',
            formatOptions,
          }
        },
      },
    ]
  },

  // Generate HTML when rendering the editor content
  renderHTML({ HTMLAttributes }) {
    const formatOptionsString = HTMLAttributes.formatOptions
      ? JSON.stringify(HTMLAttributes.formatOptions)
      : '{}'

    return [
      'div',
      mergeAttributes({
        'data-type': 'dynamic-content',
        'data-content-type': HTMLAttributes.type,
        'data-content-id': HTMLAttributes.contentId,
        'data-content-name': HTMLAttributes.name,
        'data-content-category': HTMLAttributes.category,
        'data-format-options': formatOptionsString,
        class: 'dynamic-content-container',
        contenteditable: 'false',
      }),
    ]
  },

  // Use React for the node view
  addNodeView() {
    return ReactNodeViewRenderer(DynamicContentNodeView)
  },
})

// Helper function to update formatting options for a dynamic content node
export const updateDynamicContentFormatting = (editor: any, formatOptions: FormatOptions) => {
  if (!editor) return false

  const { state } = editor
  const { selection } = state
  const { $anchor } = selection

  // Find the dynamic content node at the current selection
  const node = $anchor.node()
  if (node.type.name === 'dynamicContent') {
    // Update the node with new formatting options
    editor
      .chain()
      .updateAttributes('dynamicContent', {
        formatOptions,
      })
      .run()
    return true
  }

  return false
}

// Helper function to get the currently selected dynamic content node
export const getSelectedDynamicContent = (editor: any) => {
  if (!editor) return null

  const { state } = editor
  const { selection } = state
  const { $anchor } = selection

  // Try to find the dynamic content node at the current position
  let node = $anchor.node()
  if (node.type.name === 'dynamicContent') {
    return {
      type: node.attrs.type,
      contentId: node.attrs.contentId,
      name: node.attrs.name,
      category: node.attrs.category,
      formatOptions: node.attrs.formatOptions || {},
    }
  }

  // If the node itself is not a dynamic content node, check if it's inside one
  let depth = $anchor.depth
  while (depth > 0) {
    depth--
    node = $anchor.node(depth)
    if (node && node.type.name === 'dynamicContent') {
      return {
        type: node.attrs.type,
        contentId: node.attrs.contentId,
        name: node.attrs.name,
        category: node.attrs.category,
        formatOptions: node.attrs.formatOptions || {},
      }
    }
  }

  return null
}

// Helper functions remain the same
export const serializeDynamicContent = (content: string): string => {
  return content
}

export const parseDynamicContent = (htmlContent: string): string => {
  return htmlContent
}
