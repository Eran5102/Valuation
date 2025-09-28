'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  RemoveFormatting,
  Undo,
  Redo,
  Type,
  Palette,
  Highlighter,
  Strikethrough,
  Subscript,
  Superscript,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    subscript: false,
    superscript: false,
    bulletList: false,
    numberedList: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
    blockquote: false,
    code: false,
  })
  const [fontSize, setFontSize] = useState('16')
  const [fontFamily, setFontFamily] = useState('default')
  const [textColor, setTextColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('transparent')
  const [heading, setHeading] = useState('normal')

  // Initialize editor with value
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  // Update active formats based on current selection
  const updateActiveFormats = () => {
    const newFormats = {
      bold: Boolean(document.queryCommandState('bold')),
      italic: Boolean(document.queryCommandState('italic')),
      underline: Boolean(document.queryCommandState('underline')),
      strikethrough: Boolean(document.queryCommandState('strikeThrough')),
      subscript: Boolean(document.queryCommandState('subscript')),
      superscript: Boolean(document.queryCommandState('superscript')),
      bulletList: Boolean(document.queryCommandState('insertUnorderedList')),
      numberedList: Boolean(document.queryCommandState('insertOrderedList')),
      alignLeft: Boolean(document.queryCommandState('justifyLeft')),
      alignCenter: Boolean(document.queryCommandState('justifyCenter')),
      alignRight: Boolean(document.queryCommandState('justifyRight')),
      alignJustify: Boolean(document.queryCommandState('justifyFull')),
      blockquote: document.queryCommandValue('formatBlock') === 'blockquote',
      code: document.queryCommandValue('formatBlock') === 'pre',
    }
    setActiveFormats(newFormats)

    // Get current font size
    const size = document.queryCommandValue('fontSize')
    if (size) {
      const pxSize = parseInt(size) * 4 + 10 // Convert font size value to px
      setFontSize(pxSize.toString())
    }
  }

  // Handle selection change
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      setSelection(selection)
      updateActiveFormats()
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [])

  // Execute formatting command
  const execCommand = (command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    updateActiveFormats()
    handleContentChange()
  }

  // Handle content change
  const handleContentChange = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      onChange(html === '<br>' ? '' : html)
    }
  }

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          execCommand('bold')
          break
        case 'i':
          e.preventDefault()
          execCommand('italic')
          break
        case 'u':
          e.preventDefault()
          execCommand('underline')
          break
        case 'z':
          if (e.shiftKey) {
            e.preventDefault()
            execCommand('redo')
          } else {
            e.preventDefault()
            execCommand('undo')
          }
          break
        case 'y':
          e.preventDefault()
          execCommand('redo')
          break
      }
    }
  }

  // Handle paste to preserve formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')

    // If HTML is available and contains formatting, use it
    // Otherwise use plain text to avoid pasting unwanted styles
    if (html && (html.includes('<b>') || html.includes('<i>') || html.includes('<u>'))) {
      document.execCommand('insertHTML', false, html)
    } else {
      // Insert plain text but keep current formatting
      document.execCommand('insertText', false, text)
    }
    handleContentChange()
  }

  // Insert link
  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  // Handle font size change
  const handleFontSizeChange = (size: string) => {
    editorRef.current?.focus()
    // Create a span with font size
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const span = document.createElement('span')
      span.style.fontSize = `${size}px`

      if (range.toString()) {
        // Wrap selected text
        try {
          range.surroundContents(span)
        } catch {
          // If surroundContents fails, use insertNode
          span.appendChild(range.extractContents())
          range.insertNode(span)
        }
      }
    }
    setFontSize(size)
    handleContentChange()
  }

  // Handle font family change
  const handleFontFamilyChange = (family: string) => {
    editorRef.current?.focus()
    const fontMap: Record<string, string> = {
      default: 'inherit',
      serif: 'Georgia, serif',
      sans: 'Arial, sans-serif',
      mono: 'Courier New, monospace',
      cursive: 'Comic Sans MS, cursive',
    }
    execCommand('fontName', fontMap[family] || family)
    setFontFamily(family)
  }

  // Handle heading change
  const handleHeadingChange = (level: string) => {
    editorRef.current?.focus()
    if (level === 'normal') {
      execCommand('formatBlock', 'p')
    } else {
      execCommand('formatBlock', level)
    }
    setHeading(level)
  }

  // Handle color changes
  const handleColorChange = (color: string, isBackground: boolean) => {
    editorRef.current?.focus()
    if (isBackground) {
      execCommand('hiliteColor', color)
      setBgColor(color)
    } else {
      execCommand('foreColor', color)
      setTextColor(color)
    }
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border bg-background', className)}>
      {/* Toolbar */}
      <div className="space-y-2 border-b bg-muted p-2">
        {/* First row - Font controls */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Font Family */}
          <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
            <SelectTrigger className="h-8 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="serif">Serif</SelectItem>
              <SelectItem value="sans">Sans Serif</SelectItem>
              <SelectItem value="mono">Monospace</SelectItem>
              <SelectItem value="cursive">Cursive</SelectItem>
            </SelectContent>
          </Select>

          {/* Font Size */}
          <Select value={fontSize} onValueChange={handleFontSizeChange}>
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10px</SelectItem>
              <SelectItem value="12">12px</SelectItem>
              <SelectItem value="14">14px</SelectItem>
              <SelectItem value="16">16px</SelectItem>
              <SelectItem value="18">18px</SelectItem>
              <SelectItem value="20">20px</SelectItem>
              <SelectItem value="24">24px</SelectItem>
              <SelectItem value="28">28px</SelectItem>
              <SelectItem value="32">32px</SelectItem>
              <SelectItem value="36">36px</SelectItem>
              <SelectItem value="48">48px</SelectItem>
              <SelectItem value="64">64px</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6" />

          {/* Heading Styles */}
          <Select value={heading} onValueChange={handleHeadingChange}>
            <SelectTrigger className="h-8 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="h1">Heading 1</SelectItem>
              <SelectItem value="h2">Heading 2</SelectItem>
              <SelectItem value="h3">Heading 3</SelectItem>
              <SelectItem value="h4">Heading 4</SelectItem>
              <SelectItem value="h5">Heading 5</SelectItem>
              <SelectItem value="h6">Heading 6</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6" />

          {/* Text Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                title="Text Color"
                type="button"
              >
                <Type className="h-4 w-4" style={{ color: textColor }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="space-y-2">
                <div className="text-xs font-medium">Text Color</div>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={textColor}
                    onChange={(e) => handleColorChange(e.target.value, false)}
                    className="h-8 w-20"
                  />
                  <Input
                    type="text"
                    value={textColor}
                    onChange={(e) => handleColorChange(e.target.value, false)}
                    className="h-8 w-24"
                    placeholder="#000000"
                  />
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {[
                    '#000000',
                    '#434343',
                    '#666666',
                    '#999999',
                    '#b7b7b7',
                    '#cccccc',
                    '#d9d9d9',
                    '#efefef',
                    '#f3f3f3',
                    '#ffffff',
                    '#980000',
                    '#ff0000',
                    '#ff9900',
                    '#ffff00',
                    '#00ff00',
                    '#00ffff',
                    '#4a86e8',
                    '#0000ff',
                    '#9900ff',
                    '#ff00ff',
                  ].map((color) => (
                    <button
                      key={color}
                      className="h-6 w-6 rounded border"
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(color, false)}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Background Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                title="Background Color"
                type="button"
              >
                <Highlighter
                  className="h-4 w-4"
                  style={{ color: bgColor === 'transparent' ? '#999' : bgColor }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="space-y-2">
                <div className="text-xs font-medium">Background Color</div>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={bgColor === 'transparent' ? '#ffffff' : bgColor}
                    onChange={(e) => handleColorChange(e.target.value, true)}
                    className="h-8 w-20"
                  />
                  <Input
                    type="text"
                    value={bgColor}
                    onChange={(e) => handleColorChange(e.target.value, true)}
                    className="h-8 w-24"
                    placeholder="#ffffff"
                  />
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {[
                    'transparent',
                    '#ffffff',
                    '#ffff00',
                    '#00ff00',
                    '#00ffff',
                    '#0000ff',
                    '#ff00ff',
                    '#ff0000',
                    '#fce5cd',
                    '#fff2cc',
                    '#d9ead3',
                    '#d0e0e3',
                    '#cfe2f3',
                    '#d9d2e9',
                    '#ead1dc',
                    '#e1e1e1',
                  ].map((color) => (
                    <button
                      key={color}
                      className="h-6 w-6 rounded border"
                      style={{ backgroundColor: color === 'transparent' ? '#fff' : color }}
                      onClick={() => handleColorChange(color, true)}
                    >
                      {color === 'transparent' && <span className="text-xs">✕</span>}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Second row - Formatting controls */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Text formatting */}
          <div className="flex items-center gap-0.5">
            <Button
              size="sm"
              variant={activeFormats.bold ? 'default' : 'outline'}
              className="h-8 w-8 p-0"
              onClick={() => execCommand('bold')}
              title="Bold (Ctrl+B)"
              type="button"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeFormats.italic ? 'default' : 'outline'}
              className="h-8 w-8 p-0"
              onClick={() => execCommand('italic')}
              title="Italic (Ctrl+I)"
              type="button"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeFormats.underline ? 'default' : 'outline'}
              className="h-8 w-8 p-0"
              onClick={() => execCommand('underline')}
              title="Underline (Ctrl+U)"
              type="button"
            >
              <Underline className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeFormats.strikethrough ? 'default' : 'outline'}
              className="h-8 w-8 p-0"
              onClick={() => execCommand('strikeThrough')}
              title="Strikethrough"
              type="button"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeFormats.subscript ? 'default' : 'outline'}
              className="h-8 w-8 p-0"
              onClick={() => execCommand('subscript')}
              title="Subscript"
              type="button"
            >
              <Subscript className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeFormats.superscript ? 'default' : 'outline'}
              className="h-8 w-8 p-0"
              onClick={() => execCommand('superscript')}
              title="Superscript"
              type="button"
            >
              <Superscript className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists */}
          <div className="flex items-center gap-0.5">
            <Button
              size="sm"
              variant={activeFormats.bulletList ? 'default' : 'outline'}
              className="h-8 w-8 p-0"
              onClick={() => execCommand('insertUnorderedList')}
              title="Bullet List"
              type="button"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeFormats.numberedList ? 'default' : 'outline'}
              className="h-8 w-8 p-0"
              onClick={() => execCommand('insertOrderedList')}
              title="Numbered List"
              type="button"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignment */}
          <div className="flex items-center gap-0.5">
            <Button
              size="sm"
              variant={activeFormats.alignLeft ? 'default' : 'outline'}
              className="h-8 w-8 p-0"
              onClick={() => execCommand('justifyLeft')}
              title="Align Left"
              type="button"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeFormats.alignCenter ? 'default' : 'outline'}
              className="h-8 w-8 p-0"
              onClick={() => execCommand('justifyCenter')}
              title="Align Center"
              type="button"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeFormats.alignRight ? 'default' : 'outline'}
              className="h-8 w-8 p-0"
              onClick={() => execCommand('justifyRight')}
              title="Align Right"
              type="button"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeFormats.alignJustify ? 'default' : 'outline'}
              className="h-8 w-8 p-0"
              onClick={() => execCommand('justifyFull')}
              title="Justify"
              type="button"
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Block formats */}
          <div className="flex items-center gap-0.5">
            <Button
              size="sm"
              variant={activeFormats.blockquote ? 'default' : 'outline'}
              className="h-8 w-8 p-0"
              onClick={() => execCommand('formatBlock', 'blockquote')}
              title="Blockquote"
              type="button"
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={activeFormats.code ? 'default' : 'outline'}
              className="h-8 w-8 p-0"
              onClick={() => execCommand('formatBlock', 'pre')}
              title="Code Block"
              type="button"
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Additional tools */}
          <div className="flex items-center gap-0.5">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={insertLink}
              title="Insert Link"
              type="button"
            >
              <Link className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => execCommand('removeFormat')}
              title="Clear Formatting"
              type="button"
            >
              <RemoveFormatting className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => execCommand('undo')}
              title="Undo (Ctrl+Z)"
              type="button"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => execCommand('redo')}
              title="Redo (Ctrl+Y)"
              type="button"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[150px] p-3 focus:outline-none"
        onInput={handleContentChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onMouseUp={updateActiveFormats}
        onKeyUp={updateActiveFormats}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      <style jsx>{`
        div[contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }

        /* List styles for proper display in editor */
        div[contenteditable] ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        div[contenteditable] ul ul {
          list-style-type: circle;
        }

        div[contenteditable] ul ul ul {
          list-style-type: square;
        }

        div[contenteditable] ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        div[contenteditable] ol ol {
          list-style-type: lower-alpha;
        }

        div[contenteditable] ol ol ol {
          list-style-type: lower-roman;
        }

        div[contenteditable] li {
          display: list-item;
          margin: 0.25em 0;
        }

        div[contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
          color: #6b7280;
        }

        div[contenteditable] pre {
          background-color: #f3f4f6;
          padding: 1em;
          border-radius: 4px;
          overflow-x: auto;
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.9em;
        }

        div[contenteditable] code {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.9em;
        }
      `}</style>
    </div>
  )
}
