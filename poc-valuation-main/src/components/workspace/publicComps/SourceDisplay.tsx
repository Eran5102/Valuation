import React from 'react'

interface SourceDisplayProps {
  source: string
}

export function SourceDisplay({ source }: SourceDisplayProps) {
  // Style the source text based on the source type
  if (source.includes('Manual')) {
    return <span className="text-amber-600">{source}</span>
  } else if (source.includes('Auto')) {
    return <span className="text-blue-600">{source}</span>
  }
  return <span>{source}</span>
}
