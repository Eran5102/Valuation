import '@testing-library/jest-dom'

// Global type extensions for Jest DOM
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveTextContent(text: string | RegExp | number): R
      toHaveClass(className: string): R
      toHaveAttribute(name: string, value?: string): R
      toHaveStyle(css: Record<string, any> | string): R
      toBeVisible(): R
      toBeEnabled(): R
      toBeDisabled(): R
      toHaveValue(value: string | number | string[]): R
      toBeChecked(): R
      toHaveFocus(): R
      toBeEmpty(): R
      toBeInvalid(): R
      toBeValid(): R
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R
      toBePartiallyChecked(): R
      toHaveDescription(text?: string | RegExp): R
      toHaveErrorMessage(text?: string | RegExp): R
    }
  }
}

// Export to make this a module
export {}