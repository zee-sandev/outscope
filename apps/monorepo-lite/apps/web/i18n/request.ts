import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  // Default to English, support Thai
  // TODO: Get locale from user preferences or Accept-Language header
  const locale = "en";

  return {
    locale,
    messages: (await import(`./locales/${locale}/index.ts`)).default,
  };
});
