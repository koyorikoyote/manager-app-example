export interface FilterableColumn {
  key: string;
  label: string;
  dataType: "string" | "number" | "date" | "enum";
  hasMultipleValues: boolean;
  optionCount: number;
}

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface FilterState {
  activeFilters: Record<string, string[] | undefined>;
  filterOptions: Record<string, FilterOption[]>;
  filterableColumns: FilterableColumn[];
  isLoading: boolean;
  error: string | null;
}

export interface FilterContextValue {
  state: FilterState;
  actions: {
    setFilter: (columnKey: string, values: string[]) => void;
    removeFilter: (columnKey: string, value?: string) => void;
    clearAllFilters: () => void;
    loadFilterOptions: (columnKey: string) => Promise<void>;
  };
}

export interface ActiveFilter {
  columnKey: string;
  columnLabel: string;
  values: string[];
  displayValues: string[];
}

export interface NumericRange {
  label: string;
  min: number;
  max: number;
}

export interface NumericRangeAnalysis {
  min: number;
  max: number;
  ranges: NumericRange[];
}
