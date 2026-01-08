/**
 * Shared styling constants for consistent card design across all card components
 */

// Card layout and spacing constants
export const CARD_STYLES = {
  // Base card styling
  base: "cursor-pointer min-h-[32px] transition-all duration-200 ease-in-out",

  // Hover and focus effects
  hover:
    "hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:scale-[1.02]",

  // Active states for touch devices
  active: "active:scale-[0.98] touch:active:scale-[0.95]",

  // Content padding - responsive
  contentPadding: "p-3 sm:p-4 md:p-6",

  // Header section spacing
  headerSpacing: "mb-3",

  // Content section spacing
  contentSpacing: "space-y-2 mb-3",

  // Footer section styling
  footer: "pt-2 border-t border-gray-100",
} as const;

// Typography constants
export const TYPOGRAPHY = {
  // Primary title
  title: "text-base sm:text-lg font-semibold text-secondary-900 mb-1 truncate",

  // Secondary text (company, date)
  subtitle: "text-xs sm:text-sm text-secondary-600 truncate",

  // Content labels
  label: "font-medium",

  // Content text
  content: "text-xs sm:text-sm text-secondary-600",

  // Footer content
  footerContent: "text-xs sm:text-sm text-secondary-600",

  // Truncated text in footer
  footerText: "text-secondary-700 leading-relaxed",
} as const;

// Layout constants
export const LAYOUT = {
  // Header layout
  header: "flex items-start justify-between",

  // Title container
  titleContainer: "flex-1 min-w-0",

  // Badge container
  badgeContainer: "flex flex-col items-end ml-3 flex-shrink-0",

  // Multiple badges spacing
  multipleBadges: "flex flex-col items-end space-y-1 ml-3 flex-shrink-0",

  // Content grid - responsive
  contentGrid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2",

  // Content item
  contentItem: "truncate",
} as const;

// Status badge color schemes
export const STATUS_COLORS = {
  // Progress status colors
  progress: {
    open: "bg-red-100 text-red-800",
    closed: "bg-green-100 text-green-800",
    on_hold: "bg-yellow-100 text-yellow-800",
    default: "bg-gray-100 text-gray-800",
  },

  // Condition status colors
  condition: {
    excellent: "bg-green-100 text-green-800",
    good: "bg-blue-100 text-blue-800",
    fair: "bg-yellow-100 text-yellow-800",
    poor: "bg-red-100 text-red-800",
    default: "bg-gray-100 text-gray-800",
  },

  // Inquiry type colors
  inquiryType: {
    general: "bg-blue-100 text-blue-800",
    technical: "bg-purple-100 text-purple-800",
    billing: "bg-orange-100 text-orange-800",
    support: "bg-teal-100 text-teal-800",
    complaint: "bg-red-100 text-red-800",
    default: "bg-gray-100 text-gray-800",
  },

  // Staff status colors
  staffStatus: {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    terminated: "bg-red-100 text-red-800",
    on_leave: "bg-yellow-100 text-yellow-800",
    default: "bg-gray-100 text-gray-800",
  },

  // Company status colors
  companyStatus: {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    suspended: "bg-red-100 text-red-800",
    default: "bg-gray-100 text-gray-800",
  },

  // Property status colors
  propertyStatus: {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    default: "bg-gray-100 text-gray-800",
  },

  // Interaction type colors
  interactionType: {
    discussion: "bg-secondary-100 text-secondary-800",
    interview: "bg-purple-100 text-purple-800",
    consultation: "bg-primary-100 text-primary-800",
    other: "bg-orange-100 text-orange-800",
    default: "bg-secondary-100 text-secondary-800",
  },

  // Interaction status colors
  interactionStatus: {
    open: "bg-yellow-100 text-yellow-800",
    "in-progress": "bg-primary-100 text-primary-800",
    resolved: "bg-green-100 text-green-800",
    default: "bg-secondary-100 text-secondary-800",
  },

  // Complaint status colors
  complaintStatus: {
    open: "bg-red-100 text-red-800",
    closed: "bg-green-100 text-green-800",
    on_hold: "bg-yellow-100 text-yellow-800",
    default: "bg-gray-100 text-gray-800",
  },

  // Urgency level colors
  urgencyLevel: {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
    default: "bg-gray-100 text-gray-800",
  },
} as const;

// Badge styling
export const BADGE_STYLES = {
  base: "px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap",
  interactive: "transition-colors duration-200",
} as const;

// Loading skeleton styles
export const SKELETON_STYLES = {
  base: "animate-pulse bg-gray-200 rounded",
  title: "h-5 w-3/4 mb-2",
  subtitle: "h-4 w-1/2 mb-3",
  content: "h-4 w-full mb-2",
  badge: "h-6 w-16 rounded-full",
  footer: "h-4 w-full",
} as const;

