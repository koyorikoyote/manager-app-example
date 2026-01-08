# Validation System Documentation

This document describes the comprehensive validation system implemented for the Manager App using Zod schemas.

## Overview

The validation system provides:

- **Type-safe validation** using Zod schemas
- **Shared schemas** between client and server
- **Real-time form validation** on the client side
- **Server-side request validation** middleware
- **Comprehensive error handling** with user-friendly messages
- **Multi-language support** for validation messages

## Architecture

```
src/
├── shared/
│   └── validation/
│       ├── schemas.ts          # Shared Zod schemas
│       └── README.md           # This documentation
├── server/
│   └── middleware/
│       └── validation.ts       # Server-side validation middleware
└── client/
    ├── hooks/
    │   └── useFormValidation.ts # Client-side validation hook
    ├── components/
    │   ├── ui/
    │   │   └── FormField.tsx    # Validated form components
    │   └── forms/
    │       ├── SystemConfigurationForm.tsx
    │       └── StaffForm.tsx
    └── utils/
        └── validationErrors.ts  # Error handling utilities
```

## Shared Validation Schemas

### Common Schemas

```typescript
import { commonValidationSchemas } from "../shared/validation/schemas";

// Email validation
commonValidationSchemas.email.parse("user@example.com");

// Password validation (requires uppercase, lowercase, number, min 8 chars)
commonValidationSchemas.password.parse("Password123");

// Date validation (YYYY-MM-DD format)
commonValidationSchemas.date.parse("2024-01-15");

// Decimal number validation
commonValidationSchemas.decimal.parse("123.45");

// ID validation (positive integers)
commonValidationSchemas.id.parse("123");
```

### Model-Specific Schemas

#### User Validation

```typescript
import { userValidationSchemas } from "../shared/validation/schemas";

// Create user
const userData = {
  username: "testuser",
  email: "test@example.com",
  password: "Password123",
  name: "Test User",
  role: "USER",
  languagePreference: "EN",
};
userValidationSchemas.create.parse(userData);

// Update user
const updateData = {
  name: "Updated Name",
  currentPassword: "OldPassword123",
  newPassword: "NewPassword123",
};
userValidationSchemas.update.parse(updateData);
```

#### Staff Validation

```typescript
import { staffValidationSchemas } from "../shared/validation/schemas";

// Create staff
const staffData = {
  employeeId: "EMP001",
  name: "John Doe",
  position: "Manager",
  department: "Operations",
  email: "john@example.com",
  phone: "+81-3-1234-5678",
  hireDate: new Date("2024-01-15"),
  salary: 50000,
};
staffValidationSchemas.create.parse(staffData);
```

#### System Configuration Validation

```typescript
import { systemConfigValidationSchemas } from "../shared/validation/schemas";

// Create system configuration
const configData = {
  key: "app.theme.default",
  value: "light",
  description: "Default theme",
  category: "ui",
  dataType: "STRING",
};
systemConfigValidationSchemas.create.parse(configData);

// Validates value based on dataType
const numberConfig = {
  key: "app.timeout",
  value: "30",
  category: "system",
  dataType: "NUMBER",
};
systemConfigValidationSchemas.create.parse(numberConfig);
```

## Server-Side Validation

### Middleware Usage

```typescript
import { validateRequest, systemConfigSchemas } from "../middleware/validation";

// Apply validation to routes
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  validateRequest({ body: systemConfigSchemas.create }),
  async (req, res) => {
    // req.body is now validated and typed
    const { key, value, category, dataType } = req.body;
    // ... handle request
  }
);

// Validate query parameters
router.get(
  "/",
  authenticateToken,
  validateRequest({ query: systemConfigSchemas.query }),
  async (req, res) => {
    // req.query is validated with proper types
    const { category, isActive, page, limit } = req.query;
    // ... handle request
  }
);

// Validate route parameters
router.get(
  "/:id",
  authenticateToken,
  validateRequest({ params: commonSchemas.idParam }),
  async (req, res) => {
    // req.params.id is validated as a number
    const { id } = req.params;
    // ... handle request
  }
);
```

### Error Handling

The validation middleware automatically:

- Parses and validates request data
- Transforms string parameters to appropriate types
- Returns structured error responses for validation failures
- Integrates with the existing error handling middleware

## Client-Side Validation

### Form Validation Hook

```typescript
import { useFormValidation } from "../hooks/useFormValidation";
import { systemConfigValidationSchemas } from "../../shared/validation/schemas";

function MyForm() {
  const formValidation = useFormValidation(
    { key: "", value: "", category: "", dataType: "STRING" },
    {
      schema: systemConfigValidationSchemas.create,
      onValidSubmit: async (data) => {
        await submitData(data);
      },
      validateOnChange: true,
      validateOnBlur: true,
    }
  );

  return (
    <form onSubmit={formValidation.handleSubmit}>
      <FormField
        label="Configuration Key"
        name="key"
        value={formValidation.values.key || ""}
        onChange={(e) => formValidation.setValue("key", e.target.value)}
        onBlur={() => formValidation.validateField("key")}
        error={formValidation.getFieldError("key")}
        hasError={formValidation.hasFieldError("key")}
        required
      />

      <button
        type="submit"
        disabled={!formValidation.isValid || formValidation.isValidating}
      >
        Submit
      </button>
    </form>
  );
}
```

### Form Field Components

