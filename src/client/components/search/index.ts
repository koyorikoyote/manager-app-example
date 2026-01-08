// Search components exports
export { SearchInput } from "./SearchInput";
export {
  SearchFilter,
  DEFAULT_FILTER_OPTIONS,
  type FilterOption,
} from "./SearchFilter";
export { SearchResultCard } from "./SearchResultCard";
export type { SearchResult } from "../../services/searchService";

// Client-side search components
export { ClientSideSearchInput } from "./ClientSideSearchInput";
export {
  DynamicFilterDropdown,
  type FilterOption as DynamicFilterOption,
  type FilterConfig,
} from "./DynamicFilterDropdown";
export {
  ActiveFiltersDisplay,
  type ActiveFilter,
} from "./ActiveFiltersDisplay";
export { ClientSideSearchContainer } from "./ClientSideSearchContainer";
export {
  useClientSideFiltering,
  type ClientSideFilterState,
  type UseClientSideFilteringOptions,
  type UseClientSideFilteringResult,
} from "./useClientSideFiltering";
