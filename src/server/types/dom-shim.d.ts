/* Minimal DOM globals shim for server-side TypeScript compilation
   This prevents TS2304 "Cannot find name 'window'" (and related) when
   server compiles modules that reference browser globals. These are
   intentionally typed as `any` to avoid pulling DOM libs into the server build.
*/

declare global {
  // Allow arbitrary properties for runtime feature flags we attach (e.g., __INITIAL_DATA__, __locale_t)
  interface Window {
    [key: string]: any;
  }
  const window: Window & any;
  const document: any;
  const navigator: any;
}

export {};
