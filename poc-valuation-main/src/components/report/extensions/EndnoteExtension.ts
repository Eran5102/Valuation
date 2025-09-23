import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { EndnoteComponent } from './EndnoteComponent'

export const EndnoteExtension = Node.create({
  name: 'endnote',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'endnote',
      },
    }
  },

  group: 'inline',

  inline: true,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      content: {
        default: '',
      },
      number: {
        default: 'i',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-endnote]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes({ 'data-endnote': '', class: 'endnote-ref' }, HTMLAttributes),
      `${HTMLAttributes.number}`,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(EndnoteComponent)
  },
})

// Helper function to create and insert endnotes
// This avoids the TypeScript errors with TipTap's command system
export function createEndnoteCommand(
  editor: any,
  id: string,
  number: string,
  content: string = ''
) {
  if (!editor) return false

  editor
    .chain()
    .focus()
    .insertContent({
      type: 'endnote',
      attrs: {
        id,
        number,
        content,
      },
    })
    .run()

  return true
}
