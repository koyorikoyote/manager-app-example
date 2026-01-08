import React, { createContext, useContext, ReactNode } from 'react';

interface SSRData {
  routeType: string;
  stats: {
    users: number;
    staff: number;
    properties: number;
  };
  timestamp: string;
  error?: string;
  // Route-specific data
  properties?: any[];
  companies?: any[];
  total?: number;
  property?: any;
  company?: any;
  staff?: any[];
  users?: any[];
  recentActivities?: {
    recentStaff: any[];
    recentProperties: any[];
  };
  systemConfigurations?: any[];
  // New data types for dashboard pages
  complaintDetails?: any[];
  complaintDetail?: any;
  dailyRecords?: any[];
  dailyRecord?: any;
  inquiries?: any[];
  inquiry?: any;
}

interface SSRDataContextType {
  initialData: SSRData | null;
  getInitialData: () => SSRData | null;
}

const SSRDataContext = createContext<SSRDataContextType | undefined>(undefined);

interface SSRDataProviderProps {
  children: ReactNode;
  initialData?: SSRData;
}

export const SSRDataProvider: React.FC<SSRDataProviderProps> = ({
  children,
  initialData
}) => {
  // Get initial data from props (SSR) or window (client hydration)
  const getInitialData = (): SSRData | null => {
    if (initialData) {
      return initialData;
    }

    // Try to get data from globalThis if available (client-side hydration)
    const w = (globalThis as any).window;
    if (typeof w !== 'undefined' && w.__INITIAL_DATA__) {
      return w.__INITIAL_DATA__;
    }

    return null;
  };

  const contextValue: SSRDataContextType = {
    initialData: getInitialData(),
    getInitialData
  };

  return (
    <SSRDataContext.Provider value={contextValue}>
      {children}
    </SSRDataContext.Provider>
  );
};

export const useSSRData = (): SSRDataContextType => {
  const context = useContext(SSRDataContext);
  if (context === undefined) {
    throw new Error('useSSRData must be used within a SSRDataProvider');
  }
  return context;
};

// Hook to get initial data for a specific route type
export const useInitialDataForRoute = (routeType: string) => {
  const { initialData } = useSSRData();

  if (initialData?.routeType === routeType) {
    return initialData;
  }

  return null;
};