```typescript
import { FormField, SelectField, DateField, NumberField } from '../ui/FormField';

// Basic text field with validation
<FormField
  label="ID"
  name="employeeId"
  value={value}
  onChange={onChange}
  onBlur={onBlur}
  error={error}
  hasError={hasError}
  required
  helpText="Unique identifier for this employee"
/>

// Select field with options
<SelectField
  label="Department"
  name="department"
  value={value}
  onChange={onChange}
  options={[
    { value: 'admin', label: 'Administration' },
    { value: 'hr', label: 'Human Resources' }
  ]}
  required
/>

// Date field
<DateField
  label="Hire Date"
  name="hireDate"
  value={value}
  onChange={onChange}
/>

// Number field
<NumberField
  label="Salary"
  name="salary"
  value={value}
  onChange={onChange}
  helpText="Monthly salary amount"
/>
```

## Validation Rules

### User Validation Rules

- **Username**: 3-50 characters, alphanumeric + underscore/dot/hyphen only
- **Email**: Valid email format
- **Password**: Min 8 characters, must contain uppercase, lowercase, and number
- **Name**: 1-100 characters, letters/spaces/Japanese characters only
- **Role**: Must be USER, ADMIN, or SUPER_ADMIN
- **Language**: Must be EN or JA

### Staff Validation Rules

- **ID**: 1-50 characters, alphanumeric + underscore/hyphen only
- **Name**: 1-100 characters, letters/spaces/Japanese characters only
- **Position**: 1-100 characters, required
- **Department**: 1-100 characters, required
- **Email**: Valid email format (optional)
- **Phone**: Valid phone format with international characters (optional)
- **Address**: Max 1000 characters (optional)
- **Hire Date**: Valid date in YYYY-MM-DD format (optional)
- **Salary**: Positive number (optional)

### Property Validation Rules

- **Property Code**: 1-50 characters, alphanumeric + underscore/hyphen only
- **Name**: 1-255 characters, required
- **Address**: 1-1000 characters, required
- **Property Type**: Must be RESIDENTIAL, COMMERCIAL, INDUSTRIAL, or MIXED_USE
- **Manager ID**: Valid user ID (optional)
- **Description**: Max 2000 characters (optional)

### System Configuration Validation Rules

- **Key**: 1-100 characters, alphanumeric + underscore/dot/hyphen only
- **Value**: Required, validated based on data type
- **Category**: 1-50 characters, required
- **Data Type**: Must be STRING, NUMBER, BOOLEAN, or JSON
- **Description**: Max 500 characters (optional)

#### Data Type Validation

- **STRING**: Any text value
- **NUMBER**: Must be a valid number (integer or decimal)
- **BOOLEAN**: Must be exactly "true" or "false" (case-insensitive)
- **JSON**: Must be valid JSON format

## Error Handling

### Client-Side Error Handling

```typescript
import {
  parseValidationError,
  createUserFriendlyErrorMessage,
} from "../utils/validationErrors";

try {
  schema.parse(data);
} catch (error) {
  if (error instanceof ZodError) {
    const { errors, fieldErrors } = parseValidationError(error);

    // Display field-specific errors
    Object.entries(fieldErrors).forEach(([field, message]) => {
      showFieldError(field, message);
    });

    // Or display all errors as a list
    const friendlyMessages = errors.map(createUserFriendlyErrorMessage);
    showErrorList(friendlyMessages);
  }
}
```

### Server-Side Error Responses

Validation failures return structured error responses:

```json
{
  "success": false,
  "message": "Validation failed: key: Key can only contain letters, numbers, underscores, dots, and hyphens, value: Value is required"
}
```

## Multi-Language Support

The validation system supports both English and Japanese:

- **Field names**: Support Japanese characters in name fields
- **Error messages**: Can be localized using the existing i18n system
- **Input validation**: Handles Unicode characters appropriately

## Testing

Comprehensive tests are provided for all validation schemas:

```bash
# Run validation tests
npm test -- --testNamePattern="Validation Schemas"
```

Test coverage includes:

- Valid data acceptance
- Invalid data rejection
- Edge cases and boundary conditions
- Data type transformations
- Cross-field validation rules

## Best Practices

### Schema Design

1. **Reuse common patterns**: Use shared common schemas for email, dates, etc.
2. **Clear error messages**: Provide specific, actionable error messages
3. **Appropriate constraints**: Set realistic length limits and format requirements
4. **Optional vs required**: Clearly distinguish required and optional fields

### Client-Side Validation

1. **Real-time feedback**: Validate on blur for immediate user feedback
2. **Debounced validation**: Avoid excessive validation calls during typing
3. **User-friendly errors**: Transform technical errors into readable messages
4. **Accessibility**: Ensure error messages are accessible to screen readers

### Server-Side Validation

1. **Always validate**: Never trust client-side validation alone
2. **Consistent schemas**: Use the same schemas on client and server
3. **Proper error handling**: Return structured error responses
4. **Security**: Validate and sanitize all inputs

### Performance

1. **Lazy validation**: Only validate when necessary
2. **Field-level validation**: Validate individual fields for better UX
3. **Caching**: Cache validation results where appropriate
4. **Minimal schemas**: Use partial schemas for field-level validation

## Migration Guide

When updating validation schemas:

1. **Backward compatibility**: Ensure existing data remains valid
2. **Gradual rollout**: Update server validation first, then client
3. **Data migration**: Provide scripts to update existing invalid data
4. **Documentation**: Update this documentation with changes

## Troubleshooting

### Common Issues

1. **Schema not found**: Ensure schemas are properly imported
2. **Type errors**: Check that TypeScript types match Zod schemas
3. **Validation not triggering**: Verify middleware is applied to routes
4. **Client-server mismatch**: Ensure both use the same shared schemas

### Debugging

1. **Enable validation logging**: Add console.log in validation middleware
2. **Check error details**: Examine ZodError.issues for specific problems
3. **Test schemas individually**: Use unit tests to verify schema behavior
4. **Validate data manually**: Test schemas with known good/bad data
