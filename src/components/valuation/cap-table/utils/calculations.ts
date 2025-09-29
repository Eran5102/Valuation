import { ShareClass, CapTableTotals } from '../types'

export function calculateCapTableTotals(shareClasses: ShareClass[]): CapTableTotals {
  return shareClasses.reduce(
    (acc, shareClass) => {
      const shares = shareClass.sharesOutstanding || 0
      const price = shareClass.pricePerShare || 0
      const lpMultiple = shareClass.lpMultiple || 1
      const dividendsRate = shareClass.dividendsRate || 0

      const invested = shares * price
      const lp = shareClass.shareType === 'preferred' ? invested * lpMultiple : 0
      const dividends = shareClass.dividendsDeclared ? invested * (dividendsRate / 100) : 0

      return {
        totalShares: acc.totalShares + shares,
        totalInvested: acc.totalInvested + invested,
        totalLP: acc.totalLP + lp,
        totalDividends: acc.totalDividends + dividends,
      }
    },
    {
      totalShares: 0,
      totalInvested: 0,
      totalLP: 0,
      totalDividends: 0,
    }
  )
}
