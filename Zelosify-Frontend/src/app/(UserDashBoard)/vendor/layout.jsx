// This layout is for the role IT_VENDOR
import RoleGuard from "@/components/Auth/RoleGuard";

export default function VendorLayout({ children }) {
  return <RoleGuard allowedRole="IT_VENDOR">{children}</RoleGuard>;
}
