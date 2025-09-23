import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Upload,
  FolderOpen,
  Search,
  Download,
  Trash2,
  Eye,
  FileArchive,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

// Mock document categories
const documentCategories = [
  { id: 'all', name: 'All Documents' },
  { id: 'financial', name: 'Financial Statements' },
  { id: 'tax', name: 'Tax Returns' },
  { id: 'legal', name: 'Legal Documents' },
  { id: 'analysis', name: 'Analysis Reports' },
  { id: 'other', name: 'Other Documents' },
]

// Mock documents data
const mockDocuments = [
  {
    id: '1',
    name: 'Financial Statement 2024',
    description: 'Annual financial statement for fiscal year 2024',
    date: '2024-05-01',
    category: 'financial',
    size: '2.4 MB',
    type: 'pdf',
    tags: ['financial', '2024'],
  },
  {
    id: '2',
    name: 'Tax Return 2023',
    description: 'Federal tax return filing for 2023',
    date: '2023-04-15',
    category: 'tax',
    size: '1.8 MB',
    type: 'pdf',
    tags: ['tax', '2023'],
  },
  {
    id: '3',
    name: 'Operating Agreement',
    description: 'Company operating agreement and bylaws',
    date: '2022-10-10',
    category: 'legal',
    size: '3.7 MB',
    type: 'docx',
    tags: ['legal', 'agreement'],
  },
  {
    id: '4',
    name: 'Valuation Analysis Q1',
    description: 'Quarterly valuation analysis report',
    date: '2025-01-15',
    category: 'analysis',
    size: '5.2 MB',
    type: 'xlsx',
    tags: ['analysis', 'valuation', 'quarterly'],
  },
  {
    id: '5',
    name: 'Board Meeting Minutes',
    description: 'Minutes from the annual board meeting',
    date: '2024-02-28',
    category: 'legal',
    size: '0.8 MB',
    type: 'pdf',
    tags: ['legal', 'board', 'meeting'],
  },
]

