// Dynamic import to prevent SSR issues with xlsx library
export async function exportTableToExcel(table: any, tableId: string) {
  // Dynamically import XLSX to prevent SSR issues
  const XLSX = await import('xlsx')

  const visibleColumns = table.getVisibleLeafColumns()
  const rows = table.getRowModel().rows

  // Prepare data for export
  const exportData = rows.map((row: any) => {
    const rowData: any = {}
    visibleColumns.forEach((column: any) => {
      const cell = row.getVisibleCells().find((cell: any) => cell.column.id === column.id)
      if (cell) {
        // Get the raw value or rendered content
        const value = cell.getValue()
        rowData[column.id] = value
      }
    })
    return rowData
  })

  // Create workbook
  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `${tableId}-export-${timestamp}.xlsx`

  // Save file
  XLSX.writeFile(wb, filename)
}

// Default export for lazy loading
export default { exportTableToExcel }
