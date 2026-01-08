/**
 * Client Hooks Index
 *
 * Centralized exports for all client-side hooks
 */

// Core hooks
export { useSessionStorage } from "./useSessionStorage";
export { useFirstNavigation } from "./useFirstNavigation";
export { useDebounce } from "./useDebounce";
export { useConfirmDialog } from "./useConfirmDialog";
export { useFocusManagement } from "./useFocusManagement";
export { useKeyboardNavigation } from "./useKeyboardNavigation";
export { usePagination } from "./usePagination";
export { useUrlState } from "./useUrlState";

// Responsive and navigation hooks
export {
  useResponsive,
  useBreakpoint,
  useResponsiveColumns,
  useNavigationBreakpoints,
  useMobileComponentVisibility,
  useDebouncedResponsive,
  type BreakpointState,
  type NavigationBreakpoints,
  BREAKPOINTS,
} from "./useResponsive";

export { useTouch, usePullToRefresh, useMobileDetection } from "./useTouch";

export {
  useNavigationResponsive,
  useNavigationTransitions,
  useNavigationGestures,
  useResponsiveSpacing,
  type NavigationResponsiveState,
} from "./useNavigationResponsive";

export {
  useResponsiveNavigation,
  type UseResponsiveNavigationReturn,
} from "./useResponsiveNavigation";

export { useViewMode } from "./useViewMode";

// Data hooks
export { useStaff } from "./useStaff";
export { useProperties } from "./useProperties";
export { useDestination } from "./useDestination";
export { useCompanies } from "./useCompanies";
export { useInteraction } from "./useInteraction";
export { useComplaintDetails } from "./useComplaintDetails";
export { useDailyRecords } from "./useDailyRecords";
export { useInquiries } from "./useInquiries";
export { useAttendance } from "./useAttendance";
export { useDocuments } from "./useDocuments";
export { useSystemConfigurations } from "./useSystemConfigurations";
export { useUsers } from "./useUsers";

// Form and validation hooks
export { useFormValidation } from "./useFormValidation";
export { useFormatting } from "./useFormatting";
export { useLocalization } from "./useLocalization";

// Filter hooks
export { useEnhancedFilters } from "./useEnhancedFilters";

// Performance monitoring hooks
