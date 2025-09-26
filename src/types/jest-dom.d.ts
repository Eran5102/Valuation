import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveTextContent(text: string | RegExp): R
      toHaveClass(className: string): R
      toHaveAttribute(name: string, value?: string): R
      toHaveStyle(css: Record<string, any> | string): R
      toBeVisible(): R
      toBeEnabled(): R
      toBeDisabled(): R
      toHaveValue(value: string | number): R
      toBeChecked(): R
      toHaveFocus(): R
      toBeEmpty(): R
      toBeInvalid(): R
      toBeValid(): R
    }
  }
}