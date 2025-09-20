import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import {
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormCheckbox,
  FormRadioGroup,
  FormDatePicker,
  FormSwitch,
  FormSlider,
  FormFieldGroup,
  FormSection,
  FormActions
} from '../form-components'

describe('FormField', () => {
  it('should render label and children', () => {
    render(
      <FormField label="Username">
        <input type="text" />
      </FormField>
    )
    expect(screen.getByText('Username')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should show required indicator', () => {
    render(
      <FormField label="Email" required>
        <input type="email" />
      </FormField>
    )
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should display error message', () => {
    render(
      <FormField label="Password" error="Password is too short">
        <input type="password" />
      </FormField>
    )
    expect(screen.getByText('Password is too short')).toBeInTheDocument()
  })

  it('should display helper text', () => {
    render(
      <FormField label="Bio" helperText="Tell us about yourself">
        <textarea />
      </FormField>
    )
    expect(screen.getByText('Tell us about yourself')).toBeInTheDocument()
  })
})

describe('FormInput', () => {
  it('should render input with props', () => {
    render(<FormInput label="Name" name="name" placeholder="Enter name" />)

    const input = screen.getByPlaceholderText('Enter name')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('name', 'name')
  })

  it('should handle value changes', async () => {
    const onChange = jest.fn()
    render(<FormInput label="Email" onChange={onChange} />)

    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'test@example.com')

    expect(onChange).toHaveBeenCalled()
  })

  it('should be disabled when specified', () => {
    render(<FormInput label="Disabled" disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('should show error state', () => {
    render(<FormInput label="Username" error="Username taken" />)
    expect(screen.getByText('Username taken')).toBeInTheDocument()
  })
})

describe('FormSelect', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ]

  it('should render select with options', () => {
    render(<FormSelect label="Choose" options={options} />)

    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()

    const optionElements = screen.getAllByRole('option')
    expect(optionElements).toHaveLength(4) // Including placeholder
  })

  it('should handle selection', () => {
    const onChange = jest.fn()
    render(<FormSelect label="Select" options={options} onChange={onChange} />)

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'option2' } })

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ value: 'option2' })
    }))
  })

  it('should show placeholder', () => {
    render(<FormSelect label="Pick" options={options} placeholder="Choose one" />)

    const placeholder = screen.getByText('Choose one')
    expect(placeholder).toBeInTheDocument()
  })

  it('should be disabled when specified', () => {
    render(<FormSelect label="Disabled" options={options} disabled />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })
})

