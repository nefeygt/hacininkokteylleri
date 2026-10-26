"use client";

import { useEffect } from "react";

/** The event that tells the navbar's counter to read again. */
export const NOTIFICATIONS_SEEN_EVENT = "haci:notifications-seen";

/** Rendered by the notifications page, which marks everything read on the server. */
export default function NotificationsSeen() {
  useEffect(() => {
    window.dispatchEvent(new Event(NOTIFICATIONS_SEEN_EVENT));
  }, []);
  return null;
}
