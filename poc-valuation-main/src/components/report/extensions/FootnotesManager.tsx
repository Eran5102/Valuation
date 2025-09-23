import React, { useState, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface FootnoteItem {
  id: string
  number: number
  content: string
}

interface FootnotesManagerProps {
  editor: Editor
  isVisible: boolean
  onClose: () => void
}

export const FootnotesManager: React.FC<FootnotesManagerProps> = ({
  editor,
  isVisible,
  onClose,
}) => {
  const [footnotes, setFootnotes] = useState<FootnoteItem[]>([])

  useEffect(() => {
    if (!editor || !isVisible) return

    // Collect all footnotes from the document
    const footnoteItems: FootnoteItem[] = []

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'footnote') {
        footnoteItems.push({
          id: node.attrs.id,
          number: node.attrs.number,
          content: node.attrs.content || '',
        })
      }
    })

    setFootnotes(footnoteItems.sort((a, b) => a.number - b.number))
  }, [editor, isVisible])

  const handleContentChange = (id: string, content: string) => {
    // Update footnote content in editor
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'footnote' && node.attrs.id === id) {
        editor
          .chain()
          .setNodeSelection(pos)
          .command(({ tr }) => {
            tr.setNodeAttribute(pos, 'content', content)
            return true
          })
          .run()
      }
    })

    // Update local state
    setFootnotes(footnotes.map((f) => (f.id === id ? { ...f, content } : f)))
  }

  if (!isVisible) return null

  return (
    <Card className="mt-4 w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Manage Footnotes</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {footnotes.length > 0 ? (
            <div className="space-y-4">
              {footnotes.map((footnote) => (
                <div key={footnote.id} className="flex flex-col space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="font-semibold">Footnote {footnote.number}</span>
                  </div>
                  <Textarea
                    value={footnote.content}
                    onChange={(e) => handleContentChange(footnote.id, e.target.value)}
                    placeholder="Enter footnote text..."
                    className="min-h-[80px]"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              No footnotes in document. Click the "Insert Footnote" button to add one.
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
