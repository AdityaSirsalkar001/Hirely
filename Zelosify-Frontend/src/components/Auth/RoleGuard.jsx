"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRoleFromCookie } from "@/utils/Auth/roleUtils";
import { getRoleRedirectPath } from "@/utils/Auth/authUtils";

export default function RoleGuard({ allowedRole, children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const currentRole = getRoleFromCookie();
    if (currentRole === allowedRole) {
      setAuthorized(true);
      return;
    }

    router.replace(getRoleRedirectPath(currentRole));
  }, [allowedRole, router]);

  if (!authorized) return null;
  return children;
}
