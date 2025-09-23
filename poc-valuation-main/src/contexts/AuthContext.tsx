import React, { createContext, useContext, useState, useEffect } from 'react'

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  organizationType: 'individual' | 'firm'
  companyName?: string
  jobTitle?: string
  avatarUrl?: string
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (
    name: string,
    email: string,
    password: string,
    organizationType: 'individual' | 'firm'
  ) => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock users for demo
const MOCK_USERS = [
  {
    id: '1',
    email: 'demo@value8.ai',
    name: 'Demo User',
    password: 'password123', // In a real app, this would be hashed
    role: 'admin' as const,
    organizationType: 'firm' as const,
  },
  {
    id: '2',
    email: 'individual@valuwise.pro',
    name: 'Individual User',
    password: 'password123',
    role: 'user' as const,
    organizationType: 'individual' as const,
  },
]

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for existing session in localStorage
    const savedUser = localStorage.getItem('valuwise_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        console.error('Failed to parse saved user')
        localStorage.removeItem('valuwise_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setError(null)
    setIsLoading(true)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Mock authentication
      const foundUser = MOCK_USERS.find((u) => u.email === email && u.password === password)
      if (foundUser) {
        const { password, ...userWithoutPassword } = foundUser
        setUser(userWithoutPassword)
        localStorage.setItem('valuwise_user', JSON.stringify(userWithoutPassword))
      } else {
        throw new Error('Invalid email or password')
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('An unexpected error occurred')
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (
    name: string,
    email: string,
    password: string,
    organizationType: 'individual' | 'firm'
  ) => {
    setError(null)
    setIsLoading(true)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Check if email is already used
      if (MOCK_USERS.some((u) => u.email === email)) {
        throw new Error('Email already in use')
      }

      // In a real app, we would send this to an API and save in a database
      const newUser = {
        id: Math.random().toString(36).substring(2, 11),
        email,
        name,
        role: 'user' as const,
        organizationType,
      }

      setUser(newUser)
      localStorage.setItem('valuwise_user', JSON.stringify(newUser))
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('An unexpected error occurred')
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('valuwise_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
