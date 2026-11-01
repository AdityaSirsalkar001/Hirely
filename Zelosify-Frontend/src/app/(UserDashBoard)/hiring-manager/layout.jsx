import RoleGuard from "@/components/Auth/RoleGuard";

export default function HiringManagerLayout({ children }) {
  return <RoleGuard allowedRole="HIRING_MANAGER">{children}</RoleGuard>;
}
