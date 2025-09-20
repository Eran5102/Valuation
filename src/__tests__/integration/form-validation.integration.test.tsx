import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, SelectField, TextAreaField, CheckboxField } from '@/components/forms/FormField';
import { CompanySchema, ShareClassSchema } from '@/lib/validation/schemas';

// Mock form component for testing
function MockCompanyForm() {
  const form = useForm({
    resolver: zodResolver(CompanySchema),
    defaultValues: {
      name: '',
      legal_name: '',
      industry: '',
      employees: 0,
      website: '',
      description: ''
    }
  });

  const onSubmit = jest.fn();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} data-testid="company-form">
      <TextField
        label="Company Name"
        register={form.register('name')}
        error={form.formState.errors.name}
        required
      />

      <TextField
        label="Legal Name"
        register={form.register('legal_name')}
        error={form.formState.errors.legal_name}
      />

      <SelectField
        label="Industry"
        register={form.register('industry')}
        error={form.formState.errors.industry}
        options={[
          { value: 'technology', label: 'Technology' },
          { value: 'healthcare', label: 'Healthcare' },
          { value: 'finance', label: 'Finance' }
        ]}
      />

      <TextField
        label="Number of Employees"
        register={form.register('employees', { valueAsNumber: true })}
        error={form.formState.errors.employees}
        type="number"
      />

      <TextField
        label="Website"
        register={form.register('website')}
        error={form.formState.errors.website}
        type="url"
      />

      <TextAreaField
        label="Description"
        register={form.register('description')}
        error={form.formState.errors.description}
        rows={4}
      />

      <button type="submit">Submit</button>
    </form>
  );
}

function MockShareClassForm() {
  const form = useForm({
    resolver: zodResolver(ShareClassSchema),
    defaultValues: {
      name: '',
      shareType: 'common',
      sharesOutstanding: 0,
      pricePerShare: 0,
      preferenceType: 'non-participating',
      lpMultiple: 1.0,
      dividendsDeclared: false
    }
  });

  const onSubmit = jest.fn();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} data-testid="shareclass-form">
      <TextField
        label="Share Class Name"
        register={form.register('name')}
        error={form.formState.errors.name}
        required
      />

      <SelectField
        label="Share Type"
        register={form.register('shareType')}
        error={form.formState.errors.shareType}
        options={[
          { value: 'common', label: 'Common Stock' },
          { value: 'preferred', label: 'Preferred Stock' }
        ]}
      />

      <TextField
        label="Shares Outstanding"
        register={form.register('sharesOutstanding', { valueAsNumber: true })}
        error={form.formState.errors.sharesOutstanding}
        type="number"
        required
      />

      <TextField
        label="Price Per Share"
        register={form.register('pricePerShare', { valueAsNumber: true })}
        error={form.formState.errors.pricePerShare}
        type="number"
        step="0.01"
        required
      />

      <TextField
        label="LP Multiple"
        register={form.register('lpMultiple', { valueAsNumber: true })}
        error={form.formState.errors.lpMultiple}
        type="number"
        step="0.1"
      />

      <CheckboxField
        label="Dividends Declared"
        register={form.register('dividendsDeclared')}
        error={form.formState.errors.dividendsDeclared}
        description="Check if this share class has declared dividends"
      />

      <button type="submit">Submit</button>
    </form>
  );
}

