# URL State Management Hook

The `useUrlState` hook provides URL-based state management for table components, enabling state persistence across page refreshes and browser navigation.

## Features

- **URL Persistence**: Table state is stored in URL parameters
- **Browser Navigation**: Back/forward buttons work correctly
- **State Synchronization**: URL changes update component state automatically
- **Filter Management**: Supports search queries, filters, pagination, and sorting
- **Type Safety**: Full TypeScript support with proper type definitions

## Usage

### Basic Setup

```typescript
import { useUrlState } from "../../hooks/useUrlState";

const MyListComponent = () => {
  const { state, updateState } = useUrlState({
    defaultState: {
      page: 1,
      pageSize: 10,
      viewMode: "table" as ViewMode,
      filters: {},
      search: "",
      sortBy: "",
      sortOrder: "asc" as "asc" | "desc",
    },
  });

  // Extract values from state
  const searchTerm = state.search || "";
  const currentPage = state.page || 1;
  const filters = state.filters || {};
};
```

### Updating State

```typescript
// Update search
const handleSearch = (value: string) => {
  updateState({ search: value }); // Automatically resets page to 1
};

// Update filters
const handleFilterChange = (filterKey: string, value: string) => {
  const newFilters = { ...state.filters };
  if (value) {
    newFilters[filterKey] = value;
  } else {
    delete newFilters[filterKey];
  }
  updateState({ filters: newFilters });
};

// Update pagination
const handlePageChange = (page: number) => {
  updateState({ page });
};
```

### Helper Functions

```typescript
import {
  createFilterUpdater,
  hasActiveFilters,
  clearAllFilters,
} from "../../hooks/useUrlState";

// Create a filter updater function
const updateFilter = createFilterUpdater(updateState, state.filters);

// Use the filter updater
const handleDepartmentFilter = (department: string) => {
  updateFilter("department", department);
};

// Check if any filters are active
const filtersActive = hasActiveFilters(state);

// Clear all filters and search
const handleClearFilters = () => {
  clearAllFilters(updateState);
};
```

### DataTable Integration

```typescript
// Convert URL state to TanStack Table format
const tableSorting: SortingState = useMemo(() => {
  if (state.sortBy) {
    return [
      {
        id: state.sortBy,
        desc: state.sortOrder === "desc",
      },
    ];
  }
  return [];
}, [state.sortBy, state.sortOrder]);

// Handle sorting changes
const handleSortingChange = useCallback(
  (sorting: SortingState) => {
    if (sorting.length > 0) {
      const sort = sorting[0];
      updateState({
        sortBy: sort.id,
        sortOrder: sort.desc ? "desc" : "asc",
      });
    } else {
      updateState({
        sortBy: "",
        sortOrder: "asc",
      });
    }
  },
  [updateState]
);

// Handle pagination changes
const handlePaginationChange = useCallback(
  (pagination: { pageIndex: number; pageSize: number }) => {
    updateState({
      page: pagination.pageIndex + 1, // Convert from 0-based to 1-based
      pageSize: pagination.pageSize,
    });
  },
  [updateState]
);

// Pass to DataTable
<DataTable
  externalPagination={{
    pageIndex: currentPage - 1, // Convert to 0-based for TanStack Table
    pageSize: pageSize,
    onPaginationChange: handlePaginationChange,
  }}
  externalSorting={{
    sorting: tableSorting,
    onSortingChange: handleSortingChange,
  }}
/>;
```

## URL Parameter Format

The hook uses the following URL parameter conventions:

- `q`: Search query
- `filter_[key]`: Filter values (e.g., `filter_department=IT`)
- `page`: Current page number (only if > 1)
- `pageSize`: Page size (only if different from default)
- `sortBy`: Sort column
- `sortOrder`: Sort direction (`asc` or `desc`)
- `viewMode`: View mode (`table` or `cards`)

Example URL:

```
/staff?q=john&filter_department=IT&filter_status=active&page=2&sortBy=name&sortOrder=desc&viewMode=table
```

## State Management Rules

1. **Page Reset**: Page is automatically reset to 1 when search or filters change
2. **Default Values**: Only non-default values are stored in URL parameters
3. **History Management**: Uses `replace: true` by default to avoid cluttering browser history
4. **State Synchronization**: URL changes (browser back/forward) automatically update component state

## Integration Examples

### StaffList Integration

```typescript
export const StaffList: React.FC = () => {
  const { state, updateState } = useUrlState({
    defaultState: {
      page: 1,
      pageSize: 10,
      viewMode: "table" as ViewMode,
      filters: {},
      search: "",
    },
  });

  const updateFilter = createFilterUpdater(updateState, state.filters);
  const filtersActive = hasActiveFilters(state);

  // Use state values
  const searchTerm = state.search || "";
  const departmentFilter = state.filters?.department || "";
  const statusFilter = state.filters?.status || "";
  const currentPage = state.page || 1;
  const viewMode = (state.viewMode || "table") as ViewMode;

  // Event handlers
  const handleSearch = (value: string) => updateState({ search: value });
  const handleDepartmentFilter = (dept: string) =>
    updateFilter("department", dept);
  const handleStatusFilter = (status: string) => updateFilter("status", status);
  const handleViewModeChange = (mode: ViewMode) =>
    updateState({ viewMode: mode });
  const handleClearFilters = () => clearAllFilters(updateState);

  // ... rest of component
};
```

## Testing

The hook includes utility functions that can be tested independently:

```typescript
import { hasActiveFilters, clearAllFilters } from "../useUrlState";

describe("URL State Utilities", () => {
  it("should detect active filters", () => {
    expect(hasActiveFilters({ search: "test" })).toBe(true);
    expect(hasActiveFilters({ filters: { dept: "IT" } })).toBe(true);
    expect(hasActiveFilters({ search: "", filters: {} })).toBe(false);
  });

  it("should clear all filters", () => {
    const mockUpdate = jest.fn();
    clearAllFilters(mockUpdate);
    expect(mockUpdate).toHaveBeenCalledWith({
      search: "",
      filters: {},
      page: 1,
    });
  });
});
```
