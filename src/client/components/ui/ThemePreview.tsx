import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from './Button';
import { Text } from './Text';
import { useLanguage } from '../../contexts/LanguageContext';
import { ColorTheme } from '../../contexts/SettingsContext';
import { previewTheme } from '../../utils/themeUtils';

interface ThemePreviewProps {
    themeId: ColorTheme;
    isActive: boolean;
    onPreview?: (themeId: ColorTheme) => void;
    onStopPreview?: () => void;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({
    themeId,
    isActive,
    onPreview,
    onStopPreview,
}) => {
    const { t } = useLanguage();
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [restoreFunction, setRestoreFunction] = useState<(() => void) | null>(null);

    useEffect(() => {
        return () => {
            if (restoreFunction) {
                restoreFunction();
            }
        };
    }, [restoreFunction]);

    const handlePreview = () => {
        if (isPreviewing) {
            // Stop preview
            if (restoreFunction) {
                restoreFunction();
                setRestoreFunction(null);
            }
            setIsPreviewing(false);
            onStopPreview?.();
        } else {
            // Start preview
            const restore = previewTheme(themeId);
            if (restore) {
                setRestoreFunction(() => restore);
                setIsPreviewing(true);
                onPreview?.(themeId);
            }
        }
    };

    if (isActive) {
        return null; // Don't show preview button for active theme
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            className="flex items-center space-x-1 text-xs"
        >
            {isPreviewing ? (
                <>
                    <EyeOff className="h-3 w-3" />
                    <span>{t('settings.stopPreview')}</span>
                </>
            ) : (
                <>
                    <Eye className="h-3 w-3" />
                    <span>{t('settings.preview')}</span>
                </>
            )}
        </Button>
    );
};