// Empty state styles
export const EMPTY_STATE = {
  placeholder: "--",
  className: "text-secondary-500 italic",
} as const;

// Enhanced touch interaction constants for mobile optimization
export const TOUCH_TARGETS = {
  // Minimum touch target sizes (44px is iOS/Android standard)
  minHeight: "min-h-[44px]",
  minWidth: "min-w-[44px]",

  // Enhanced touch target sizes for better accessibility
  enhanced: {
    minHeight: "min-h-[48px]",
    minWidth: "min-w-[48px]",
  },

  // Touch-friendly padding
  padding: "p-2",
  enhancedPadding: "p-3",

  // Touch feedback states
  touchFeedback: {
    // Active state for touch devices with reduced scale
    active: "active:scale-[0.96] touch:active:scale-[0.94]",
    // Hover states for desktop with subtle effects
    hover: "hover:bg-gray-50 hover:shadow-sm",
    // Focus states for keyboard navigation
    focus:
      "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-1",
    // Combined interactive states
    interactive:
      "transition-all duration-150 ease-out active:scale-[0.96] touch:active:scale-[0.94] hover:bg-gray-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-1",
  },

  // Gesture support
  gestures: {
    // Prevent text selection during touch interactions
    noSelect: "select-none",
    // Smooth scrolling for touch devices
    smoothScroll: "scroll-smooth",
    // Overscroll behavior for mobile
    overscrollContain: "overscroll-contain",
  },
} as const;

