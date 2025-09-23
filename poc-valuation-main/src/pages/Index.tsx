import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const Index = () => {
  const { isAuthenticated } = useAuth()

  // If authenticated, this will be rendered within AppLayout via App.tsx routes
  // If not, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  // This content will be wrapped in AppLayout when rendered via the route in App.tsx
  return <Navigate to="/" />
}

export default Index
