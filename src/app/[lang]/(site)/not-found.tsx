"use client";

import StatusScreen from "@/components/StatusScreen";
import { useLocale } from "@/components/LocaleProvider";

// A missing recipe, profile or log on the public site (notFound() in a page), in the page's language.
export default function SiteNotFound() {
  const { t } = useLocale();
  return (
    <StatusScreen code="404" title={t.status.notFoundTitle}>
      {t.status.notFoundBody}
    </StatusScreen>
  );
}