// Dialog-specific styling constants with enhanced touch interactions
export const DIALOG_STYLES = {
  // Scrollable content area with enhanced touch scrolling
  scrollableContent:
    "flex-1 overflow-y-auto overscroll-contain min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 scroll-smooth",

  // Content wrapper with proper spacing
  contentWrapper: "space-y-6",

  // Header section (fixed) with touch-friendly spacing
  header:
    "flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 flex-shrink-0 min-h-[60px]",

  // Footer section (fixed) with enhanced touch targets
  footer:
    "flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex-shrink-0 min-h-[80px]",

  // Dialog container with touch-optimized animations
  container:
    "relative w-full bg-white rounded-xl shadow-2xl animate-in zoom-in-95 fade-in duration-200 flex flex-col touch-pan-y",

  // Enhanced close button with better touch feedback
  closeButton:
    "p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 active:scale-95 rounded-lg transition-all duration-150 flex-shrink-0 min-h-[48px] min-w-[48px] flex items-center justify-center select-none",

  // Title styling with better spacing
  title:
    "text-lg sm:text-xl font-semibold text-secondary-900 truncate pr-4 select-none",

  // Responsive padding for content with touch considerations
  contentPadding: "p-4 sm:p-6",

  // Touch-optimized interactive elements
  touchInteractive: {
    // Standard interactive element
    base: "transition-all duration-150 ease-out select-none",
    // Button-like elements
    button:
      "min-h-[44px] min-w-[44px] p-2 rounded-lg transition-all duration-150 ease-out active:scale-95 select-none",
    // Link-like elements
    link: "min-h-[44px] p-2 rounded transition-colors duration-150 ease-out active:bg-gray-100 select-none",
    // Badge-like elements
    badge:
      "min-h-[32px] px-3 py-1 rounded-full transition-all duration-150 ease-out active:scale-95 select-none",
  },

  // Scroll indicators for mobile
  scrollIndicators: {
    // Top scroll indicator
    top: "absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-white to-transparent pointer-events-none z-10",
    // Bottom scroll indicator
    bottom:
      "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-t from-white to-transparent pointer-events-none z-10",
  },

  // Standardized dialog layout patterns
  layout: {
    // Header with icon, title, badges, and actions - standardized spacing
    headerWithActions: "flex items-start justify-between gap-4",
    // Icon and title container - consistent flex layout
    iconTitleContainer: "flex items-start space-x-3 flex-1 min-w-0",
    // Badge container with standardized spacing
    badgeContainer: "flex flex-wrap items-center gap-2 mb-3",
    // Action buttons container (Edit/Delete) - standardized positioning
    actionButtons: "flex flex-col space-y-2 ml-4 flex-shrink-0",
    // Content sections with consistent spacing
    contentSections: "space-y-6",
    // Details grid for information display - responsive and consistent
    detailsGrid: "grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm",
    // Form sections with standardized spacing
    formSections: "space-y-6",
    // Form field groups with consistent styling
    formFieldGroup: "space-y-4",
  },

  // Standardized section headers
  sectionHeaders: {
    // Main section header with consistent styling
    main: "text-lg font-medium text-secondary-900 border-b border-neutral-200 pb-2 mb-4",
    // Sub-section header for content areas
    sub: "text-sm font-medium text-secondary-700 mb-2 flex items-center space-x-2",
    // Detail section header
    detail:
      "text-sm font-medium text-secondary-700 border-b border-secondary-200 pb-2 mb-4",
  },

  // Standardized content containers
  contentContainers: {
    // Primary content container with background
    primary: "bg-secondary-50 p-4 rounded-lg",
    // Secondary content container
    secondary: "bg-gray-50 p-3 rounded-md",
    // Information display container
    info: "space-y-2 text-sm",
    // Status information container
    status: "grid grid-cols-1 md:grid-cols-2 gap-3 text-sm",
  },

  // Dialog action button styles - standardized
  actionButtons: {
    // Edit button styling - consistent across all dialogs
    edit: "text-xs min-h-[44px] min-w-[88px] px-3 active:scale-95 transition-transform duration-150 touch:active:scale-90 select-none",
    // Delete button styling - consistent danger styling
    delete:
      "text-xs text-red-600 hover:text-red-700 hover:border-red-300 min-h-[44px] min-w-[88px] px-3 active:scale-95 transition-transform duration-150 touch:active:scale-90 select-none focus:ring-red-500/20 focus:border-red-400",
    // Form submit button - consistent primary styling
    submit:
      "min-h-[48px] px-6 font-medium transition-all duration-150 active:scale-95 select-none",
    // Form cancel button - consistent secondary styling
    cancel:
      "min-h-[48px] px-6 transition-all duration-150 active:scale-95 select-none",
  },

  // Standardized status badge styling
  statusBadges: {
    // Enhanced badge with consistent touch feedback
    enhanced:
      "min-h-[32px] px-3 py-1.5 select-none cursor-default transition-transform duration-150 active:scale-95 touch:active:scale-90 border",
    // Badge container for multiple badges - consistent spacing
    container: "flex flex-wrap items-center gap-2 mb-3",
    // Large badge for prominent status display
    large: "min-h-[36px] px-4 py-2 text-sm font-medium border",
  },

  // Standardized form styling
  form: {
    // Form container with consistent spacing
    container: "space-y-6",
    // Field wrapper with standardized spacing
    fieldWrapper: "space-y-2",
    // Field group wrapper for related fields
    fieldGroup: "grid grid-cols-1 md:grid-cols-2 gap-4",
    // Error message styling - consistent across all forms
    errorMessage: "text-sm text-red-600 flex items-center mt-1",
    // Success message styling - consistent feedback
    successMessage: "bg-green-50 border border-green-200 rounded-lg p-4 mb-4",
    // General error container - consistent error display
    errorContainer: "bg-red-50 border border-red-200 rounded-lg p-4 mb-4",
    // Form input with enhanced touch targets - standardized
    input:
      "block w-full rounded-lg border-gray-300 shadow-sm transition-all duration-200 focus:border-primary-500 focus:ring-primary-500 focus:ring-1 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed min-h-[48px] px-4 py-3 text-base active:bg-gray-50 touch:active:bg-gray-50 placeholder:text-gray-400",
    // Form textarea with enhanced touch targets - standardized
    textarea:
      "block w-full rounded-lg border-gray-300 shadow-sm transition-all duration-200 focus:border-primary-500 focus:ring-primary-500 focus:ring-1 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed min-h-[96px] px-4 py-3 text-base resize-vertical active:bg-gray-50 touch:active:bg-gray-50 placeholder:text-gray-400",
    // Form select with enhanced touch targets - standardized
    select:
      "block w-full rounded-lg border-gray-300 shadow-sm transition-all duration-200 focus:border-primary-500 focus:ring-primary-500 focus:ring-1 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed min-h-[48px] px-4 py-3 text-base active:bg-gray-50 touch:active:bg-gray-50 cursor-pointer",
    // Form label styling - consistent across all forms
    label: "block text-sm font-medium text-gray-700 mb-1",
    // Required field indicator - consistent styling
    required: "text-red-500 ml-1",
  },

  // Standardized navigation patterns
  navigation: {
    // Detail to form navigation - consistent button styling
    editButton: "flex items-center space-x-1 text-xs font-medium",
    // Form to detail navigation - consistent back button
    backButton:
      "flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800",
    // Action button container - consistent positioning
    actionContainer: "flex items-center justify-between",
  },

  // Animation and transition constants - standardized
  animations: {
    // Dialog entrance animation - consistent timing
    entrance: "animate-in zoom-in-95 fade-in duration-200",
    // Dialog exit animation - consistent timing
    exit: "animate-out zoom-out-95 fade-out duration-150",
    // Button press animation - consistent feedback
    buttonPress: "active:scale-95 transition-transform duration-150",
    // Touch feedback animation - consistent mobile interaction
    touchFeedback: "touch:active:scale-90 transition-transform duration-100",
    // Hover animation for desktop - consistent desktop interaction
    hover: "hover:shadow-sm hover:bg-gray-50 transition-all duration-150",
  },
} as const;
