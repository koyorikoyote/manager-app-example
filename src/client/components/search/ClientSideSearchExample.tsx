import React from 'react';
import { ClientSideSearchContainer } from './ClientSideSearchContainer';
import type { FilterConfig } from './DynamicFilterDropdown';

// Example data type
interface ExampleData extends Record<string, unknown> {
    id: number;
    name: string;
    department: string;
    status: string;
    email: string;
}

// Example usage of ClientSideSearchContainer
export const ClientSideSearchExample: React.FC = () => {
    // Sample data
    const sampleData: ExampleData[] = [
        { id: 1, name: 'John Doe', department: 'IT', status: 'active', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', department: 'HR', status: 'active', email: 'jane@example.com' },
        { id: 3, name: 'Bob Johnson', department: 'IT', status: 'inactive', email: 'bob@example.com' },
        { id: 4, name: 'Alice Brown', department: 'Finance', status: 'active', email: 'alice@example.com' },
    ];

    // Define which fields to search
    const searchFields: (keyof ExampleData)[] = ['name', 'email'];

    // Define filter configurations
    const filterConfigs: FilterConfig[] = [
        {
            key: 'department',
            label: 'Department',
            field: 'department',
            type: 'select',
            sortBy: 'alphabetical'
        },
        {
            key: 'status',
            label: 'Status',
            field: 'status',
            type: 'select',
            sortBy: 'alphabetical'
        }
    ];

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Client-Side Search Example</h2>

            <ClientSideSearchContainer
                data={sampleData}
                searchFields={searchFields}
                filterConfigs={filterConfigs}
                searchPlaceholder="Search by name or email..."
                showFiltersInline={true}
            >
                {({ filteredData, filteredCount, totalCount }) => (
                    <div className="space-y-4">
                        {/* Results summary */}
                        <div className="text-sm text-gray-600">
                            Showing {filteredCount} of {totalCount} results
                        </div>

                        {/* Results table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Name</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Department</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Status</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Email</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredData.map((item) => {
                                        const typedItem = item as ExampleData;
                                        return (
                                            <tr key={typedItem.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-sm text-gray-900">{typedItem.name}</td>
                                                <td className="px-4 py-2 text-sm text-gray-900">{typedItem.department}</td>
                                                <td className="px-4 py-2 text-sm text-gray-900">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typedItem.status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {typedItem.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-900">{typedItem.email}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Empty state */}
                        {filteredData.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p>No results found</p>
                                <p className="text-sm mt-1">Try adjusting your search or filters</p>
                            </div>
                        )}
                    </div>
                )}
            </ClientSideSearchContainer>
        </div>
    );
};