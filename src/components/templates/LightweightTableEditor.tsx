'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  Table,
  Plus,
  Minus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Type,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface TableData {
  headers: string[]
  rows: string[][]
  styling?: {
    headerStyle?: 'bold' | 'normal'
    alignment?: ('left' | 'center' | 'right')[]
    columnWidths?: string[]
    striped?: boolean
    bordered?: boolean
    compact?: boolean
  }
}

interface LightweightTableEditorProps {
  value: TableData | any
  onChange: (value: TableData) => void
  variables?: Array<{ id: string; name: string }>
  className?: string
}

export function LightweightTableEditor({
  value,
  onChange,
  variables = [],
  className,
}: LightweightTableEditorProps) {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null)
  const [cellValue, setCellValue] = useState('')

  // Ensure we have a valid table structure
  const tableData = useMemo<TableData>(() => {
    if (value && typeof value === 'object' && 'headers' in value && 'rows' in value) {
      return value as TableData
    }
    // Default table structure
    return {
      headers: ['Column 1', 'Column 2', 'Column 3'],
      rows: [
        ['Data 1', 'Data 2', 'Data 3'],
        ['Data 4', 'Data 5', 'Data 6'],
      ],
      styling: {
        headerStyle: 'bold',
        alignment: ['left', 'left', 'left'],
        striped: true,
        bordered: true,
        compact: false,
      },
    }
  }, [value])

  const updateTable = useCallback(
    (updates: Partial<TableData>) => {
      onChange({ ...tableData, ...updates })
    },
    [tableData, onChange]
  )

  const updateStyling = useCallback(
    (styleUpdates: Partial<TableData['styling']>) => {
      updateTable({
        styling: { ...tableData.styling, ...styleUpdates },
      })
    },
    [tableData.styling, updateTable]
  )

  // Column operations
  const addColumn = useCallback(() => {
    const newHeaders = [...tableData.headers, `Column ${tableData.headers.length + 1}`]
    const newRows = tableData.rows.map((row) => [...row, ''])
    updateTable({ headers: newHeaders, rows: newRows })
  }, [tableData, updateTable])

  const removeColumn = useCallback(
    (colIndex: number) => {
      if (tableData.headers.length <= 1) return
      const newHeaders = tableData.headers.filter((_, i) => i !== colIndex)
      const newRows = tableData.rows.map((row) => row.filter((_, i) => i !== colIndex))
      updateTable({ headers: newHeaders, rows: newRows })
    },
    [tableData, updateTable]
  )

  const moveColumn = useCallback(
    (colIndex: number, direction: 'left' | 'right') => {
      const newIndex = direction === 'left' ? colIndex - 1 : colIndex + 1
      if (newIndex < 0 || newIndex >= tableData.headers.length) return

      const newHeaders = [...tableData.headers]
      ;[newHeaders[colIndex], newHeaders[newIndex]] = [newHeaders[newIndex], newHeaders[colIndex]]

      const newRows = tableData.rows.map((row) => {
        const newRow = [...row]
        ;[newRow[colIndex], newRow[newIndex]] = [newRow[newIndex], newRow[colIndex]]
        return newRow
      })

      updateTable({ headers: newHeaders, rows: newRows })
    },
    [tableData, updateTable]
  )

  // Row operations
  const addRow = useCallback(() => {
    const newRow = new Array(tableData.headers.length).fill('')
    updateTable({ rows: [...tableData.rows, newRow] })
  }, [tableData, updateTable])

  const removeRow = useCallback(
    (rowIndex: number) => {
      const newRows = tableData.rows.filter((_, i) => i !== rowIndex)
      updateTable({ rows: newRows })
    },
    [tableData, updateTable]
  )

  const moveRow = useCallback(
    (rowIndex: number, direction: 'up' | 'down') => {
      const newIndex = direction === 'up' ? rowIndex - 1 : rowIndex + 1
      if (newIndex < 0 || newIndex >= tableData.rows.length) return

      const newRows = [...tableData.rows]
      ;[newRows[rowIndex], newRows[newIndex]] = [newRows[newIndex], newRows[rowIndex]]

      updateTable({ rows: newRows })
    },
    [tableData, updateTable]
  )

  const duplicateRow = useCallback(
    (rowIndex: number) => {
      const newRows = [
        ...tableData.rows.slice(0, rowIndex + 1),
        [...tableData.rows[rowIndex]],
        ...tableData.rows.slice(rowIndex + 1),
      ]
      updateTable({ rows: newRows })
    },
    [tableData, updateTable]
  )

  // Cell editing
  const startEditingCell = useCallback(
    (row: number, col: number) => {
      const value = row === -1 ? tableData.headers[col] : tableData.rows[row][col]
      setCellValue(value || '')
      setEditingCell({ row, col })
    },
    [tableData]
  )

  const saveCell = useCallback(() => {
    if (!editingCell) return

    if (editingCell.row === -1) {
      // Editing header
      const newHeaders = [...tableData.headers]
      newHeaders[editingCell.col] = cellValue
      updateTable({ headers: newHeaders })
    } else {
      // Editing data cell
      const newRows = [...tableData.rows]
      newRows[editingCell.row][editingCell.col] = cellValue
      updateTable({ rows: newRows })
    }

    setEditingCell(null)
    setCellValue('')
  }, [editingCell, cellValue, tableData, updateTable])

  const cancelEdit = useCallback(() => {
    setEditingCell(null)
    setCellValue('')
  }, [])

  // Insert variable
  const insertVariable = useCallback(
    (variableId: string) => {
      if (!editingCell) return
      const placeholder = `{{${variableId}}}`
      setCellValue((prev) => prev + placeholder)
    },
    [editingCell]
  )

  // Column alignment
  const setColumnAlignment = useCallback(
    (colIndex: number, alignment: 'left' | 'center' | 'right') => {
      const alignments = [...(tableData.styling?.alignment || [])]
      alignments[colIndex] = alignment
      updateStyling({ alignment: alignments })
    },
    [tableData, updateStyling]
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={addColumn}>
                  <Plus className="mr-1 h-3 w-3" />
                  Column
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add a new column</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={addRow}>
                  <Plus className="mr-1 h-3 w-3" />
                  Row
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add a new row</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex gap-1 border-l border-border pl-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={tableData.styling?.headerStyle === 'bold' ? 'default' : 'outline'}
                  onClick={() =>
                    updateStyling({
                      headerStyle: tableData.styling?.headerStyle === 'bold' ? 'normal' : 'bold',
                    })
                  }
                >
                  <Bold className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bold headers</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={tableData.styling?.striped ? 'default' : 'outline'}
                  onClick={() => updateStyling({ striped: !tableData.styling?.striped })}
                >
                  <AlignLeft className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Striped rows</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={tableData.styling?.bordered ? 'default' : 'outline'}
                  onClick={() => updateStyling({ bordered: !tableData.styling?.bordered })}
                >
                  <Table className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Show borders</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Table Editor */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="w-10 border-r border-border p-1"></th>
              {tableData.headers.map((header, colIndex) => (
                <th key={colIndex} className="relative border-r border-border p-0">
                  <div className="flex items-center justify-between p-1">
                    {editingCell?.row === -1 && editingCell?.col === colIndex ? (
                      <Input
                        value={cellValue}
                        onChange={(e) => setCellValue(e.target.value)}
                        onBlur={saveCell}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveCell()
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        className="h-7 text-sm"
                        autoFocus
                      />
                    ) : (
                      <div
                        className={cn(
                          'flex-1 cursor-text px-2 py-1 text-sm',
                          tableData.styling?.headerStyle === 'bold' && 'font-bold'
                        )}
                        onClick={() => startEditingCell(-1, colIndex)}
                      >
                        {header}
                      </div>
                    )}

                    <div className="flex gap-0.5">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0"
                              onClick={() => moveColumn(colIndex, 'left')}
                              disabled={colIndex === 0}
                            >
                              <ArrowLeft className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Move left</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0"
                              onClick={() => moveColumn(colIndex, 'right')}
                              disabled={colIndex === tableData.headers.length - 1}
                            >
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Move right</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                              onClick={() => removeColumn(colIndex)}
                              disabled={tableData.headers.length <= 1}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete column</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {/* Alignment controls */}
                  <div className="flex justify-center gap-0.5 border-t border-border p-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant={
                              tableData.styling?.alignment?.[colIndex] === 'left'
                                ? 'default'
                                : 'ghost'
                            }
                            className="h-5 w-5 p-0"
                            onClick={() => setColumnAlignment(colIndex, 'left')}
                          >
                            <AlignLeft className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Align left</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant={
                              tableData.styling?.alignment?.[colIndex] === 'center'
                                ? 'default'
                                : 'ghost'
                            }
                            className="h-5 w-5 p-0"
                            onClick={() => setColumnAlignment(colIndex, 'center')}
                          >
                            <AlignCenter className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Align center</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant={
                              tableData.styling?.alignment?.[colIndex] === 'right'
                                ? 'default'
                                : 'ghost'
                            }
                            className="h-5 w-5 p-0"
                            onClick={() => setColumnAlignment(colIndex, 'right')}
                          >
                            <AlignRight className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Align right</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  'border-b border-border',
                  tableData.styling?.striped && rowIndex % 2 === 1 && 'bg-muted/30'
                )}
              >
                <td className="border-r border-border p-1">
                  <div className="flex gap-0.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={() => moveRow(rowIndex, 'up')}
                            disabled={rowIndex === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Move up</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={() => moveRow(rowIndex, 'down')}
                            disabled={rowIndex === tableData.rows.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Move down</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={() => duplicateRow(rowIndex)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Duplicate row</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                            onClick={() => removeRow(rowIndex)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete row</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </td>
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      'border-r border-border p-2',
                      `text-${tableData.styling?.alignment?.[colIndex] || 'left'}`
                    )}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                      <div className="space-y-2">
                        <Input
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onBlur={saveCell}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              saveCell()
                            }
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          className="h-7 text-sm"
                          autoFocus
                        />
                        {variables.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {variables.slice(0, 3).map((variable) => (
                              <Button
                                key={variable.id}
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => insertVariable(variable.id)}
                              >
                                {variable.name}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="min-h-[1.5rem] cursor-text"
                        onClick={() => startEditingCell(rowIndex, colIndex)}
                      >
                        {cell || <span className="text-muted-foreground">Click to edit</span>}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Stats */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>{tableData.headers.length} columns</span>
        <span>{tableData.rows.length} rows</span>
        <span>{tableData.headers.length * tableData.rows.length} cells</span>
      </div>
    </div>
  )
}
