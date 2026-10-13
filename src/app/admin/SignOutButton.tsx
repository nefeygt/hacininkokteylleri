"use client";

import { useTransition } from "react";
import { signOut } from "./actions";

export default function SignOutButton({
  className,
  title,
  children,
}: {
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      title={title}
      disabled={pending}
      className={className}
      onClick={() =>
        startTransition(async () => {
          await signOut();
          window.location.assign("/login");
        })
      }
    >
      {children}
    </button>
  );
}
