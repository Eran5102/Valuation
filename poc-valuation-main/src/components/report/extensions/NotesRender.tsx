import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface NoteItem {
  id: string
  number: string | number
  content: string
}

interface NotesRenderProps {
  title: string
  notes: NoteItem[]
}

export const NotesRender: React.FC<NotesRenderProps> = ({ title, notes }) => {
  if (notes.length === 0) return null

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="mb-2 text-lg font-medium">{title}</h3>
      <div className="space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="flex">
            <div className="min-w-[30px] font-semibold">{note.number}</div>
            <div className="flex-1">{note.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
