/* Server-only shim to avoid type-checking the entire client bundle when importing App for SSR.
   This prevents tsc (ts-node) from crawling client modules that rely on DOM types. */
declare module "../client/App" {
  const App: any;
  export default App;
}
