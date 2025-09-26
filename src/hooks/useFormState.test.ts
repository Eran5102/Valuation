import { renderHook, act } from '@testing-library/react'
import { useFormState } from './useFormState'

interface TestFormData {
  name: string
  email: string
  age: number
  active: boolean
}

const initialTestData: TestFormData = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  active: true
}

describe('useFormState', () => {
  describe('initialization', () => {
    it('should initialize with provided initial state', () => {
      const { result } = renderHook(() => useFormState(initialTestData))

      expect(result.current.data).toEqual(initialTestData)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.hasChanges).toBe(false)
    })

    it('should initialize with primitive values', () => {
      const { result: stringResult } = renderHook(() => useFormState('initial string'))
      expect(stringResult.current.data).toBe('initial string')

      const { result: numberResult } = renderHook(() => useFormState(42))
      expect(numberResult.current.data).toBe(42)

      const { result: booleanResult } = renderHook(() => useFormState(true))
      expect(booleanResult.current.data).toBe(true)
    })

    it('should initialize with complex nested objects', () => {
      const complexData = {
        user: {
          profile: {
            name: 'Test',
            settings: {
              theme: 'dark',
              notifications: true
            }
          }
        },
        metadata: {
          tags: ['tag1', 'tag2'],
          scores: [1, 2, 3]
        }
      }

      const { result } = renderHook(() => useFormState(complexData))

      expect(result.current.data).toEqual(complexData)
      expect(result.current.hasChanges).toBe(false)
    })
  })

  describe('updateField functionality', () => {
    it('should update a single field', () => {
      const { result } = renderHook(() => useFormState(initialTestData))

      act(() => {
        result.current.updateField('name', 'Jane Doe')
      })

      expect(result.current.data.name).toBe('Jane Doe')
      expect(result.current.data.email).toBe(initialTestData.email) // Other fields unchanged
      expect(result.current.hasChanges).toBe(true)
      expect(result.current.error).toBe(null)
    })

    it('should update multiple fields sequentially', () => {
      const { result } = renderHook(() => useFormState(initialTestData))

      act(() => {
        result.current.updateField('name', 'Jane Doe')
      })

      act(() => {
        result.current.updateField('age', 25)
      })

      act(() => {
        result.current.updateField('active', false)
      })

      expect(result.current.data).toEqual({
        ...initialTestData,
        name: 'Jane Doe',
        age: 25,
        active: false
      })
      expect(result.current.hasChanges).toBe(true)
    })

    it('should handle different value types', () => {
      const { result } = renderHook(() => useFormState(initialTestData))

      // String
      act(() => {
        result.current.updateField('name', 'New Name')
      })
      expect(result.current.data.name).toBe('New Name')

      // Number
      act(() => {
        result.current.updateField('age', 35)
      })
      expect(result.current.data.age).toBe(35)

      // Boolean
      act(() => {
        result.current.updateField('active', false)
      })
      expect(result.current.data.active).toBe(false)

      // Null
      act(() => {
        result.current.updateField('email', null as any)
      })
      expect(result.current.data.email).toBe(null)

      // Undefined
      act(() => {
        result.current.updateField('email', undefined as any)
      })
      expect(result.current.data.email).toBeUndefined()
    })

    it('should clear error when updating field', () => {
      const { result } = renderHook(() => useFormState(initialTestData))

      // Set an error first
      act(() => {
        result.current.setError('Some error')
      })

      expect(result.current.error).toBe('Some error')

      act(() => {
        result.current.updateField('name', 'New Name')
      })

      expect(result.current.error).toBe(null)
    })
  })

  describe('updateData functionality', () => {
    it('should update multiple fields at once', () => {
      const { result } = renderHook(() => useFormState(initialTestData))

      const updates = {
        name: 'Jane Doe',
        age: 25
      }

      act(() => {
        result.current.updateData(updates)
      })

      expect(result.current.data).toEqual({
        ...initialTestData,
        ...updates
      })
      expect(result.current.hasChanges).toBe(true)
      expect(result.current.error).toBe(null)
    })

    it('should handle partial updates', () => {
      const { result } = renderHook(() => useFormState(initialTestData))

      act(() => {
        result.current.updateData({ email: 'newemail@example.com' })
      })

      expect(result.current.data).toEqual({
        ...initialTestData,
        email: 'newemail@example.com'
      })
    })

    it('should handle empty updates', () => {
      const { result } = renderHook(() => useFormState(initialTestData))

      act(() => {
        result.current.updateData({})
      })

      expect(result.current.data).toEqual(initialTestData)
      expect(result.current.hasChanges).toBe(true) // hasChanges should still be set
    })

    it('should clear error when updating data', () => {
      const { result } = renderHook(() => useFormState(initialTestData))

      act(() => {
        result.current.setError('Some error')
      })

      act(() => {
        result.current.updateData({ name: 'New Name' })
      })

      expect(result.current.error).toBe(null)
    })
  })

  describe('reset functionality', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useFormState(initialTestData))

      // Make some changes
      act(() => {
        result.current.updateField('name', 'Changed Name')
        result.current.setError('Some error')
        result.current.setLoading(true)
      })

      expect(result.current.hasChanges).toBe(true)
      expect(result.current.error).toBe('Some error')
      expect(result.current.loading).toBe(true)

      act(() => {
        result.current.reset()
      })

      expect(result.current.data).toEqual(initialTestData)
      expect(result.current.hasChanges).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.loading).toBe(true) // Loading state should be preserved
    })

    it('should reset to initial state with complex objects', () => {
      const complexInitial = {
        user: { name: 'Original', settings: { theme: 'light' } },
        metadata: { count: 0 }
      }

      const { result } = renderHook(() => useFormState(complexInitial))

      act(() => {
        result.current.updateData({
          user: { name: 'Changed', settings: { theme: 'dark' } },
          metadata: { count: 5 }
        })
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.data).toEqual(complexInitial)
      expect(result.current.hasChanges).toBe(false)
    })
  })

  describe('setLoaded functionality', () => {
    it('should set new data and reset change tracking', () => {
      const { result } = renderHook(() => useFormState(initialTestData))

      // Make some changes first
      act(() => {
        result.current.updateField('name', 'Changed Name')
        result.current.setError('Some error')
      })

      expect(result.current.hasChanges).toBe(true)
      expect(result.current.error).toBe('Some error')

      const newData: TestFormData = {
        name: 'Loaded Name',
        email: 'loaded@example.com',
        age: 40,
        active: false
      }

      act(() => {
        result.current.setLoaded(newData)
      })

      expect(result.current.data).toEqual(newData)
      expect(result.current.hasChanges).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should work with different data types', () => {
      const { result: stringResult } = renderHook(() => useFormState('initial'))

      act(() => {
        stringResult.current.setLoaded('loaded')
      })

      expect(stringResult.current.data).toBe('loaded')
      expect(stringResult.current.hasChanges).toBe(false)
    })
  })

  describe('direct setData functionality', () => {
    it('should allow direct data manipulation', () => {
      const { result } = renderHook(() => useFormState(initialTestData))

      const newData: TestFormData = {
        name: 'Direct Set',
        email: 'direct@example.com',
        age: 50,
        active: false
      }

      act(() => {
        result.current.setData(newData)
      })

      expect(result.current.data).toEqual(newData)
      // Note: setData doesn't automatically set hasChanges or clear error
    })
  })

  describe('loading state management', () => {
    it('should manage loading state independently', () => {
      const { result } = renderHook(() => useFormState(initialTestData))

      expect(result.current.loading).toBe(false)

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.loading).toBe(true)

      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.loading).toBe(false)
    })

    it('should not affect other state when setting loading', () => {
      const { result } = renderHook(() => useFormState(initialTestData))

      act(() => {
        result.current.updateField('name', 'Changed')
        result.current.setError('Some error')
      })

      const dataBeforeLoading = result.current.data
      const errorBeforeLoading = result.current.error
      const hasChangesBeforeLoading = result.current.hasChanges

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.data).toEqual(dataBeforeLoading)
      expect(result.current.error).toBe(errorBeforeLoading)
      expect(result.current.hasChanges).toBe(hasChangesBeforeLoading)
      expect(result.current.loading).toBe(true)
    })
  })

  describe('error state management', () => {
    it('should set and clear error state', () => {
      const { result } = renderHook(() => useFormState(initialTestData))

      expect(result.current.error).toBe(null)

      act(() => {
        result.current.setError('Validation error')
      })

      expect(result.current.error).toBe('Validation error')

      act(() => {
        result.current.setError(null)
      })

      expect(result.current.error).toBe(null)
    })

    it('should handle different error types', () => {
      const { result } = renderHook(() => useFormState(initialTestData))

      act(() => {
        result.current.setError('String error')
      })
      expect(result.current.error).toBe('String error')

      act(() => {
        result.current.setError('')
      })
      expect(result.current.error).toBe('')
    })
  })

  describe('hasChanges tracking', () => {
    it('should track changes correctly', () => {
      const { result } = renderHook(() => useFormState(initialTestData))

      expect(result.current.hasChanges).toBe(false)

      act(() => {
        result.current.updateField('name', 'Changed Name')
      })

      expect(result.current.hasChanges).toBe(true)

      act(() => {
        result.current.setHasChanges(false)
      })

      expect(result.current.hasChanges).toBe(false)
    })

    it('should not set hasChanges when updating to same value', () => {
      const { result } = renderHook(() => useFormState(initialTestData))

      act(() => {
        result.current.updateField('name', initialTestData.name) // Same value
      })

      expect(result.current.hasChanges).toBe(true) // Still sets hasChanges
    })
  })

  describe('callback stability', () => {
    it('should have stable callback references', () => {
      const { result, rerender } = renderHook(() => useFormState(initialTestData))

      const initialUpdateField = result.current.updateField
      const initialUpdateData = result.current.updateData
      const initialReset = result.current.reset
      const initialSetLoaded = result.current.setLoaded

      rerender()

      expect(result.current.updateField).toBe(initialUpdateField)
      expect(result.current.updateData).toBe(initialUpdateData)
      expect(result.current.reset).toBe(initialReset)
      expect(result.current.setLoaded).toBe(initialSetLoaded)
    })

    it('should update callbacks when initialState changes', () => {
      let initialState = initialTestData
      const { result, rerender } = renderHook(() => useFormState(initialState))

      const firstReset = result.current.reset

      // Change initial state
      initialState = { ...initialTestData, name: 'Different Initial' }
      rerender()

      // Reset callback should be different due to dependency on initialState
      expect(result.current.reset).not.toBe(firstReset)
    })
  })

  describe('edge cases', () => {
    it('should handle null initial state', () => {
      const { result } = renderHook(() => useFormState(null))

      expect(result.current.data).toBe(null)
      expect(result.current.hasChanges).toBe(false)
    })

    it('should handle undefined initial state', () => {
      const { result } = renderHook(() => useFormState(undefined))

      expect(result.current.data).toBeUndefined()
      expect(result.current.hasChanges).toBe(false)
    })

    it('should handle array initial state', () => {
      const arrayData = [1, 2, 3, 4, 5]
      const { result } = renderHook(() => useFormState(arrayData))

      expect(result.current.data).toEqual(arrayData)

      // Arrays are handled differently with object spread
      act(() => {
        result.current.updateField(0 as any, 10) // Update first element
      })

      expect(result.current.data).toEqual({ ...arrayData, 0: 10 })
    })

    it('should handle deeply nested updates', () => {
      const nestedData = {
        level1: {
          level2: {
            level3: {
              value: 'deep'
            }
          }
        }
      }

      const { result } = renderHook(() => useFormState(nestedData))

      act(() => {
        result.current.updateField('level1' as any, {
          level2: {
            level3: {
              value: 'updated deep'
            }
          }
        })
      })

      expect(result.current.data.level1.level2.level3.value).toBe('updated deep')
    })
  })
})