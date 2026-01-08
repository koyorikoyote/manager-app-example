import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StandardFormDialog, FormField, FormInput } from '../StandardFormDialog';
import { LanguageProvider } from '../../../contexts/LanguageContext';

// Mock the language context
const MockLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <LanguageProvider>{children}</LanguageProvider>
);

interface TestFormData {
    name: string;
    email: string;
    age: number;
}

const TestFormDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<TestFormData>) => Promise<void>;
    initialData?: Partial<TestFormData>;
    errors?: Array<{ field?: string; message: string }>;
}> = ({ isOpen, onClose, onSubmit, initialData = {}, errors = [] }) => {
    const [formData, setFormData] = React.useState<Partial<TestFormData>>(initialData);

    const handleFieldChange = (field: keyof TestFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const getFieldError = (field: string) => {
        const error = errors.find(err => err.field === field);
        return error?.message;
    };

    return (
        <StandardFormDialog
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={onSubmit}
            title="Test Form"
            errors={errors}
        >
            <FormField
                label="Name"
                error={getFieldError('name')}
                required
            >
                <FormInput
                    value={formData.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="Enter name"
                    error={!!getFieldError('name')}
                    data-testid="name-input"
                />
            </FormField>

            <FormField
                label="Email"
                error={getFieldError('email')}
            >
                <FormInput
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder="Enter email"
                    error={!!getFieldError('email')}
                    data-testid="email-input"
                />
            </FormField>

            <FormField
                label="Age"
                error={getFieldError('age')}
            >
                <FormInput
                    type="number"
                    value={formData.age?.toString() || ''}
                    onChange={(e) => handleFieldChange('age', parseInt(e.target.value) || 0)}
                    placeholder="Enter age"
                    error={!!getFieldError('age')}
                    data-testid="age-input"
                />
            </FormField>
        </StandardFormDialog>
    );
};

describe('StandardFormDialog', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderFormDialog = (props: Partial<React.ComponentProps<typeof TestFormDialog>> = {}) => {
        return render(
            <MockLanguageProvider>
                <TestFormDialog
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    {...props}
                />
            </MockLanguageProvider>
        );
    };

    it('renders form dialog with title and form fields', () => {
        renderFormDialog();

        expect(screen.getByText('Test Form')).toBeInTheDocument();
        expect(screen.getByTestId('name-input')).toBeInTheDocument();
        expect(screen.getByTestId('email-input')).toBeInTheDocument();
        expect(screen.getByTestId('age-input')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('Age')).toBeInTheDocument();
    });

    it('shows required field indicators', () => {
        renderFormDialog();

        // Name field should have required indicator (*)
        expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('displays field errors when provided', () => {
        const errors = [
            { field: 'name', message: 'Name is required' },
            { field: 'email', message: 'Invalid email format' }
        ];

        renderFormDialog({ errors });

        expect(screen.getByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });

    it('displays general errors when no field is specified', () => {
        const errors = [
            { message: 'General form error' }
        ];

        renderFormDialog({ errors });

        expect(screen.getByText('General form error')).toBeInTheDocument();
    });

    it('calls onSubmit when form is submitted', async () => {
        const user = userEvent.setup();
        mockOnSubmit.mockResolvedValue(undefined);

        renderFormDialog();

        // Fill in form fields
        await user.type(screen.getByTestId('name-input'), 'John Doe');
        await user.type(screen.getByTestId('email-input'), 'john@example.com');
        await user.type(screen.getByTestId('age-input'), '30');

        // Submit form
        const submitButton = screen.getByRole('button', { name: /create/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalled();
        });
    });

    it('shows loading state during form submission', async () => {
        const user = userEvent.setup();
        let resolveSubmit: () => void;
        const submitPromise = new Promise<void>((resolve) => {
            resolveSubmit = resolve;
        });
        mockOnSubmit.mockReturnValue(submitPromise);

        renderFormDialog();

        // Submit form
        const submitButton = screen.getByRole('button', { name: /create/i });
        await user.click(submitButton);

        // Should show loading state
        expect(screen.getByRole('button', { name: /create/i })).toBeDisabled();

        // Resolve the promise
        resolveSubmit!();
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /create/i })).not.toBeDisabled();
        });
    });

    it('calls onClose when cancel button is clicked', async () => {
        const user = userEvent.setup();
        renderFormDialog();

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when close button (X) is clicked', async () => {
        const user = userEvent.setup();
        renderFormDialog();

        const closeButton = screen.getByLabelText(/close dialog/i);
        await user.click(closeButton);

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('prevents form submission when loading', async () => {
        const user = userEvent.setup();
        let resolveSubmit: () => void;
        const submitPromise = new Promise<void>((resolve) => {
            resolveSubmit = resolve;
        });
        mockOnSubmit.mockReturnValue(submitPromise);

        renderFormDialog();

        // Get submit button and click it multiple times quickly
        const submitButton = screen.getByRole('button', { name: /create/i });
        await user.click(submitButton);

        // Button should be disabled now
        expect(submitButton).toBeDisabled();

        // Try to click again - should not trigger another call
        await user.click(submitButton);
        await user.click(submitButton);

        // Should only be called once
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);

        // Resolve the promise to clean up
        resolveSubmit!();
    });

    it('shows success message when showSuccessMessage is true', async () => {
        const user = userEvent.setup();
        mockOnSubmit.mockResolvedValue(undefined);

        render(
            <MockLanguageProvider>
                <StandardFormDialog
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    title="Test Form"
                    showSuccessMessage={true}
                    successMessage="Form submitted successfully!"
                >
                    <div>Test content</div>
                </StandardFormDialog>
            </MockLanguageProvider>
        );

        // Submit form
        const submitButton = screen.getByRole('button', { name: /create/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Form submitted successfully!')).toBeInTheDocument();
        });
    });

    it('handles form submission errors', async () => {
        const user = userEvent.setup();
        const error = new Error('Submission failed');
        mockOnSubmit.mockRejectedValue(error);

        renderFormDialog();

        // Submit form
        const submitButton = screen.getByRole('button', { name: /create/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Submission failed')).toBeInTheDocument();
        });
    });

    it('populates form with initial data when editing', () => {
        const initialData = {
            name: 'John Doe',
            email: 'john@example.com',
            age: 30
        };

        renderFormDialog({ initialData });

        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('30')).toBeInTheDocument();
    });

    it('shows "Save" button text when editing existing record', () => {
        const initialData = { name: 'John Doe' };
        // Pass a record to indicate edit mode
        const mockRecord = { id: '1', name: 'John Doe' };

        render(
            <MockLanguageProvider>
                <StandardFormDialog
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    title="Edit Form"
                    record={mockRecord}
                >
                    <div>Test content</div>
                </StandardFormDialog>
            </MockLanguageProvider>
        );

        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('applies error styling to form inputs with errors', () => {
        const errors = [
            { field: 'name', message: 'Name is required' }
        ];

        renderFormDialog({ errors });

        const nameInput = screen.getByTestId('name-input');
        expect(nameInput).toHaveClass('border-red-300');
    });

    it('supports keyboard navigation', async () => {
        const user = userEvent.setup();
        renderFormDialog();

        // Tab through form elements
        await user.tab();
        expect(screen.getByTestId('name-input')).toHaveFocus();

        await user.tab();
        expect(screen.getByTestId('email-input')).toHaveFocus();

        await user.tab();
        expect(screen.getByTestId('age-input')).toHaveFocus();
    });
});

describe('FormField', () => {
    it('renders label and children correctly', () => {
        render(
            <MockLanguageProvider>
                <FormField label="Test Field">
                    <input data-testid="test-input" />
                </FormField>
            </MockLanguageProvider>
        );

        expect(screen.getByText('Test Field')).toBeInTheDocument();
        expect(screen.getByTestId('test-input')).toBeInTheDocument();
    });

    it('shows required indicator when required is true', () => {
        render(
            <MockLanguageProvider>
                <FormField label="Required Field" required>
                    <input />
                </FormField>
            </MockLanguageProvider>
        );

        expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('displays error message when provided', () => {
        render(
            <MockLanguageProvider>
                <FormField label="Field with Error" error="This field has an error">
                    <input />
                </FormField>
            </MockLanguageProvider>
        );

        expect(screen.getByText('This field has an error')).toBeInTheDocument();
    });
});

describe('FormInput', () => {
    it('applies error styling when error prop is true', () => {
        render(
            <MockLanguageProvider>
                <FormInput error={true} data-testid="error-input" />
            </MockLanguageProvider>
        );

        const input = screen.getByTestId('error-input');
        expect(input).toHaveClass('border-red-300');
    });

    it('applies normal styling when error prop is false', () => {
        render(
            <MockLanguageProvider>
                <FormInput error={false} data-testid="normal-input" />
            </MockLanguageProvider>
        );

        const input = screen.getByTestId('normal-input');
        expect(input).toHaveClass('border-gray-300');
    });

    it('is disabled when disabled prop is true', () => {
        render(
            <MockLanguageProvider>
                <FormInput disabled={true} data-testid="disabled-input" />
            </MockLanguageProvider>
        );

        const input = screen.getByTestId('disabled-input');
        expect(input).toBeDisabled();
    });
});