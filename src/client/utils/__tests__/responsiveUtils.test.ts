/**
 * Tests for responsive utilities
 */

import {
  shouldShowSearchComponent,
  getDefaultViewMode,
  shouldUseSidebarOverlay,
  getNavigationMode,
  getNavigationItemsByLocation,
  getNavigationItemsByPriority,
  MOBILE_HIDDEN_SEARCH_PAGES,
  NAVIGATION_CONFIG,
} from "../responsiveUtils";

describe("responsiveUtils", () => {
  describe("shouldShowSearchComponent", () => {
    it("should show search component on desktop for all pages", () => {
      MOBILE_HIDDEN_SEARCH_PAGES.forEach((pageName) => {
        expect(shouldShowSearchComponent(pageName, false)).toBe(true);
      });
    });

    it("should hide search component on mobile for hidden pages", () => {
      MOBILE_HIDDEN_SEARCH_PAGES.forEach((pageName) => {
        expect(shouldShowSearchComponent(pageName, true)).toBe(false);
      });
    });

    it("should show search component on mobile for non-hidden pages", () => {
      expect(shouldShowSearchComponent("other-page", true)).toBe(true);
      expect(shouldShowSearchComponent("custom-page", true)).toBe(true);
    });
  });

  describe("getDefaultViewMode", () => {
    it("should return card mode for mobile", () => {
      expect(getDefaultViewMode(true, false)).toBe("card");
    });

    it("should return card mode for tablet", () => {
      expect(getDefaultViewMode(false, true)).toBe("card");
    });

    it("should return table mode for desktop", () => {
      expect(getDefaultViewMode(false, false)).toBe("table");
    });
  });

  describe("shouldUseSidebarOverlay", () => {
    it("should use overlay on mobile", () => {
      expect(shouldUseSidebarOverlay(true, false)).toBe(true);
    });

    it("should use overlay on tablet", () => {
      expect(shouldUseSidebarOverlay(false, true)).toBe(true);
    });

    it("should not use overlay on desktop", () => {
      expect(shouldUseSidebarOverlay(false, false)).toBe(false);
    });
  });

  describe("getNavigationMode", () => {
    it("should return mobile mode for small screens", () => {
      expect(getNavigationMode(500)).toBe("mobile");
      expect(getNavigationMode(767)).toBe("mobile");
    });

    it("should return hybrid mode for medium screens", () => {
      expect(getNavigationMode(768)).toBe("hybrid");
      expect(getNavigationMode(1000)).toBe("hybrid");
    });

    it("should return desktop mode for large screens", () => {
      expect(getNavigationMode(1024)).toBe("desktop");
      expect(getNavigationMode(1440)).toBe("desktop");
    });
  });

  describe("getNavigationItemsByLocation", () => {
    it("should return header navigation items", () => {
      const headerItems = getNavigationItemsByLocation("header");
      expect(headerItems).toHaveLength(3);
      expect(headerItems.map((item) => item.id)).toEqual([
        "staff",
        "daily-record",
        "inquiries-notifications",
      ]);
    });

    it("should return sidebar navigation items", () => {
      const sidebarItems = getNavigationItemsByLocation("sidebar");
      expect(sidebarItems).toHaveLength(6);
      expect(sidebarItems.map((item) => item.id)).toEqual([
        "destinations",
        "interactions",
        "properties",
        "summary",
        "attendance",
        "manual",
      ]);
    });
  });

  describe("getNavigationItemsByPriority", () => {
    it("should return primary navigation items", () => {
      const primaryItems = getNavigationItemsByPriority("primary");
      expect(primaryItems).toHaveLength(6);
      expect(primaryItems.every((item) => item.priority === "primary")).toBe(
        true
      );
    });

    it("should return secondary navigation items", () => {
      const secondaryItems = getNavigationItemsByPriority("secondary");
      expect(secondaryItems).toHaveLength(3);
      expect(
        secondaryItems.every((item) => item.priority === "secondary")
      ).toBe(true);
    });
  });

  describe("NAVIGATION_CONFIG", () => {
    it("should have correct structure", () => {
      expect(NAVIGATION_CONFIG).toHaveLength(9);

      // Check that all required properties exist
      NAVIGATION_CONFIG.forEach((item) => {
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("label");
        expect(item).toHaveProperty("path");
        expect(item).toHaveProperty("location");
        expect(item).toHaveProperty("priority");
        expect(item).toHaveProperty("mobileVisible");
        expect(item).toHaveProperty("desktopVisible");
      });
    });

    it("should have correct header items", () => {
      const headerItems = NAVIGATION_CONFIG.filter(
        (item) => item.location === "header"
      );
      expect(headerItems).toHaveLength(3);
      expect(headerItems.map((item) => item.id)).toEqual([
        "staff",
        "daily-record",
        "inquiries-notifications",
      ]);
    });

    it("should have correct sidebar items", () => {
      const sidebarItems = NAVIGATION_CONFIG.filter(
        (item) => item.location === "sidebar"
      );
      expect(sidebarItems).toHaveLength(6);
      expect(sidebarItems.map((item) => item.id)).toEqual([
        "destinations",
        "interactions",
        "properties",
        "summary",
        "attendance",
        "manual",
      ]);
    });
  });
});
