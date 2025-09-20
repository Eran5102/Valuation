import { NotFoundError } from '@/components/ui/error-patterns'

export default function NotFound() {
  return (
    <NotFoundError
      itemType="Page"
      showHomeButton={true}
    />
  )
}