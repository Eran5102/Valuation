const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')

const sourceDir = path.join(__dirname, '..', 'volatility')
const targetDir = path.join(__dirname, '..', 'src', 'data', 'damodaran-volatility')

// Mapping of file names to market identifiers
const fileToMarketMap = {
  'optvar (1).xls': 'us',
  'optvarEurope (1).xls': 'europe',
  'optvarGlobal (3).xls': 'global',
  'optvarChina (1).xls': 'china',
  'optvarIndia (1).xls': 'india',
  'optvarJapan (1).xls': 'japan',
  'optvaremerg (1).xls': 'emerging',
  'optvarRest (2).xls': 'rest',
}

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

function processExcelFile(filePath, marketName) {
  try {
    console.log(`Processing ${marketName} market data from ${path.basename(filePath)}...`)

    // Read the Excel file
    const workbook = XLSX.readFile(filePath)

    // Look for "Industry Averages" sheet first, fallback to first sheet
    let sheetName =
      workbook.SheetNames.find((name) => name.toLowerCase().includes('industry')) ||
      workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      raw: false,
    })

    // Find header row (looking for 'Industry Name' or similar)
    let headerRowIndex = -1
    for (let i = 0; i < Math.min(30, data.length); i++) {
      const row = data[i]
      if (
        row &&
        row.some(
          (cell) => cell && typeof cell === 'string' && cell.toLowerCase() === 'industry name'
        )
      ) {
        headerRowIndex = i
        break
      }
    }

    if (headerRowIndex === -1) {
      console.error(`Could not find header row in ${marketName} file`)
      return []
    }

    const headers = data[headerRowIndex].map((h) => (h ? String(h).trim() : ''))
    console.log(`Found headers at row ${headerRowIndex}:`, headers)

    // Find relevant column indices
    const industryCol = headers.findIndex((h) => h.toLowerCase() === 'industry name')
    const firmsCol = headers.findIndex((h) => h.toLowerCase().includes('number of firms'))

    // Look for both equity and firm volatility columns
    const equityStdDevCol = headers.findIndex((h) =>
      h.toLowerCase().includes('std deviation in equity')
    )
    const firmStdDevCol = headers.findIndex((h) =>
      h.toLowerCase().includes('std deviation in firm')
    )

    if (industryCol === -1) {
      console.error(`Could not find industry column in ${marketName} file`)
      return []
    }

    // Process data rows
    const processedData = []
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i]
      if (!row || !row[industryCol]) continue

      const industry = String(row[industryCol]).trim()
      if (
        !industry ||
        industry.toLowerCase().includes('total') ||
        industry.toLowerCase().includes('average')
      )
        continue

      const entry = {
        industry,
        numberOfFirms: firmsCol >= 0 ? parseInt(row[firmsCol]) || 0 : 0,
        standardDeviation: 0,
        region: marketName.toUpperCase(),
      }

      // Use equity standard deviation as the primary volatility measure
      // The value is already in decimal form (0.67 = 67%), so multiply by 100 to get percentage
      if (equityStdDevCol >= 0 && row[equityStdDevCol]) {
        const value = parseFloat(row[equityStdDevCol])
        // Round to 2 decimal places for cleaner data
        entry.standardDeviation = Math.round(value * 10000) / 100
      } else if (firmStdDevCol >= 0 && row[firmStdDevCol]) {
        // Fallback to firm standard deviation if equity not available
        const value = parseFloat(row[firmStdDevCol])
        entry.standardDeviation = Math.round(value * 10000) / 100
      }

      // Only add if we have valid data
      if (entry.standardDeviation > 0) {
        processedData.push(entry)
      }
    }

    console.log(`Processed ${processedData.length} industries for ${marketName} market`)
    return processedData
  } catch (error) {
    console.error(`Error processing ${marketName} file:`, error)
    return []
  }
}

// Process all files
console.log('Starting Damodaran data processing...\n')

for (const [fileName, marketName] of Object.entries(fileToMarketMap)) {
  const filePath = path.join(sourceDir, fileName)

  if (fs.existsSync(filePath)) {
    const data = processExcelFile(filePath, marketName)

    if (data.length > 0) {
      // Save to JSON file
      const outputPath = path.join(targetDir, `${marketName}-market.json`)
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))
      console.log(`Saved ${marketName} market data to ${outputPath}\n`)
    }
  } else {
    console.warn(`File not found: ${fileName}`)
  }
}

// Create an index file with all markets
const indexContent = `// Auto-generated index of Damodaran volatility data
${Object.values(fileToMarketMap)
  .map((market) => `export { default as ${market}Market } from './${market}-market.json'`)
  .join('\n')}

export const availableMarkets = ${JSON.stringify(Object.values(fileToMarketMap))}
`

fs.writeFileSync(path.join(targetDir, 'index.ts'), indexContent)

console.log('Damodaran data processing complete!')
console.log(`Output directory: ${targetDir}`)
