import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export interface CompanyData {
  ticker: string
  name: string
  date: string
  revenue: number
  ebitda: number
  ebit: number
  netIncome: number
  marketCap: number
  netDebt: number
  enterpriseValue: number
  evToRevenue: number
  evToEbitda: number
  evToEbit: number
  peRatio: number
  pToBookValue: number
  revenueGrowth: number
  ebitdaMargin: number
  source: string
  isEdited?: boolean
  includeInStats: boolean
}

export interface PeerGroup {
  id: string
  name: string
  tickers: string[]
}

export function usePublicCompsData(projectId: string | undefined) {
  const [compsData, setCompsData] = useState<CompanyData[]>([])
  const [peerGroups, setPeerGroups] = useState<PeerGroup[]>([])

  const fetchSimilarPeers = async () => {
    console.log(`Fetching similar peers for project ${projectId}...`)
    const similarPeers = ['MSFT', 'AAPL', 'GOOG', 'AMZN']
    const peerPromises = similarPeers.map(async (ticker) => {
      return {
        ticker: ticker,
        name: `${ticker} Corporation`,
        date: '2025-04-01',
        revenue: 100000 + Math.floor(Math.random() * 400000),
        ebitda: 25000 + Math.floor(Math.random() * 100000),
        ebit: 20000 + Math.floor(Math.random() * 80000),
        netIncome: 15000 + Math.floor(Math.random() * 70000),
        marketCap: 200000 + Math.floor(Math.random() * 800000),
        netDebt: 30000 + Math.floor(Math.random() * 100000),
        enterpriseValue: 230000 + Math.floor(Math.random() * 900000),
        evToRevenue: 1 + Math.random() * 7,
        evToEbitda: 8 + Math.random() * 20,
        evToEbit: 10 + Math.random() * 25,
        peRatio: 12 + Math.random() * 30,
        pToBookValue: 1 + Math.random() * 4,
        revenueGrowth: 5 + Math.random() * 25,
        ebitdaMargin: 15 + Math.random() * 40,
        source: 'Auto-populated',
        includeInStats: true,
      }
    })
    const peers = await Promise.all(peerPromises)
    return peers
  }

  useEffect(() => {
    const fetchInitialPeers = async () => {
      try {
        const peers = await fetchSimilarPeers()
        setCompsData(peers)
        setPeerGroups([
          {
            id: 'tech-leaders',
            name: 'Tech Leaders',
            tickers: ['MSFT', 'AAPL', 'GOOG'],
          },
          {
            id: 'saas-companies',
            name: 'SaaS Companies',
            tickers: ['CRM', 'WDAY', 'NOW'],
          },
        ])
        toast.success('Pre-populated peers from company setup', {
          description: `Added ${peers.length} peers from similar companies list.`,
        })
      } catch (error) {
        console.error('Failed to fetch initial peers:', error)
        toast.error('Failed to load initial peers')
      }
    }

    fetchInitialPeers()
  }, [projectId])

  const handleAddComp = (newComp: CompanyData) => {
    if (compsData.some((comp) => comp.ticker === newComp.ticker)) {
      toast.error('Company already exists in the table')
      return
    }

    setCompsData([...compsData, newComp])
    toast.success(`Added ${newComp.ticker}`, {
      description: `${newComp.name} has been added to the comparables table.`,
    })
  }

  const handleRemoveComp = (ticker: string) => {
    setCompsData(compsData.filter((comp) => comp.ticker !== ticker))
    toast.info(`Removed ${ticker}`, {
      description: `Company has been removed from the comparables table.`,
    })
  }

  const handleUpdateComp = (updatedComp: CompanyData) => {
    setCompsData(compsData.map((comp) => (comp.ticker === updatedComp.ticker ? updatedComp : comp)))
  }

  const handleToggleIncludeInStats = (ticker: string, include: boolean) => {
    setCompsData(
      compsData.map((comp) =>
        comp.ticker === ticker ? { ...comp, includeInStats: include } : comp
      )
    )
  }

  const handleSavePeerGroup = (name: string, tickers: string[]) => {
    const newGroup: PeerGroup = {
      id: `group-${Date.now()}`,
      name,
      tickers,
    }

    setPeerGroups([...peerGroups, newGroup])
    toast.success(`Saved peer group: ${name}`, {
      description: `This peer group contains ${tickers.length} companies.`,
    })
  }

  const handleLoadPeerGroup = (groupId: string) => {
    const group = peerGroups.find((g) => g.id === groupId)
    if (!group) return

    setCompsData([])

    const loadPromises = group.tickers.map(async (ticker) => {
      return {
        ticker: ticker,
        name: `${ticker} Corporation`,
        date: '2025-04-01',
        revenue: 100000 + Math.floor(Math.random() * 400000),
        ebitda: 25000 + Math.floor(Math.random() * 100000),
        ebit: 20000 + Math.floor(Math.random() * 80000),
        netIncome: 15000 + Math.floor(Math.random() * 70000),
        marketCap: 200000 + Math.floor(Math.random() * 800000),
        netDebt: 30000 + Math.floor(Math.random() * 100000),
        enterpriseValue: 230000 + Math.floor(Math.random() * 900000),
        evToRevenue: 1 + Math.random() * 7,
        evToEbitda: 8 + Math.random() * 20,
        evToEbit: 10 + Math.random() * 25,
        peRatio: 12 + Math.random() * 30,
        pToBookValue: 1 + Math.random() * 4,
        revenueGrowth: 5 + Math.random() * 25,
        ebitdaMargin: 15 + Math.random() * 40,
        source: 'Peer Group',
        includeInStats: true,
      }
    })

    Promise.all(loadPromises).then((loadedComps) => {
      setCompsData(loadedComps)
      toast.success(`Loaded peer group: ${group.name}`, {
        description: `Loaded ${loadedComps.length} companies.`,
      })
    })
  }

  return {
    compsData,
    peerGroups,
    handleAddComp,
    handleRemoveComp,
    handleUpdateComp,
    handleToggleIncludeInStats,
    handleSavePeerGroup,
    handleLoadPeerGroup,
  }
}
