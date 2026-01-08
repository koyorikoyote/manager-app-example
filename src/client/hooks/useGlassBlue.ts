import { useSettings } from '../contexts/SettingsContext';

/**
 * Hook to check if Glass Blue theme is currently active
 * @returns boolean indicating if Glass Blue theme is active
 */
export const useGlassBlue = (): boolean => {
  const { preferences } = useSettings();
  return preferences.colorTheme === 'glass-blue';
};