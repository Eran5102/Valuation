import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { FootnoteComponent } from './FootnoteComponent'

export const FootnoteExtension = Node.create({
  name: 'footnote',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'footnote',
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
        default: 1,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-footnote]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes({ 'data-footnote': '', class: 'footnote-ref' }, HTMLAttributes),
      `${HTMLAttributes.number}`,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FootnoteComponent)
  },
})

// Helper function to create and insert footnotes
// This avoids the TypeScript errors with TipTap's command system
export function createFootnoteCommand(
  editor: any,
  id: string,
  number: number,
  content: string = ''
) {
  if (!editor) return false

  editor
    .chain()
    .focus()
    .insertContent({
      type: 'footnote',
      attrs: {
        id,
        number,
        content,
      },
    })
    .run()

  return true
}
