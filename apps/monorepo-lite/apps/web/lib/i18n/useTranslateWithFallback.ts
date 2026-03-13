import { useTranslations } from "next-intl";

export function useTranslateWithFallback() {
  const t = useTranslations();

  const getTranslation = (key: string, fallback?: string): string => {
    const translated = t(key);
    const isMissing = !translated || translated === key;
    return isMissing ? (fallback ?? key ?? "") : translated;
  };

  return getTranslation;
}