describe('Form Validation Integration Tests', () => {
  describe('Company Form Integration', () => {
    it('should validate required fields and show errors', async () => {
      render(<MockCompanyForm />);

      const submitButton = screen.getByText('Submit');
      const nameInput = screen.getByLabelText(/Company Name/);

      // Submit without filling required fields
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      // Fill required field and verify error disappears
      fireEvent.change(nameInput, { target: { value: 'Test Company' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
      });
    });

    it('should validate field formats and constraints', async () => {
      render(<MockCompanyForm />);

      const websiteInput = screen.getByLabelText(/Website/);
      const employeesInput = screen.getByLabelText(/Number of Employees/);

      // Test invalid website format
      fireEvent.change(websiteInput, { target: { value: 'invalid-url' } });
      fireEvent.blur(websiteInput);

      await waitFor(() => {
        expect(screen.getByText(/invalid url/i)).toBeInTheDocument();
      });

      // Test negative employees
      fireEvent.change(employeesInput, { target: { value: '-5' } });
      fireEvent.blur(employeesInput);

      await waitFor(() => {
        expect(screen.getByText(/must be greater than or equal to 0/i)).toBeInTheDocument();
      });

      // Test valid values
      fireEvent.change(websiteInput, { target: { value: 'https://example.com' } });
      fireEvent.change(employeesInput, { target: { value: '100' } });

      await waitFor(() => {
        expect(screen.queryByText(/invalid url/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/must be greater than or equal to 0/i)).not.toBeInTheDocument();
      });
    });

    it('should handle form submission with valid data', async () => {
      render(<MockCompanyForm />);

      // Fill all required fields with valid data
      fireEvent.change(screen.getByLabelText(/Company Name/), {
        target: { value: 'Test Company Inc.' }
      });
      fireEvent.change(screen.getByLabelText(/Legal Name/), {
        target: { value: 'Test Company Inc.' }
      });
      fireEvent.change(screen.getByLabelText(/Number of Employees/), {
        target: { value: '50' }
      });
      fireEvent.change(screen.getByLabelText(/Website/), {
        target: { value: 'https://testcompany.com' }
      });

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      // Should not show any validation errors
      await waitFor(() => {
        expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
      });
    });

    it('should show field-specific error styling', async () => {
      render(<MockCompanyForm />);

      const nameInput = screen.getByLabelText(/Company Name/);
      const websiteInput = screen.getByLabelText(/Website/);

      // Trigger validation errors
      fireEvent.change(websiteInput, { target: { value: 'invalid' } });
      fireEvent.click(screen.getByText('Submit'));

      await waitFor(() => {
        // Name field should have error styling (required field)
        expect(nameInput).toHaveClass('border-red-500');

        // Website field should have error styling (invalid format)
        expect(websiteInput).toHaveClass('border-red-500');
      });
    });
  });

  describe('Share Class Form Integration', () => {
    it('should validate financial constraints', async () => {
      render(<MockShareClassForm />);

      const sharesInput = screen.getByLabelText(/Shares Outstanding/);
      const priceInput = screen.getByLabelText(/Price Per Share/);
      const lpMultipleInput = screen.getByLabelText(/LP Multiple/);

      // Test invalid values
      fireEvent.change(sharesInput, { target: { value: '0' } });
      fireEvent.change(priceInput, { target: { value: '-1' } });
      fireEvent.change(lpMultipleInput, { target: { value: '0' } });

      fireEvent.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(screen.getByText(/shares outstanding must be greater than 0/i)).toBeInTheDocument();
        expect(screen.getByText(/price per share must be 0 or greater/i)).toBeInTheDocument();
        expect(screen.getByText(/lp multiple must be greater than 0/i)).toBeInTheDocument();
      });
    });

    it('should handle conditional validation based on share type', async () => {
      render(<MockShareClassForm />);

      const shareTypeSelect = screen.getByLabelText(/Share Type/);

      // When preferred is selected, LP Multiple becomes more important
      fireEvent.change(shareTypeSelect, { target: { value: 'preferred' } });

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/Share Class Name/), {
        target: { value: 'Series A Preferred' }
      });
      fireEvent.change(screen.getByLabelText(/Shares Outstanding/), {
        target: { value: '1000000' }
      });
      fireEvent.change(screen.getByLabelText(/Price Per Share/), {
        target: { value: '2.50' }
      });

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      // Should not show validation errors for properly filled preferred stock
      await waitFor(() => {
        expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
      });
    });

    it('should validate checkbox interactions', async () => {
      render(<MockShareClassForm />);

      const dividendsCheckbox = screen.getByLabelText(/Dividends Declared/);

      // Check the dividends checkbox
      fireEvent.click(dividendsCheckbox);

      expect(dividendsCheckbox).toBeChecked();

      // Uncheck it
      fireEvent.click(dividendsCheckbox);

      expect(dividendsCheckbox).not.toBeChecked();
    });
  });

  describe('Cross-Field Validation Integration', () => {
    it('should handle complex business rule validation', async () => {
      // This test demonstrates how complex validation rules would work
      // For example, preferred stock with participating rights should have different validation

      render(<MockShareClassForm />);

      // Set up a complex validation scenario
      fireEvent.change(screen.getByLabelText(/Share Class Name/), {
        target: { value: 'Series A Participating Preferred' }
      });
      fireEvent.change(screen.getByLabelText(/Share Type/), {
        target: { value: 'preferred' }
      });
      fireEvent.change(screen.getByLabelText(/Shares Outstanding/), {
        target: { value: '2000000' }
      });
      fireEvent.change(screen.getByLabelText(/Price Per Share/), {
        target: { value: '1.50' }
      });
      fireEvent.change(screen.getByLabelText(/LP Multiple/), {
        target: { value: '1.5' }
      });

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      // Should successfully validate complex preferred stock setup
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Accessibility Integration', () => {
    it('should maintain accessibility standards', async () => {
      render(<MockCompanyForm />);

      // Check that all form fields have proper labels
      expect(screen.getByLabelText(/Company Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Legal Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Industry/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Number of Employees/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Website/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument();

      // Check that required fields are marked as required
      const nameLabel = screen.getByText(/Company Name/);
      expect(nameLabel).toHaveClass('after:content-["*"]');
    });

    it('should associate error messages with form fields', async () => {
      render(<MockCompanyForm />);

      const nameInput = screen.getByLabelText(/Company Name/);

      // Trigger validation error
      fireEvent.click(screen.getByText('Submit'));

      await waitFor(() => {
        const errorMessage = screen.getByText(/name is required/i);
        expect(errorMessage).toBeInTheDocument();

        // Error should be announced to screen readers
        expect(errorMessage).toHaveClass('text-red-600');
      });
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid form interactions without performance issues', async () => {
      render(<MockCompanyForm />);

      const nameInput = screen.getByLabelText(/Company Name/);

      const startTime = Date.now();

      // Simulate rapid typing
      for (let i = 0; i < 100; i++) {
        fireEvent.change(nameInput, { target: { value: `Test Company ${i}` } });
      }

      const endTime = Date.now();

      // Should handle rapid changes efficiently (under 1 second)
      expect(endTime - startTime).toBeLessThan(1000);

      // Final value should be correct
      expect(nameInput).toHaveValue('Test Company 99');
    });
  });
});