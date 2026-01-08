import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useResponsive } from "./useResponsive";

export interface UseResponsiveNavigationReturn {
  isMobile: boolean;
  navigateToDetail: (
    id: string,
    type: "staff" | "destination" | "property"
  ) => void;
  navigateToNew: (type: "staff" | "destination" | "property") => void;
  navigateToEdit: (
    id: string,
    type: "staff" | "destination" | "property"
  ) => void;
  handleClose: () => void;
  createCloseHandler: (isEditMode?: boolean) => () => void;
  handlePostDeleteNavigation: (
    type: "staff" | "destination" | "property"
  ) => void;
  handlePostCreateNavigation: (
    type: "staff" | "destination" | "property",
    id: string
  ) => void;
  handlePostUpdateNavigation: (
    type: "staff" | "destination" | "property",
    id: string
  ) => void;
}

/**
 * Hook for responsive navigation between dialogs and pages
 * Handles viewport detection and navigation logic for detail, new, and edit pages
 */
export const useResponsiveNavigation = (): UseResponsiveNavigationReturn => {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  // Navigate to detail page
  const navigateToDetail = useCallback(
    (id: string, type: "staff" | "destination" | "property") => {
      // Generate URL inline to ensure synchronous execution
      let url: string;
      switch (type) {
        case "staff":
          url = `/staff/${id}`;
          break;
        case "destination":
          url = `/destinations/${id}`;
          break;
        case "property":
          url = `/residences/${id}`;
          break;
        default:
          throw new Error(`Unknown entity type: ${type}`);
      }

      if (isMobile) {
        // Mobile: navigate in same window
        navigate(url);
      } else {
        // Desktop: use anchor element approach to avoid popup blockers
        // Add a parameter to indicate this was opened in a new tab
        const urlWithParam = url.includes("?")
          ? `${url}&openedInNewTab=true`
          : `${url}?openedInNewTab=true`;
        const link = document.createElement("a");
        link.href = urlWithParam;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    [isMobile, navigate]
  );

  // Navigate to new page
  const navigateToNew = useCallback(
    (type: "staff" | "destination" | "property") => {
      // Generate URL inline to ensure synchronous execution
      let url: string;
      switch (type) {
        case "staff":
          url = `/staff/new`;
          break;
        case "destination":
          url = `/destinations/new`;
          break;
        case "property":
          url = `/residences/new`;
          break;
        default:
          throw new Error(`Unknown entity type: ${type}`);
      }

      if (isMobile) {
        // Mobile: navigate in same window
        navigate(url);
      } else {
        // Desktop: use anchor element approach to avoid popup blockers
        // Add a parameter to indicate this was opened in a new tab
        const urlWithParam = url.includes("?")
          ? `${url}&openedInNewTab=true`
          : `${url}?openedInNewTab=true`;
        const link = document.createElement("a");
        link.href = urlWithParam;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    [isMobile, navigate]
  );

  // Navigate to edit page
  const navigateToEdit = useCallback(
    (id: string, type: "staff" | "destination" | "property") => {
      // Generate URL inline to ensure synchronous execution
      let url: string;
      switch (type) {
        case "staff":
          url = `/staff/${id}/edit`;
          break;
        case "destination":
          url = `/destinations/${id}/edit`;
          break;
        case "property":
          url = `/residences/${id}/edit`;
          break;
        default:
          throw new Error(`Unknown entity type: ${type}`);
      }

      if (isMobile) {
        // Mobile: navigate in same window
        navigate(url);
      } else {
        // Desktop: use anchor element approach to avoid popup blockers
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    [isMobile, navigate]
  );

  // Handle close/back navigation
  const handleClose = useCallback(() => {
    if (window.history.length > 1) {
      // Go back if there's history
      window.history.back();
    } else {
      // Fallback to home or appropriate list page
      navigate("/");
    }
  }, [navigate]);

  // Create a close handler that can close tabs when opened in new tab
  const createCloseHandler = useCallback(
    (isEditMode: boolean = false) => {
      return () => {
        // Check if this page was opened in a new tab by looking for URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const isNewTab = urlParams.get("openedInNewTab") === "true";

        if (isNewTab && !isEditMode) {
          // Try to close the current tab
          try {
            window.close();

            // If window.close() doesn't work (some browsers prevent it),
            // show a message or fallback to navigation
            setTimeout(() => {
              // If we're still here after 100ms, window.close() didn't work
              if (!window.closed) {
                // Fallback: navigate to a blank page or show a message
                document.body.innerHTML = `
                  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, -apple-system, sans-serif; text-align: center; color: #374151;">
                    <h2 style="margin-bottom: 16px; color: #1f2937;">You can close this tab</h2>
                    <p style="margin-bottom: 24px; color: #6b7280;">This page was opened in a new tab. You can safely close it now.</p>
                    <button onclick="window.close()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Close Tab</button>
                  </div>
                `;
              }
            }, 100);
          } catch (error) {
            console.log("Could not close tab automatically:", error);
            // Fallback to normal navigation
            handleClose();
          }
        } else {
          // Use normal navigation behavior
          handleClose();
        }
      };
    },
    [handleClose]
  );

  // Helper function to navigate to the appropriate list page
  const navigateToListPage = useCallback(
    (type: "staff" | "destination" | "property") => {
      switch (type) {
        case "staff":
          navigate("/staff");
          break;
        case "destination":
          navigate("/destinations");
          break;
        case "property":
          navigate("/residences");
          break;
        default:
          navigate("/");
      }
    },
    [navigate]
  );

  // Handle navigation after successful delete
  const handlePostDeleteNavigation = useCallback(
    (type: "staff" | "destination" | "property") => {
      // Check if this page was opened in a new tab by looking for URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const isNewTab = urlParams.get("openedInNewTab") === "true";

      // Always trigger refresh event for other tabs
      const refreshEvent = {
        type: "RECORD_DELETED",
        entityType: type,
        timestamp: Date.now(),
      };
      localStorage.setItem("crossTabRefresh", JSON.stringify(refreshEvent));
      // Remove the item immediately to ensure the event fires
      localStorage.removeItem("crossTabRefresh");

      if (isNewTab) {
        // Close the tab if it was opened in a new tab
        try {
          window.close();

          // Fallback if window.close() doesn't work
          setTimeout(() => {
            if (!window.closed) {
              // Show success message and close option
              document.body.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, -apple-system, sans-serif; text-align: center; color: #374151;">
                  <div style="margin-bottom: 24px; color: #059669;">
                    <svg style="width: 48px; height: 48px; margin: 0 auto 16px;" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <h2 style="margin-bottom: 16px; color: #1f2937;">Record deleted successfully</h2>
                  <p style="margin-bottom: 24px; color: #6b7280;">You can close this tab now.</p>
                  <button onclick="window.close()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Close Tab</button>
                </div>
              `;
            }
          }, 100);
        } catch (error) {
          console.log("Could not close tab automatically:", error);
          // Fallback to normal navigation
          navigateToListPage(type);
        }
      } else {
        // Normal navigation to list page
        navigateToListPage(type);
      }
    },
    [navigateToListPage]
  );

  // Helper function to get detail URL
  const getDetailUrl = useCallback(
    (type: "staff" | "destination" | "property", id: string) => {
      switch (type) {
        case "staff":
          return `/staff/${id}`;
        case "destination":
          return `/destinations/${id}`;
        case "property":
          return `/residences/${id}`;
        default:
          throw new Error(`Unknown entity type: ${type}`);
      }
    },
    []
  );

  // Handle navigation after successful create
  const handlePostCreateNavigation = useCallback(
    (type: "staff" | "destination" | "property", id: string) => {
      // Check if this page was opened in a new tab by looking for URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const isNewTab = urlParams.get("openedInNewTab") === "true";

      // Always trigger refresh event for other tabs
      const refreshEvent = {
        type: "RECORD_CREATED",
        entityType: type,
        timestamp: Date.now(),
      };
      localStorage.setItem("crossTabRefresh", JSON.stringify(refreshEvent));
      // Remove the item immediately to ensure the event fires
      localStorage.removeItem("crossTabRefresh");

      if (isNewTab) {
        // Close the tab if it was opened in a new tab
        try {
          window.close();

          // Fallback if window.close() doesn't work
          setTimeout(() => {
            if (!window.closed) {
              // Show success message and close option
              document.body.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, -apple-system, sans-serif; text-align: center; color: #374151;">
                  <div style="margin-bottom: 24px; color: #059669;">
                    <svg style="width: 48px; height: 48px; margin: 0 auto 16px;" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <h2 style="margin-bottom: 16px; color: #1f2937;">Record created successfully</h2>
                  <p style="margin-bottom: 24px; color: #6b7280;">You can close this tab now.</p>
                  <button onclick="window.close()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Close Tab</button>
                </div>
              `;
            }
          }, 100);
        } catch (error) {
          console.log("Could not close tab automatically:", error);
          // Fallback to normal navigation
          navigateToListPage(type);
        }
      } else {
        // Normal navigation to detail page
        const url = getDetailUrl(type, id);
        navigate(url);
      }
    },
    [navigateToListPage, navigate, getDetailUrl]
  );

  // Handle navigation after successful update
  const handlePostUpdateNavigation = useCallback(
    (type: "staff" | "destination" | "property", id: string) => {
      // Check if this page was opened in a new tab by looking for URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const isNewTab = urlParams.get("openedInNewTab") === "true";

      // Always trigger refresh event for other tabs (regardless of tab context)
      const refreshEvent = {
        type: "RECORD_UPDATED",
        entityType: type,
        timestamp: Date.now(),
      };

      localStorage.setItem("crossTabRefresh", JSON.stringify(refreshEvent));
      // Remove the item immediately to ensure the event fires
      localStorage.removeItem("crossTabRefresh");

      // Navigate to detail view
      const url = getDetailUrl(type, id);

      if (isMobile) {
        // In mobile mode, navigate to detail page with special state
        // indicating it came from save operation
        const listUrl =
          type === "staff"
            ? "/staff"
            : type === "destination"
            ? "/destinations"
            : "/residences";

        navigate(url, {
          replace: true,
          state: {
            fromSaveOperation: true,
            backToListUrl: listUrl,
          },
        });
      } else {
        // In web view mode (non-mobile), always append openedInNewTab=true
        const shouldAppendParam = !isMobile || isNewTab;
        const urlWithParam = shouldAppendParam
          ? url.includes("?")
            ? `${url}&openedInNewTab=true`
            : `${url}?openedInNewTab=true`
          : url;

        // Use replace: true to replace the edit page in history
        navigate(urlWithParam, { replace: true });
      }
    },
    [navigate, getDetailUrl, isMobile]
  );

  return {
    isMobile,
    navigateToDetail,
    navigateToNew,
    navigateToEdit,
    handleClose,
    createCloseHandler,
    handlePostDeleteNavigation,
    handlePostCreateNavigation,
    handlePostUpdateNavigation,
  };
};
