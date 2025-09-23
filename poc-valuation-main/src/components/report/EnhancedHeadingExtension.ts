import { Extension } from '@tiptap/core'

// Extension to enhance the heading nodes with IDs for linking
const EnhancedHeadingExtension = Extension.create({
  name: 'enhancedHeading',

  addGlobalAttributes() {
    return [
      {
        types: ['heading'],
        attributes: {
          id: {
            default: null,
          },
        },
      },
    ]
  },
})

export default EnhancedHeadingExtension
