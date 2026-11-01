// This layout is for the role BUSINESS_USER
import RoleGuard from "@/components/Auth/RoleGuard";

export default function BusinessUserLayout({ children }) {
  return <RoleGuard allowedRole="BUSINESS_USER">{children}</RoleGuard>;
}
