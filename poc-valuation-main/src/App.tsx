import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProjectSettingsProvider } from './contexts/ProjectSettingsContext'
import { ValuationDataProvider } from './contexts/ValuationDataContext'
import { MethodologyProvider } from './contexts/MethodologyContext'

// Layout
import AppLayout from '@/components/layout/AppLayout'

// Auth Pages
import Login from '@/pages/Login'
import Register from '@/pages/Register'

// Main Pages
import Dashboard from '@/pages/Dashboard'
import NotFound from '@/pages/NotFound'
import Clients from '@/pages/Clients'
import ClientDetails from '@/pages/ClientDetails'
import Companies from '@/pages/Companies'
import CompanyDetails from '@/pages/CompanyDetails'
import Projects from '@/pages/Projects'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'
import ValuationWorkspace from '@/pages/workspace/ValuationWorkspace'
import ReportGenerator from '@/pages/workspace/ReportGenerator'

const queryClient = new QueryClient()

function App() {
  // Update page title
  document.title = 'Value8'

  return (
    <ProjectSettingsProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MethodologyProvider>
            <ValuationDataProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    {/* Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Routes */}
                    <Route
                      path="/"
                      element={
                        <AppLayout>
                          <Dashboard />
                        </AppLayout>
                      }
                    />
                    <Route
                      path="/clients"
                      element={
                        <AppLayout>
                          <Clients />
                        </AppLayout>
                      }
                    />
                    <Route
                      path="/clients/:clientId"
                      element={
                        <AppLayout>
                          <ClientDetails />
                        </AppLayout>
                      }
                    />
                    <Route
                      path="/companies"
                      element={
                        <AppLayout>
                          <Companies />
                        </AppLayout>
                      }
                    />
                    <Route
                      path="/companies/:companyId"
                      element={
                        <AppLayout>
                          <CompanyDetails />
                        </AppLayout>
                      }
                    />
                    <Route
                      path="/projects"
                      element={
                        <AppLayout>
                          <Projects />
                        </AppLayout>
                      }
                    />
                    <Route
                      path="/reports"
                      element={
                        <AppLayout>
                          <Reports />
                        </AppLayout>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <AppLayout>
                          <Settings />
                        </AppLayout>
                      }
                    />

                    {/* Workspace Routes */}
                    <Route
                      path="/workspace/:projectId/*"
                      element={
                        <AppLayout>
                          <ValuationWorkspace />
                        </AppLayout>
                      }
                    />

                    <Route
                      path="/wacc-calculator"
                      element={
                        <AppLayout>
                          <div className="text-2xl font-bold">WACC Calculator</div>
                        </AppLayout>
                      }
                    />

                    {/* Catch-all Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </ValuationDataProvider>
          </MethodologyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ProjectSettingsProvider>
  )
}

export default App
