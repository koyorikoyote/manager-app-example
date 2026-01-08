import { renderHook, act } from "@testing-library/react";
import { useViewMode } from "../useViewMode";
import { useResponsive } from "../useResponsive";
import { useSessionStorage } from "../useSessionStorage";

// Mock the dependencies
jest.mock("../useResponsive");
jest.mock("../useSessionStorage");

const mockUseResponsive = useResponsive as jest.MockedFunction<
  typeof useResponsive
>;
const mockUseSessionStorage = useSessionStorage as jest.MockedFunction<
  typeof useSessionStorage
>;

describe("useViewMode", () => {
  const mockSetViewMode = jest.fn();
  const mockSetStoredViewMode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock for useSessionStorage
    mockUseSessionStorage.mockReturnValue(["cards", mockSetViewMode]);
  });

  it("should default to cards on mobile", () => {
    mockUseResponsive.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isLargeDesktop: false,
      width: 375,
      height: 667,
    });

    // Mock the session storage calls
    let callCount = 0;
    mockUseSessionStorage.mockImplementation((key, defaultValue) => {
      callCount++;
      if (callCount === 1) {
        // First call for stored mobile preference
        return ["cards", mockSetStoredViewMode];
      } else {
        // Second call for main view mode
        return ["cards", mockSetViewMode];
      }
    });

    const { result } = renderHook(() => useViewMode("test-page"));

    expect(result.current.viewMode).toBe("cards");
    expect(result.current.isMobile).toBe(true);
  });

  it("should default to table on desktop", () => {
    mockUseResponsive.mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isLargeDesktop: false,
      width: 1024,
      height: 768,
    });

    // Mock the session storage calls
    let callCount = 0;
    mockUseSessionStorage.mockImplementation((key, defaultValue) => {
      callCount++;
      if (callCount === 1) {
        // First call for stored mobile preference
        return ["cards", mockSetStoredViewMode];
      } else {
        // Second call for main view mode - should default to table on desktop
        return ["table", mockSetViewMode];
      }
    });

    const { result } = renderHook(() => useViewMode("test-page"));

    expect(result.current.viewMode).toBe("table");
    expect(result.current.isMobile).toBe(false);
  });

  it("should call setViewMode when view mode changes", () => {
    mockUseResponsive.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isLargeDesktop: false,
      width: 375,
      height: 667,
    });

    // Mock the session storage calls
    let callCount = 0;
    mockUseSessionStorage.mockImplementation((key, defaultValue) => {
      callCount++;
      if (callCount === 1) {
        return ["cards", mockSetStoredViewMode];
      } else {
        return ["cards", mockSetViewMode];
      }
    });

    const { result } = renderHook(() => useViewMode("test-page"));

    act(() => {
      result.current.setViewMode("table");
    });

    expect(mockSetViewMode).toHaveBeenCalledWith("table");
    expect(mockSetStoredViewMode).toHaveBeenCalledWith("table");
  });

  it("should use separate storage keys for different pages", () => {
    mockUseResponsive.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isLargeDesktop: false,
      width: 375,
      height: 667,
    });

    renderHook(() => useViewMode("staff-page"));

    expect(mockUseSessionStorage).toHaveBeenCalledWith(
      "viewMode_staff-page_mobile",
      "cards"
    );
    expect(mockUseSessionStorage).toHaveBeenCalledWith(
      "viewMode_staff-page",
      "cards"
    );
  });
});
