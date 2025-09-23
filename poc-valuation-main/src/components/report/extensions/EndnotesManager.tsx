import React, { useState, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface EndnoteItem {
  id: string
  number: string
  content: string
}

interface EndnotesManagerProps {
  editor: Editor
  isVisible: boolean
  onClose: () => void
}

const romanNumerals = [
  'i',
  'ii',
  'iii',
  'iv',
  'v',
  'vi',
  'vii',
  'viii',
  'ix',
  'x',
  'xi',
  'xii',
  'xiii',
  'xiv',
  'xv',
  'xvi',
  'xvii',
  'xviii',
  'xix',
  'xx',
]

export const EndnotesManager: React.FC<EndnotesManagerProps> = ({ editor, isVisible, onClose }) => {
  const [endnotes, setEndnotes] = useState<EndnoteItem[]>([])

  useEffect(() => {
    if (!editor || !isVisible) return

    // Collect all endnotes from the document
    const endnoteItems: EndnoteItem[] = []

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'endnote') {
        endnoteItems.push({
          id: node.attrs.id,
          number: node.attrs.number,
          content: node.attrs.content || '',
        })
      }
    })

    setEndnotes(
      endnoteItems.sort((a, b) => romanNumerals.indexOf(a.number) - romanNumerals.indexOf(b.number))
    )
  }, [editor, isVisible])

  const handleContentChange = (id: string, content: string) => {
    // Update endnote content in editor
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'endnote' && node.attrs.id === id) {
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
    setEndnotes(endnotes.map((e) => (e.id === id ? { ...e, content } : e)))
  }

  if (!isVisible) return null

  return (
    <Card className="mt-4 w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Manage Endnotes</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {endnotes.length > 0 ? (
            <div className="space-y-4">
              {endnotes.map((endnote) => (
                <div key={endnote.id} className="flex flex-col space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="font-semibold">Endnote {endnote.number}</span>
                  </div>
                  <Textarea
                    value={endnote.content}
                    onChange={(e) => handleContentChange(endnote.id, e.target.value)}
                    placeholder="Enter endnote text..."
                    className="min-h-[80px]"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              No endnotes in document. Click the "Insert Endnote" button to add one.
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