// Get file icon based on file type
const getFileIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'pdf':
      return <FileText className="h-6 w-6 text-red-500" />
    case 'xlsx':
      return <FileText className="h-6 w-6 text-green-600" />
    case 'docx':
      return <FileText className="h-6 w-6 text-blue-500" />
    case 'zip':
      return <FileArchive className="h-6 w-6 text-amber-500" />
    default:
      return <FileText className="h-6 w-6 text-gray-500" />
  }
}

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [newDocumentData, setNewDocumentData] = useState({
    name: '',
    description: '',
    category: 'other',
    tags: '',
  })
  const [documents, setDocuments] = useState(mockDocuments)
  const [viewDocument, setViewDocument] = useState<(typeof mockDocuments)[0] | null>(null)

  // Filter documents based on search and category
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Handle file upload
  const handleUpload = () => {
    // In a real implementation, this would handle actual file uploading
    const newDoc = {
      id: (documents.length + 1).toString(),
      name: newDocumentData.name,
      description: newDocumentData.description,
      date: new Date().toISOString().split('T')[0],
      category: newDocumentData.category,
      size: '1.2 MB', // placeholder
      type: 'pdf', // placeholder
      tags: newDocumentData.tags ? newDocumentData.tags.split(',').map((tag) => tag.trim()) : [],
    }

    setDocuments([newDoc, ...documents])
    setIsUploadDialogOpen(false)
    setNewDocumentData({ name: '', description: '', category: 'other', tags: '' })
    toast.success('Document uploaded successfully')
  }

  // Handle document deletion
  const handleDelete = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id))
    toast.success('Document deleted successfully')
  }

  return (
    <div className="h-full p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Documents</h1>

        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
              <DialogDescription>
                Upload a document to the project repository. Supported formats: PDF, DOCX, XLSX,
                ZIP.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newDocumentData.name}
                  onChange={(e) => setNewDocumentData({ ...newDocumentData, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={newDocumentData.description}
                  onChange={(e) =>
                    setNewDocumentData({ ...newDocumentData, description: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select
                  value={newDocumentData.category}
                  onValueChange={(value) =>
                    setNewDocumentData({ ...newDocumentData, category: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentCategories
                      .filter((cat) => cat.id !== 'all')
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tags" className="text-right">
                  Tags
                </Label>
                <Input
                  id="tags"
                  placeholder="Comma-separated tags"
                  value={newDocumentData.tags}
                  onChange={(e) => setNewDocumentData({ ...newDocumentData, tags: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file" className="text-right">
                  File
                </Label>
                <Input id="file" type="file" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload}>Upload</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex h-[calc(100%-60px)] flex-col gap-6 lg:flex-row">
        {/* Sidebar with categories */}
        <div className="w-full flex-shrink-0 lg:w-64">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center">
                  <Search className="mr-2 h-4 w-4 opacity-50" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9"
                  />
                </div>
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <div className="space-y-1">
                    <p className="mb-2 text-sm font-medium">Categories</p>
                    {documentCategories.map((category) => (
                      <div
                        key={category.id}
                        className={`flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                          selectedCategory === category.id
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <div className="flex items-center">
                          <FolderOpen className="mr-2 h-4 w-4" />
                          <span>{category.name}</span>
                        </div>
                        <Badge variant="outline" className="ml-auto">
                          {category.id === 'all'
                            ? documents.length
                            : documents.filter((d) => d.category === category.id).length}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content area */}
        <div className="min-h-0 flex-1">
          <Card className="h-full">
            <CardContent className="h-full p-4">
              <Tabs defaultValue="grid" className="flex h-full flex-col">
                <div className="mb-4 flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="grid">Grid</TabsTrigger>
                    <TabsTrigger value="list">List</TabsTrigger>
                  </TabsList>
                  <div className="text-sm text-muted-foreground">
                    {filteredDocuments.length} documents
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <TabsContent value="grid" className="m-0">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredDocuments.map((doc) => (
                        <Card key={doc.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="p-4">
                              <div className="flex items-start gap-3">
                                {getFileIcon(doc.type)}
                                <div>
                                  <h3 className="line-clamp-1 text-sm font-medium">{doc.name}</h3>
                                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                    {doc.description}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 text-xs text-muted-foreground">
                                <div className="flex justify-between">
                                  <span>Added: {doc.date}</span>
                                  <span>{doc.size}</span>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {doc.tags.map((tag, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Separator />
                            <div className="flex justify-end gap-1 p-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewDocument(doc)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(doc.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {filteredDocuments.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
                          <FileText className="mb-4 h-12 w-12 text-muted-foreground opacity-30" />
                          <h3 className="text-lg font-medium">No documents found</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {searchQuery
                              ? `No documents match your search "${searchQuery}"`
                              : 'No documents in this category'}
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="list" className="m-0">
                    <div className="rounded-md border">
                      <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-medium">
                        <div className="col-span-5">Name</div>
                        <div className="col-span-3">Category</div>
                        <div className="col-span-2">Date</div>
                        <div className="col-span-1">Size</div>
                        <div className="col-span-1 text-right">Actions</div>
                      </div>
                      {filteredDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="grid grid-cols-12 items-center border-t p-3 text-sm"
                        >
                          <div className="col-span-5 flex items-center gap-3">
                            {getFileIcon(doc.type)}
                            <div>
                              <div className="font-medium">{doc.name}</div>
                              <div className="text-xs text-muted-foreground">{doc.description}</div>
                            </div>
                          </div>
                          <div className="col-span-3">
                            {documentCategories.find((c) => c.id === doc.category)?.name ||
                              doc.category}
                          </div>
                          <div className="col-span-2">{doc.date}</div>
                          <div className="col-span-1">{doc.size}</div>
                          <div className="col-span-1 flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewDocument(doc)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {filteredDocuments.length === 0 && (
                        <div className="p-8 text-center">
                          <p className="text-muted-foreground">No documents found</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={!!viewDocument} onOpenChange={() => setViewDocument(null)}>
        <DialogContent className="flex h-[80vh] max-w-4xl flex-col">
          <DialogHeader>
            <DialogTitle>{viewDocument?.name}</DialogTitle>
            <DialogDescription>{viewDocument?.description}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-1 items-center justify-center overflow-hidden rounded-md bg-muted/30 p-4">
            <div className="text-center">
              {getFileIcon(viewDocument?.type || '')}
              <p className="mt-4 text-muted-foreground">
                Document preview would be displayed here.
                <br />
                In a production environment, this would show a PDF viewer or other appropriate
                viewer.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDocument(null)}>
              Close
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
