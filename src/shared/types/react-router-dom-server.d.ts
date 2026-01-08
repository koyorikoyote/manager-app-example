// Minimal module declaration to satisfy TypeScript for SSR import
// React Router v7 provides a server subpath export. Some TS setups using CommonJS or older
// moduleResolution may not resolve its types out-of-the-box. This shim avoids type errors.
declare module "react-router-dom/server" {
  import * as React from "react";
  export interface StaticRouterProps {
    location?: string | Partial<Location> | URL;
    basename?: string;
    children?: React.ReactNode;
  }
  export const StaticRouter: React.ComponentType<StaticRouterProps>;
}
