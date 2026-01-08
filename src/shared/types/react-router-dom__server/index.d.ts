/* eslint-disable */

declare module "react-router-dom/server" {
  import * as React from "react";
  export interface StaticRouterProps {
    location?: string | Partial<Location> | URL;
    basename?: string;
    children?: React.ReactNode;
  }
  export const StaticRouter: React.ComponentType<StaticRouterProps>;
}
