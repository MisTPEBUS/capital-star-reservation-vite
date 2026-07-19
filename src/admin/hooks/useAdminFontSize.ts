import { useCallback, useEffect, useState } from "react";

const ADMIN_FONT_SIZE_STORAGE_KEY = "admin-font-size";
const DEFAULT_FONT_SIZE = 18;
const FONT_SIZE_STEP = 2;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 24;

function clampFontSize(value: number) {
  return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, value));
}

function readStoredFontSize() {
  const storedValue = localStorage.getItem(ADMIN_FONT_SIZE_STORAGE_KEY);
  const legacyFontSizes: Record<string, number> = {
    small: 14,
    normal: 16,
    large: 18,
  };

  if (storedValue && storedValue in legacyFontSizes) {
    return legacyFontSizes[storedValue];
  }

  const parsedValue = Number(storedValue);

  return Number.isFinite(parsedValue)
    ? clampFontSize(parsedValue)
    : DEFAULT_FONT_SIZE;
}

export function useAdminFontSize() {
  const [fontSize, setFontSize] = useState(readStoredFontSize);

  useEffect(() => {
    const previousFontSize = document.documentElement.style.fontSize;

    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem(ADMIN_FONT_SIZE_STORAGE_KEY, String(fontSize));

    return () => {
      document.documentElement.style.fontSize = previousFontSize;
    };
  }, [fontSize]);

  const decreaseFontSize = useCallback(() => {
    setFontSize((current) => clampFontSize(current - FONT_SIZE_STEP));
  }, []);

  const increaseFontSize = useCallback(() => {
    setFontSize((current) => clampFontSize(current + FONT_SIZE_STEP));
  }, []);

  return {
    fontSize,
    canDecreaseFontSize: fontSize > MIN_FONT_SIZE,
    canIncreaseFontSize: fontSize < MAX_FONT_SIZE,
    decreaseFontSize,
    increaseFontSize,
  };
}