describe('FormTextarea', () => {
  it('should render textarea with props', () => {
    render(
      <FormTextarea
        label="Description"
        rows={5}
        placeholder="Enter description"
      />
    )

    const textarea = screen.getByPlaceholderText('Enter description')
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveAttribute('rows', '5')
  })

  it('should handle text input', async () => {
    const onChange = jest.fn()
    render(<FormTextarea label="Comments" onChange={onChange} />)

    const textarea = screen.getByRole('textbox')
    await userEvent.type(textarea, 'This is a comment')

    expect(onChange).toHaveBeenCalled()
  })

  it('should resize automatically if specified', () => {
    render(<FormTextarea label="Auto resize" autoResize />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass('resize-none')
  })
})

describe('FormCheckbox', () => {
  it('should render checkbox with label', () => {
    render(<FormCheckbox label="Accept terms" />)

    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByText('Accept terms')).toBeInTheDocument()
  })

  it('should handle checked state', () => {
    const onChange = jest.fn()
    render(<FormCheckbox label="Subscribe" onChange={onChange} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('should be disabled when specified', () => {
    render(<FormCheckbox label="Disabled" disabled />)
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })

  it('should handle controlled state', () => {
    const { rerender } = render(<FormCheckbox label="Controlled" checked={false} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()

    rerender(<FormCheckbox label="Controlled" checked={true} />)
    expect(checkbox).toBeChecked()
  })
})

describe('FormRadioGroup', () => {
  const options = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' }
  ]

  it('should render radio buttons', () => {
    render(<FormRadioGroup label="Size" options={options} name="size" />)

    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)

    expect(screen.getByLabelText('Small')).toBeInTheDocument()
    expect(screen.getByLabelText('Medium')).toBeInTheDocument()
    expect(screen.getByLabelText('Large')).toBeInTheDocument()
  })

  it('should handle selection', () => {
    const onChange = jest.fn()
    render(
      <FormRadioGroup
        label="Size"
        options={options}
        name="size"
        onChange={onChange}
      />
    )

    const mediumRadio = screen.getByLabelText('Medium')
    fireEvent.click(mediumRadio)

    expect(onChange).toHaveBeenCalledWith('medium')
  })

  it('should support inline layout', () => {
    render(
      <FormRadioGroup
        label="Layout"
        options={options}
        name="layout"
        inline
      />
    )

    const container = screen.getByRole('radiogroup')
    expect(container).toHaveClass('flex-row')
  })
})

describe('FormSwitch', () => {
  it('should render switch with label', () => {
    render(<FormSwitch label="Enable notifications" />)

    expect(screen.getByRole('switch')).toBeInTheDocument()
    expect(screen.getByText('Enable notifications')).toBeInTheDocument()
  })

  it('should handle toggle', () => {
    const onChange = jest.fn()
    render(<FormSwitch label="Dark mode" onChange={onChange} />)

    const switchButton = screen.getByRole('switch')
    fireEvent.click(switchButton)

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('should be disabled when specified', () => {
    render(<FormSwitch label="Disabled" disabled />)
    expect(screen.getByRole('switch')).toBeDisabled()
  })
})

describe('FormSlider', () => {
  it('should render slider with label', () => {
    render(<FormSlider label="Volume" min={0} max={100} />)

    expect(screen.getByRole('slider')).toBeInTheDocument()
    expect(screen.getByText('Volume')).toBeInTheDocument()
  })

  it('should handle value change', () => {
    const onChange = jest.fn()
    render(
      <FormSlider
        label="Brightness"
        min={0}
        max={100}
        value={50}
        onChange={onChange}
      />
    )

    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '75' } })

    expect(onChange).toHaveBeenCalledWith(75)
  })

  it('should display value', () => {
    render(
      <FormSlider
        label="Progress"
        min={0}
        max={100}
        value={60}
        showValue
      />
    )

    expect(screen.getByText('60')).toBeInTheDocument()
  })

  it('should apply step increment', () => {
    render(
      <FormSlider
        label="Step"
        min={0}
        max={100}
        step={10}
      />
    )

    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('step', '10')
  })
})

describe('FormFieldGroup', () => {
  it('should render fields in a group', () => {
    render(
      <FormFieldGroup>
        <FormInput label="First Name" />
        <FormInput label="Last Name" />
      </FormFieldGroup>
    )

    expect(screen.getByText('First Name')).toBeInTheDocument()
    expect(screen.getByText('Last Name')).toBeInTheDocument()
  })

  it('should apply custom columns', () => {
    const { container } = render(
      <FormFieldGroup columns={3}>
        <FormInput label="Field 1" />
        <FormInput label="Field 2" />
        <FormInput label="Field 3" />
      </FormFieldGroup>
    )

    const group = container.firstChild
    expect(group).toHaveClass('md:grid-cols-3')
  })
})

describe('FormSection', () => {
  it('should render section with title', () => {
    render(
      <FormSection title="Personal Information">
        <FormInput label="Name" />
      </FormSection>
    )

    expect(screen.getByText('Personal Information')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
  })

  it('should render description', () => {
    render(
      <FormSection
        title="Settings"
        description="Manage your preferences"
      >
        <FormSwitch label="Notifications" />
      </FormSection>
    )

    expect(screen.getByText('Manage your preferences')).toBeInTheDocument()
  })
})

describe('FormActions', () => {
  it('should render action buttons', () => {
    const onSave = jest.fn()
    const onCancel = jest.fn()

    render(
      <FormActions
        primaryLabel="Save"
        onPrimary={onSave}
        secondaryLabel="Cancel"
        onSecondary={onCancel}
      />
    )

    expect(screen.getByText('Save')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('should handle button clicks', () => {
    const onSave = jest.fn()
    const onCancel = jest.fn()

    render(
      <FormActions
        primaryLabel="Submit"
        onPrimary={onSave}
        secondaryLabel="Reset"
        onSecondary={onCancel}
      />
    )

    fireEvent.click(screen.getByText('Submit'))
    expect(onSave).toHaveBeenCalled()

    fireEvent.click(screen.getByText('Reset'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('should show loading state', () => {
    render(
      <FormActions
        primaryLabel="Processing..."
        isLoading
        onPrimary={jest.fn()}
      />
    )

    const button = screen.getByRole('button', { name: /processing/i })
    expect(button).toBeDisabled()
  })

  it('should align buttons', () => {
    const { container } = render(
      <FormActions
        primaryLabel="Save"
        onPrimary={jest.fn()}
        align="center"
      />
    )

    const actions = container.firstChild
    expect(actions).toHaveClass('justify-center')
  })
})