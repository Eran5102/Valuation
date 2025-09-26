import { ShareClass, CapTableTotals } from '../types'

export function calculateCapTableTotals(shareClasses: ShareClass[]): CapTableTotals {
  return {
    totalShares: shareClasses.reduce((sum, sc) => sum + sc.sharesOutstanding, 0),
    totalInvested: shareClasses.reduce((sum, sc) => sum + (sc.amountInvested || 0), 0),
    totalLP: shareClasses.reduce((sum, sc) => sum + (sc.totalLP || 0), 0),
    totalDividends: shareClasses.reduce((sum, sc) => sum + (sc.totalDividends || 0), 0),
  }
}