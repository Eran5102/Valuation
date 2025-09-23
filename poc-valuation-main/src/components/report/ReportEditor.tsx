import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Color from '@tiptap/extension-color'
import EnhancedHeadingExtension from './EnhancedHeadingExtension'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Heading1,
  Heading2,
  Type,
  Palette,
  X,
  Check,
  Database,
  Wand,
  ListOrdered as TableOfContents,
  Superscript,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { ColorPicker } from './ColorPicker'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DynamicContentPanel } from './DynamicContentPanel'
import { DynamicContentExtension } from './DynamicContent'
import { TableOfContentsExtension } from './TableOfContents'
import { FootnoteExtension, createFootnoteCommand } from './extensions/FootnoteExtension'
import { EndnoteExtension, createEndnoteCommand } from './extensions/EndnoteExtension'
import { FootnotesManager } from './extensions/FootnotesManager'
import { EndnotesManager } from './extensions/EndnotesManager'
import { NotesRender } from './extensions/NotesRender'
import { useParams } from 'react-router-dom'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import './extensions/notes.css'

interface ReportEditorProps {
  content: string
  onChange: (content: string) => void
  onAddImage?: (url: string) => void
}

// Use forwardRef to expose editor instance to parent component
export const ReportEditor = forwardRef(
  ({ content, onChange, onAddImage }: ReportEditorProps, ref) => {
    const { projectId = 'new' } = useParams<{ projectId: string }>()
    const [linkUrl, setLinkUrl] = useState('')
    const [linkPopoverOpen, setLinkPopoverOpen] = useState(false)
    const [imageUrl, setImageUrl] = useState('')
    const [imagePopoverOpen, setImagePopoverOpen] = useState(false)
    const [textColor, setTextColor] = useState('#000000')
    const [colorPopoverOpen, setColorPopoverOpen] = useState(false)
    const [dynamicContentDialogOpen, setDynamicContentDialogOpen] = useState(false)
    const [aiAssistDialogOpen, setAiAssistDialogOpen] = useState(false)
    const [aiPrompt, setAiPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)

    // New state for footnotes and endnotes
    const [footnoteManagerOpen, setFootnoteManagerOpen] = useState(false)
    const [endnoteManagerOpen, setEndnoteManagerOpen] = useState(false)
    const [footnoteCount, setFootnoteCount] = useState(0)
    const [endnoteCount, setEndnoteCount] = useState(0)

    const [promptTemplates, setPromptTemplates] = useState([
      'Draft an Executive Summary based on the final valuation range of $X-$Y million and key methodologies used.',
      'Explain the DCF methodology as applied in this report, including key assumptions like WACC (X%) and Terminal Growth Rate (Y%).',
      'Summarize the findings from the Comparable Company Analysis.',
      'Write a paragraph describing the company based on its profile information.',
    ])

    // Create editor instance with all extensions
    const editor = useEditor({
      extensions: [
        StarterKit,
        Image,
        Placeholder.configure({
          placeholder: 'Write your report content here...',
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableCell,
        TableHeader,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Underline,
        Link.configure({
          openOnClick: true,
          linkOnPaste: true,
        }),
        Color,
        // Add the dynamic content extension
        DynamicContentExtension,
        // Add the table of contents extension
        TableOfContentsExtension,
        // Add enhanced heading extension for TOC linking
        EnhancedHeadingExtension,
        // Add footnote and endnote extensions
        FootnoteExtension,
        EndnoteExtension,
      ],
      content: content,
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML())

        // Update footnote and endnote counts
        let fnCount = 0
        let enCount = 0

        editor.state.doc.descendants((node) => {
          if (node.type.name === 'footnote') fnCount++
          if (node.type.name === 'endnote') enCount++
        })

        setFootnoteCount(fnCount)
        setEndnoteCount(enCount)
      },
    })

    // Expose editor instance to parent component through ref
    useImperativeHandle(ref, () => ({
      editor,
    }))

    // Effect to update content when prop changes
    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        // Only update if content actually changed to prevent infinite loops
        editor.commands.setContent(content)
      }
    }, [content, editor])

    const setLink = () => {
      if (!editor || !linkUrl.trim()) return

      if (linkUrl) {
        const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
      }

      setLinkUrl('')
      setLinkPopoverOpen(false)
    }

    const removeLink = () => {
      if (!editor) return
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      setLinkPopoverOpen(false)
    }

    const addImage = () => {
      if (!editor || !imageUrl.trim()) return

      editor.chain().focus().setImage({ src: imageUrl, alt: 'Report image' }).run()
      onAddImage?.(imageUrl)
      setImageUrl('')
      setImagePopoverOpen(false)
    }

    const setColor = (color: string) => {
      if (!editor) return
      editor.chain().focus().setColor(color).run()
      setTextColor(color)
      setColorPopoverOpen(false)
    }

    // Insert table of contents at the current cursor position
    const insertTableOfContents = () => {
      if (!editor) return

      try {
        // Insert TOC node at current cursor position using proper command syntax
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'tableOfContents',
          })
          .run()

        toast.success('Table of contents inserted')
      } catch (error) {
        console.error('Error inserting table of contents:', error)
        toast.error('Failed to insert table of contents')
      }
    }

    // Handle inserting dynamic content
    const handleInsertDynamicContent = (item: any) => {
      if (!editor) return

      try {
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'dynamicContent',
            attrs: {
              type: item.type,
              contentId: item.id,
              name: item.name,
              category: item.category,
            },
          })
          .run()

        toast.success(`Inserted: ${item.name}`)
        setDynamicContentDialogOpen(false)
      } catch (error) {
        console.error('Error inserting dynamic content:', error)
        toast.error('Failed to insert dynamic content')
      }
    }

    // New function to handle AI text generation
    const generateAIContent = async () => {
      if (!editor || !aiPrompt.trim()) {
        toast.error('Please enter a prompt first')
        return
      }

      setIsGenerating(true)

      try {
        // Get project context data
        const projectContext = await fetchProjectContext(projectId)

        // In a real implementation, this would call an AI API with the prompt and project context
        // For now, we'll use a mock implementation
        const generatedText = await mockAITextGeneration(aiPrompt, projectContext)

        // Insert the generated text at the current cursor position
        editor.chain().focus().insertContent(generatedText).run()

        setAiPrompt('')
        setAiAssistDialogOpen(false)
        toast.success('AI content generated successfully')
      } catch (error) {
        console.error('Error generating AI content:', error)
        toast.error('Failed to generate AI content. Please try again.')
      } finally {
        setIsGenerating(false)
      }
    }

    // Mock function to simulate fetching project context data
    const fetchProjectContext = async (projectId: string) => {
      // In a real implementation, this would fetch data from the project state or API
      console.log(`Fetching context data for project ${projectId}`)

      // Sample mock data
      return {
        companyName: 'Acme Corporation',
        valuationDate: '2025-04-01',
        finalValueRangeLow: 95.5,
        finalValueRangeHigh: 110.2,
        waccRate: 10.5,
        terminalGrowthRate: 2.5,
        exitMultiple: 8.0,
        methodologiesUsed: ['DCF', 'Comparable Companies', 'Precedent Transactions'],
      }
    }

    // Mock function to simulate AI text generation
    const mockAITextGeneration = async (prompt: string, context: any) => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Parse the prompt and replace placeholders with context values
      let processedPrompt = prompt
        .replace(
          /\[Final Value Range Placeholder\]/g,
          `$${context.finalValueRangeLow.toFixed(1)}-$${context.finalValueRangeHigh.toFixed(1)} million`
        )
        .replace(/\[WACC Value Placeholder\]/g, `${context.waccRate}`)
        .replace(/\[TGR Value Placeholder\]/g, `${context.terminalGrowthRate}`)

      // Generate sample text based on prompt
      if (prompt.toLowerCase().includes('executive summary')) {
        return `<h2>Executive Summary</h2>
      <p>This report presents a comprehensive valuation analysis for ${context.companyName} as of ${context.valuationDate}. Based on our detailed financial analysis and market assessment, we have determined that the fair market value of ${context.companyName} is in the range of $${context.finalValueRangeLow.toFixed(1)}-$${context.finalValueRangeHigh.toFixed(1)} million.</p>
      <p>Our valuation approach incorporated multiple methodologies including ${context.methodologiesUsed.join(', ')}, with primary emphasis on the Discounted Cash Flow model given the company's stable growth projections and established market position.</p>
      <p>Key factors influencing this valuation include the company's historical performance, projected growth rates, industry benchmarks, and prevailing market conditions. Our analysis accounts for both quantitative metrics and qualitative factors that affect the company's future prospects.</p>`
      }

      if (prompt.toLowerCase().includes('dcf methodology')) {
        return `<h2>Discounted Cash Flow Methodology</h2>
      <p>The Discounted Cash Flow (DCF) analysis forms a cornerstone of our valuation approach for ${context.companyName}. This forward-looking methodology determines the company's intrinsic value based on its projected ability to generate cash flows in the future.</p>
      <p>For this analysis, we applied a Weighted Average Cost of Capital (WACC) of ${context.waccRate}%, reflecting the company's capital structure, risk profile, and current market conditions. The Terminal Growth Rate was established at ${context.terminalGrowthRate}%, representing our assessment of the company's sustainable long-term growth prospect beyond our explicit forecast period.</p>
      <p>Our DCF model incorporates a detailed 5-year projection of revenues, costs, capital expenditures, and working capital requirements, followed by a terminal value calculation using the perpetuity growth method.</p>`
      }

      if (prompt.toLowerCase().includes('comparable company')) {
        return `<h2>Comparable Company Analysis Findings</h2>
      <p>Our Comparable Company Analysis evaluated ${context.companyName} against a carefully selected group of publicly traded peers that share similar business models, market focus, size characteristics, and growth profiles.</p>
      <p>The analysis reveals that ${context.companyName} demonstrates stronger profit margins than the peer median, positioning it favorably within its competitive landscape. Revenue growth rates are consistent with industry trends, though slightly below the top quartile performers.</p>
      <p>Based on the observed trading multiples and accounting for ${context.companyName}'s specific risk profile and growth outlook, we applied EV/EBITDA multiples ranging from 7.5x to 9.0x, and EV/Revenue multiples of 1.8x to 2.2x to determine our valuation range under this methodology.</p>`
      }

      // Generic response for other prompts
      return `<p>${processedPrompt}</p>
    <p>The analysis for ${context.companyName} suggests a valuation range of $${context.finalValueRangeLow.toFixed(1)} million to $${context.finalValueRangeHigh.toFixed(1)} million. This assessment is based on our detailed evaluation of financial statements, market conditions, and industry benchmarks.</p>
    <p>Key metrics including a WACC of ${context.waccRate}% and Terminal Growth Rate of ${context.terminalGrowthRate}% were applied in our calculations to ensure accuracy and relevance to current market conditions.</p>`
    }

    // Handle selecting a prompt template
    const applyPromptTemplate = (template: string) => {
      setAiPrompt(template)
    }

    // New approach for footnotes and endnotes using helper functions
    const insertFootnote = () => {
      if (!editor) return

      // Generate a unique ID for the footnote
      const footnoteId = `fn-${Date.now()}`
      const footnoteNumber = footnoteCount + 1

      // Use the helper function to insert the footnote
      createFootnoteCommand(editor, footnoteId, footnoteNumber, '')

      // Open footnote manager to edit content
      setFootnoteManagerOpen(true)

      toast.success(`Footnote ${footnoteNumber} inserted`)
    }

    const insertEndnote = () => {
      if (!editor) return

      // Generate a unique ID for the endnote
      const endnoteId = `en-${Date.now()}`
      const endnoteNumber = getRomanNumeral(endnoteCount + 1)

      // Use the helper function to insert the endnote
      createEndnoteCommand(editor, endnoteId, endnoteNumber, '')

      // Open endnote manager to edit content
      setEndnoteManagerOpen(true)

      toast.success(`Endnote ${endnoteNumber} inserted`)
    }

    // Helper function to convert number to Roman numeral
    const getRomanNumeral = (num: number): string => {
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
      return romanNumerals[num - 1] || `${num}`
    }

    // Extract footnotes and endnotes for preview rendering
    const extractNotes = () => {
      if (!editor) return { footnotes: [], endnotes: [] }

      const footnotes: any[] = []
      const endnotes: any[] = []

      editor.state.doc.descendants((node) => {
        if (node.type.name === 'footnote') {
          footnotes.push({
            id: node.attrs.id,
            number: node.attrs.number,
            content: node.attrs.content || '',
          })
        }

        if (node.type.name === 'endnote') {
          endnotes.push({
            id: node.attrs.id,
            number: node.attrs.number,
            content: node.attrs.content || '',
          })
        }
      })

      return {
        footnotes: footnotes.sort((a, b) => a.number - b.number),
        endnotes: endnotes.sort((a, b) => {
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
          return romanNumerals.indexOf(a.number) - romanNumerals.indexOf(b.number)
        }),
      }
    }

    if (!editor) {
      return <div>Loading editor...</div>
    }

    useEffect(() => {
      if (editor) {
        // Make the editor globally accessible for the dynamic content sidebar
        window.tiptapEditor = editor

        return () => {
          window.tiptapEditor = undefined
        }
      }
    }, [editor])

    // Extract notes for rendering
    const { footnotes, endnotes } = extractNotes()

    return (
      <div className="flex h-full flex-col rounded-lg border">
        <div className="sticky top-0 z-10 flex flex-wrap gap-1 border-b bg-muted/30 p-2">
          {/* Text Formatting Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-muted' : ''}
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-muted' : ''}
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'bg-muted' : ''}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Alignment Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : ''}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : ''}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : ''}
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Lists */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-muted' : ''}
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-muted' : ''}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Headings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
          >
            <Heading1 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
          >
            <Heading2 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
          >
            <Type className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Special Features */}
          <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={editor.isActive('link') ? 'bg-muted' : ''}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Insert Link</h4>
                <div className="space-y-2">
                  <Label htmlFor="link-url">URL</Label>
                  <Input
                    id="link-url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="flex justify-between pt-2">
                  {editor.isActive('link') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeLink}
                      className="text-red-500"
                    >
                      <X className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                  <Button size="sm" onClick={setLink} className="ml-auto">
                    <Check className="mr-1 h-4 w-4" />
                    {editor.isActive('link') ? 'Update' : 'Insert'}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover open={imagePopoverOpen} onOpenChange={setImagePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                <ImageIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Insert Image</h4>
                <div className="space-y-2">
                  <Label htmlFor="image-url">Image URL</Label>
                  <Input
                    id="image-url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button size="sm" onClick={addImage}>
                    <Check className="mr-1 h-4 w-4" />
                    Insert
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            <TableIcon className="h-4 w-4" />
          </Button>

          <Popover open={colorPopoverOpen} onOpenChange={setColorPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Text Color</h4>
                <ColorPicker onChange={setColor} color={textColor} id="text-color" />
              </div>
            </PopoverContent>
          </Popover>

          {/* Table of Contents button */}
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button
            variant="ghost"
            size="sm"
            onClick={insertTableOfContents}
            title="Insert/Update Table of Contents"
            className="flex items-center gap-1 text-primary"
          >
            <TableOfContents className="h-4 w-4" />
            <span className="text-xs">Table of Contents</span>
          </Button>

          {/* Dynamic Content button */}
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDynamicContentDialogOpen(true)}
            title="Insert Dynamic Content"
            className="flex items-center gap-1 text-primary"
          >
            <Database className="h-4 w-4" />
            <span className="text-xs">Insert Dynamic</span>
          </Button>

          {/* AI Assist button */}
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAiAssistDialogOpen(true)}
            title="AI Writing Assistance"
            className="flex items-center gap-1 text-primary"
          >
            <Wand className="h-4 w-4" />
            <span className="text-xs">AI Assist</span>
          </Button>

          {/* New Footnote & Endnote buttons */}
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button
            variant="ghost"
            size="sm"
            onClick={insertFootnote}
            title="Insert Footnote"
            className="flex items-center gap-1 text-primary"
          >
            <Superscript className="h-4 w-4" />
            <span className="text-xs">Footnote</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={insertEndnote}
            title="Insert Endnote"
            className="flex items-center gap-1 text-primary"
          >
            <FileText className="h-4 w-4" />
            <span className="text-xs">Endnote</span>
          </Button>

          {/* Manage Notes buttons - show only if notes exist */}
          {(footnoteCount > 0 || endnoteCount > 0) && (
            <>
              <Separator orientation="vertical" className="mx-1 h-6" />
              {footnoteCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFootnoteManagerOpen(true)}
                  className="text-xs"
                >
                  Manage Footnotes ({footnoteCount})
                </Button>
              )}

              {endnoteCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEndnoteManagerOpen(true)}
                  className="text-xs"
                >
                  Manage Endnotes ({endnoteCount})
                </Button>
              )}
            </>
          )}
        </div>

        <ScrollArea className="relative flex-1">
          <div className="min-h-[500px] p-4">
            <EditorContent editor={editor} className="prose prose-sm max-w-none" />

            {/* Render footnotes at bottom if any exist */}
            {footnotes.length > 0 && <NotesRender title="Footnotes" notes={footnotes} />}

            {/* Render endnotes at very bottom if any exist */}
            {endnotes.length > 0 && <NotesRender title="Endnotes" notes={endnotes} />}
          </div>
        </ScrollArea>

        {/* Dialog for dynamic content selection */}
        <Dialog open={dynamicContentDialogOpen} onOpenChange={setDynamicContentDialogOpen}>
          <DialogContent className="max-h-[80vh] max-w-lg overflow-hidden">
            <DialogHeader>
              <DialogTitle>Insert Dynamic Content</DialogTitle>
            </DialogHeader>
            <DynamicContentPanel onInsert={handleInsertDynamicContent} projectId={projectId} />
          </DialogContent>
        </Dialog>

        {/* Dialog for AI Assist */}
        <Dialog open={aiAssistDialogOpen} onOpenChange={setAiAssistDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>AI Writing Assistance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="ai-prompt">What would you like the AI to write about?</Label>
                <Textarea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Enter your prompt here..."
                  className="mt-2 h-32"
                />
              </div>

              <div className="space-y-2">
                <Label>Quick Prompts</Label>
                <div className="grid grid-cols-1 gap-2">
                  {promptTemplates.map((template, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="h-auto justify-start py-2 text-left"
                      onClick={() => applyPromptTemplate(template)}
                    >
                      {template}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mb-2 mt-4 text-xs text-muted-foreground">
                <p>
                  The AI will use data from your current valuation project to generate relevant
                  content.
                </p>
                <p>
                  For placeholders, use [Final Value Range Placeholder], [WACC Value Placeholder],
                  etc.
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setAiAssistDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={generateAIContent}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? 'Generating...' : 'Generate Content'}
                  <Wand className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Footnote Manager */}
        <FootnotesManager
          editor={editor}
          isVisible={footnoteManagerOpen}
          onClose={() => setFootnoteManagerOpen(false)}
        />

        {/* Endnote Manager */}
        <EndnotesManager
          editor={editor}
          isVisible={endnoteManagerOpen}
          onClose={() => setEndnoteManagerOpen(false)}
        />
      </div>
    )
  }
)

// Add display name for the component
ReportEditor.displayName = 'ReportEditor'
