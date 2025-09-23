import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export type Company = {
  id: string
  name: string
  legalName?: string
  ticker?: string
  clientId?: string
  clientName?: string
  industry?: string
  location?: string
  geography?: string
  currency?: string
  fyEnd?: string
  fyEndMonth?: string
  fyEndDay?: string
  description?: string
  notes?: string
  naicsCode?: string
  dateAdded: string
  comparables?: Array<{ ticker: string; name: string }>
}

export type Client = {
  id: string
  name: string
  companies: string[] // Array of company IDs
}

export function useCompanyManagement() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load data from localStorage
  useEffect(() => {
    setIsLoading(true)

    // Load companies
    const storedCompanies = localStorage.getItem('companiesData')
    if (storedCompanies) {
      try {
        setCompanies(JSON.parse(storedCompanies))
      } catch (error) {
        console.error('Error loading companies data:', error)
      }
    } else {
      // Set default mock companies if none exist
      const defaultCompanies = [
        {
          id: '1',
          name: 'Tech Solutions Inc',
          legalName: 'Tech Solutions Incorporated',
          ticker: 'TECH', // Added ticker
          clientId: '1',
          clientName: 'Acme Corporation',
          industry: 'Technology',
          location: 'San Francisco',
          geography: 'United States',
          currency: 'USD',
          fyEnd: '12-31',
          fyEndMonth: '12',
          fyEndDay: '31',
          dateAdded: '2024-04-15',
          description: 'A leading technology solutions provider',
        },
        {
          id: '2',
          name: 'Global Manufacturing Ltd',
          legalName: 'Global Manufacturing Limited',
          ticker: 'GML', // Added ticker
          clientId: '2',
          clientName: 'Beta Industries',
          industry: 'Manufacturing',
          location: 'Chicago',
          geography: 'United States',
          currency: 'USD',
          fyEnd: '06-30',
          fyEndMonth: '06',
          fyEndDay: '30',
          dateAdded: '2024-04-10',
          description: 'Industrial manufacturing company',
        },
      ]
      setCompanies(defaultCompanies)
      localStorage.setItem('companiesData', JSON.stringify(defaultCompanies))
    }

    // Load clients
    const storedClients = localStorage.getItem('clientsData')
    if (storedClients) {
      try {
        setClients(JSON.parse(storedClients))
      } catch (error) {
        console.error('Error loading clients data:', error)
      }
    } else {
      // Set default mock clients if none exist
      const defaultClients = [
        { id: '1', name: 'Acme Corporation', companies: ['1'] },
        { id: '2', name: 'Beta Industries', companies: ['2'] },
      ]
      setClients(defaultClients)
      localStorage.setItem('clientsData', JSON.stringify(defaultClients))
    }

    setIsLoading(false)
  }, [])

  // Add or update a company
  const saveCompany = (companyData: Partial<Company>) => {
    setCompanies((prevCompanies) => {
      const now = new Date().toISOString()
      let updatedCompanies: Company[]

      // If this is an update to an existing company
      if (companyData.id) {
        updatedCompanies = prevCompanies.map((company) =>
          company.id === companyData.id
            ? { ...company, ...companyData, lastModified: now }
            : company
        )
      } else {
        // This is a new company
        const newId = String(Date.now())
        const newCompany = {
          id: newId,
          name: companyData.name || 'New Company',
          dateAdded: now,
          lastModified: now,
          ...companyData,
        } as Company

        updatedCompanies = [...prevCompanies, newCompany]

        // If this company belongs to a client, update the client too
        if (companyData.clientId) {
          updateClientCompanyAssociation(companyData.clientId, newId)
        }
      }

      // Save to localStorage
      localStorage.setItem('companiesData', JSON.stringify(updatedCompanies))

      // Update financial data with company name if it exists
      updateCompanyNameInFinancialData(companyData)

      return updatedCompanies
    })

    toast.success(companyData.id ? 'Company updated successfully' : 'Company created successfully')

    return true
  }

  // Update client-company association
  const updateClientCompanyAssociation = (clientId: string, companyId: string) => {
    setClients((prevClients) => {
      const updatedClients = prevClients.map((client) => {
        if (client.id === clientId) {
          // Add company to client if not already there
          if (!client.companies.includes(companyId)) {
            return {
              ...client,
              companies: [...client.companies, companyId],
            }
          }
        }
        return client
      })

      localStorage.setItem('clientsData', JSON.stringify(updatedClients))
      return updatedClients
    })
  }

  // Update company name in financial data if it exists
  const updateCompanyNameInFinancialData = (companyData: Partial<Company>) => {
    if (!companyData.id || !companyData.legalName) return

    const financialDataStr = localStorage.getItem('companyFinancialData')
    if (financialDataStr) {
      try {
        const financialData = JSON.parse(financialDataStr)
        if (financialData.companyId === companyData.id) {
          financialData.companyName = companyData.legalName
          localStorage.setItem('companyFinancialData', JSON.stringify(financialData))

          // Dispatch event to notify other components
          window.dispatchEvent(
            new StorageEvent('storage', {
              key: 'companyFinancialData',
              newValue: JSON.stringify(financialData),
            })
          )
        }
      } catch (error) {
        console.error('Error updating company name in financial data:', error)
      }
    }
  }

  // Get company by ID
  const getCompanyById = (id: string): Company | undefined => {
    return companies.find((company) => company.id === id)
  }

  // Get client by ID
  const getClientById = (id: string): Client | undefined => {
    return clients.find((client) => client.id === id)
  }

  // Get companies by client ID
  const getCompaniesByClientId = (clientId: string): Company[] => {
    return companies.filter((company) => company.clientId === clientId)
  }

  return {
    companies,
    clients,
    isLoading,
    saveCompany,
    getCompanyById,
    getClientById,
    getCompaniesByClientId,
  }
}
