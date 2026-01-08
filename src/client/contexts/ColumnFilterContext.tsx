import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { FilterState, FilterContextValue, FilterableColumn, FilterOption } from '../../shared/types/filtering';
import clientFilterCache from '../../shared/utils/clientFilterCache';

// Filter actions
type FilterAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_FILTERABLE_COLUMNS'; payload: FilterableColumn[] }
    | { type: 'SET_FILTER_OPTIONS'; payload: { columnKey: string; options: FilterOption[] } }
    | { type: 'SET_FILTER'; payload: { columnKey: string; values: string[] } }
    | { type: 'REMOVE_FILTER'; payload: { columnKey: string; value?: string } }
    | { type: 'CLEAR_ALL_FILTERS' }
    | { type: 'LOAD_OPTIONS_START'; payload: string }
    | { type: 'LOAD_OPTIONS_SUCCESS'; payload: { columnKey: string; options: FilterOption[] } }
    | { type: 'LOAD_OPTIONS_ERROR'; payload: { columnKey: string; error: string } };

const initialState: FilterState = {
    activeFilters: {},
    filterOptions: {},
    filterableColumns: [],
    isLoading: false,
    error: null,
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
    switch (action.type) {
        case 'SET_LOADING':
            return {
                ...state,
                isLoading: action.payload,
            };

        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload,
                isLoading: false,
            };

        case 'SET_FILTERABLE_COLUMNS':
            return {
                ...state,
                filterableColumns: action.payload,
                error: null,
            };

        case 'SET_FILTER_OPTIONS':
            return {
                ...state,
                filterOptions: {
                    ...state.filterOptions,
                    [action.payload.columnKey]: action.payload.options,
                },
            };

        case 'SET_FILTER': {
            const { columnKey, values } = action.payload;
            return {
                ...state,
                activeFilters: {
                    ...state.activeFilters,
                    [columnKey]: values.length > 0 ? values : undefined,
                },
            };
        }

        case 'REMOVE_FILTER': {
            const { columnKey: removeColumnKey, value } = action.payload;
            const currentValues = state.activeFilters[removeColumnKey] || [];

            if (value) {
                // Remove specific value
                const updatedValues = currentValues.filter(v => v !== value);
                return {
                    ...state,
                    activeFilters: {
                        ...state.activeFilters,
                        [removeColumnKey]: updatedValues.length > 0 ? updatedValues : undefined,
                    },
                };
            } else {
                // Remove entire filter
                const { [removeColumnKey]: removed, ...remainingFilters } = state.activeFilters;
                return {
                    ...state,
                    activeFilters: remainingFilters,
                };
            }
        }

        case 'CLEAR_ALL_FILTERS':
            return {
                ...state,
                activeFilters: {},
            };

        case 'LOAD_OPTIONS_START':
            return {
                ...state,
                isLoading: true,
                error: null,
            };

        case 'LOAD_OPTIONS_SUCCESS':
            return {
                ...state,
                filterOptions: {
                    ...state.filterOptions,
                    [action.payload.columnKey]: action.payload.options,
                },
                isLoading: false,
                error: null,
            };

        case 'LOAD_OPTIONS_ERROR':
            return {
                ...state,
                isLoading: false,
                error: action.payload.error,
            };

        default:
            return state;
    }
}

const ColumnFilterContext = createContext<FilterContextValue | undefined>(undefined);

interface ColumnFilterProviderProps {
    children: ReactNode;
    tableName: string;
    filterableColumns?: FilterableColumn[];
}

export function ColumnFilterProvider({
    children,
    tableName,
    filterableColumns = []
}: ColumnFilterProviderProps) {
    const [state, dispatch] = useReducer(filterReducer, {
        ...initialState,
        filterableColumns,
    });

    // Set filter values for a column
    const setFilter = useCallback((columnKey: string, values: string[]) => {
        dispatch({
            type: 'SET_FILTER',
            payload: { columnKey, values }
        });
    }, []);

    // Remove filter for a column or specific value
    const removeFilter = useCallback((columnKey: string, value?: string) => {
        dispatch({
            type: 'REMOVE_FILTER',
            payload: { columnKey, value }
        });
    }, []);

    // Clear all active filters
    const clearAllFilters = useCallback(() => {
        dispatch({ type: 'CLEAR_ALL_FILTERS' });
    }, []);

    // Load filter options for a column
    const loadFilterOptions = useCallback(async (columnKey: string) => {
        // Check cache first
        const cachedOptions = clientFilterCache.get(tableName, columnKey);
        if (cachedOptions) {
            dispatch({
                type: 'SET_FILTER_OPTIONS',
                payload: { columnKey, options: cachedOptions },
            });
            return;
        }

        dispatch({ type: 'LOAD_OPTIONS_START', payload: columnKey });

        try {
            const response = await fetch(`/api/filters/${tableName}/${columnKey}/options`);

            if (!response.ok) {
                throw new Error(`Failed to load filter options: ${response.statusText}`);
            }

            const options: FilterOption[] = await response.json();

            // Cache the options
            clientFilterCache.set(tableName, columnKey, options);

            dispatch({
                type: 'LOAD_OPTIONS_SUCCESS',
                payload: { columnKey, options },
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load filter options';
            dispatch({
                type: 'LOAD_OPTIONS_ERROR',
                payload: { columnKey, error: errorMessage },
            });
        }
    }, [tableName]);

    // Update filterable columns when prop changes
    React.useEffect(() => {
        if (filterableColumns.length > 0) {
            dispatch({
                type: 'SET_FILTERABLE_COLUMNS',
                payload: filterableColumns
            });
        }
    }, [filterableColumns]);

    const value: FilterContextValue = {
        state,
        actions: {
            setFilter,
            removeFilter,
            clearAllFilters,
            loadFilterOptions,
        },
    };

    return (
        <ColumnFilterContext.Provider value={value}>
            {children}
        </ColumnFilterContext.Provider>
    );
}

export function useColumnFilters(): FilterContextValue {
    const context = useContext(ColumnFilterContext);
    if (context === undefined) {
        throw new Error('useColumnFilters must be used within a ColumnFilterProvider');
    }
    return context;
}