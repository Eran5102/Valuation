import { useState, useCallback } from 'react'
import { sections } from '../constants'

export function useSectionNavigation() {
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'required' | 'incomplete'>('all')

  // Toggle section expansion
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    )
  }, [])

  // Scroll to section
  const scrollToSection = useCallback(
    (sectionId: string) => {
      const element = document.getElementById(`section-${sectionId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setActiveSection(sectionId)
        if (!expandedSections.includes(sectionId)) {
          toggleSection(sectionId)
        }
        setTimeout(() => setActiveSection(null), 2000)
      }
    },
    [expandedSections, toggleSection]
  )

  // Filter sections and fields based on search and filter
  const getFilteredSections = useCallback(
    (assumptions: Record<string, any>) => {
      return sections
        .map((section) => {
          let filteredFields = section.fields

          // Apply search filter
          if (searchQuery) {
            filteredFields = filteredFields.filter(
              (field) =>
                field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                field.id.toLowerCase().includes(searchQuery.toLowerCase())
            )
          }

          // Apply status filter
          if (filterStatus === 'required') {
            filteredFields = filteredFields.filter((field) => field.required)
          } else if (filterStatus === 'incomplete') {
            filteredFields = filteredFields.filter(
              (field) => !assumptions[`${section.id}.${field.id}`] && field.required
            )
          }

          return { ...section, fields: filteredFields }
        })
        .filter((section) => section.id === 'methodology' || section.fields.length > 0)
    },
    [searchQuery, filterStatus]
  )

  // Calculate completion stats
  const getCompletionStats = useCallback((assumptions: Record<string, any>) => {
    let totalFields = 0
    let completedFields = 0
    let requiredFields = 0
    let requiredCompleted = 0

    sections.forEach((section) => {
      section.fields.forEach((field) => {
        totalFields++
        const value = assumptions[`${section.id}.${field.id}`]
        if (value) completedFields++
        if (field.required) {
          requiredFields++
          if (value) requiredCompleted++
        }
      })
    })

    return {
      totalFields,
      completedFields,
      requiredFields,
      requiredCompleted,
      completionPercentage: totalFields > 0 ? (completedFields / totalFields) * 100 : 0,
      requiredPercentage: requiredFields > 0 ? (requiredCompleted / requiredFields) * 100 : 0,
    }
  }, [])

  return {
    expandedSections,
    activeSection,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    toggleSection,
    scrollToSection,
    getFilteredSections,
    getCompletionStats,
  }
}