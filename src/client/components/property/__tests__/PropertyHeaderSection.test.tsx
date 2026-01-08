import React from 'react';
import { render, screen } from '@testing-library/react';
import { PropertyHeaderSection } from '../PropertyHeaderSection';
import type { Property } from '../../../../shared/types';

// Mock the hooks and contexts
jest.mock('../../../hooks/useResponsive', () => ({
    useResponsive: () => ({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeDesktop: true
    })
}));

jest.mock('../../../contexts/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key
    })
}));

// Mock the PhotoUpload component
jest.mock('../../ui/PhotoUpload', () => ({
    PhotoUpload: ({ currentPhoto }: { currentPhoto?: string | null }) => (
        <div data-testid="photo-upload">
            {currentPhoto ? <img src={currentPhoto} alt="Property" /> : 'No photo'}
        </div>
    )
}));

describe('PropertyHeaderSection', () => {
    const mockProperty: Property & { photo?: string | null; furiganaName?: string | null; establishmentDate?: Date | null } = {
        id: 1,
        propertyCode: 'PROP001',
        name: 'Test Property',
        address: '123 Test Street',
        propertyType: 'RESIDENTIAL',
        status: 'ACTIVE',
        description: 'Test description',
        contractDate: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        photo: undefined,
        furiganaName: 'テストプロパティ',
        establishmentDate: new Date('2020-01-01')
    };

    it('renders property name and basic information', () => {
        render(
            <PropertyHeaderSection
                property={mockProperty}
                isEditMode={false}
            />
        );

        expect(screen.getAllByText('Test Property')).toHaveLength(2); // Once in ruby, once in h1
        expect(screen.getByText(/Property Code:/)).toBeInTheDocument();
        expect(screen.getByText('PROP001')).toBeInTheDocument();
        expect(screen.getByText(/Status:/)).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText(/Type:/)).toBeInTheDocument();
        expect(screen.getByText('Residential')).toBeInTheDocument();
    });

    it('renders furigana name when available', () => {
        render(
            <PropertyHeaderSection
                property={mockProperty}
                isEditMode={false}
            />
        );

        expect(screen.getByText('テストプロパティ')).toBeInTheDocument();
    });

    it('renders establishment date when available', () => {
        render(
            <PropertyHeaderSection
                property={mockProperty}
                isEditMode={false}
            />
        );

        expect(screen.getByText(/Established:/)).toBeInTheDocument();
        expect(screen.getByText(/January 1, 2020/)).toBeInTheDocument();
    });

    it('renders photo upload component', () => {
        render(
            <PropertyHeaderSection
                property={mockProperty}
                isEditMode={false}
            />
        );

        expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
    });

    it('renders edit fields when in edit mode', () => {
        const mockOnFieldChange = jest.fn();

        render(
            <PropertyHeaderSection
                property={mockProperty}
                isEditMode={true}
                onFieldChange={mockOnFieldChange}
            />
        );

        expect(screen.getByLabelText(/Furigana Name/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Establishment Date/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Status/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Property Type/)).toBeInTheDocument();
    });

    it('does not render edit fields when not in edit mode', () => {
        render(
            <PropertyHeaderSection
                property={mockProperty}
                isEditMode={false}
            />
        );

        expect(screen.queryByLabelText(/Furigana Name/)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/Establishment Date/)).not.toBeInTheDocument();
    });

    it('handles property with minimal data', () => {
        const minimalProperty: Property & { photo?: string | null; furiganaName?: string | null; establishmentDate?: Date | null } = {
            id: 2,
            propertyCode: 'PROP002',
            name: 'Minimal Property',
            address: '456 Minimal Street',
            propertyType: 'COMMERCIAL',
            status: 'INACTIVE',
            description: undefined,
            contractDate: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            photo: undefined,
            furiganaName: undefined,
            establishmentDate: undefined
        };

        render(
            <PropertyHeaderSection
                property={minimalProperty}
                isEditMode={false}
            />
        );

        expect(screen.getByText('Minimal Property')).toBeInTheDocument();
        expect(screen.getByText('PROP002')).toBeInTheDocument();
        expect(screen.getByText('Inactive')).toBeInTheDocument();
        expect(screen.getByText('Commercial')).toBeInTheDocument();
        expect(screen.queryByText(/Established:/)).not.toBeInTheDocument();
    });
});
