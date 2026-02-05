import { MenuItem, Viewer } from "@/types/types";

export const leftMenuItems: MenuItem[] = [
  {
    id: "dashboard",
    icon: "NiHome",
    label: "Dashboard",
    description: "View your contributions and payouts",
    color: "text-primary",
    href: "/dashboard",
  },
  {
    id: "plans",
    icon: "NiDocumentFull",
    label: "Plans",
    description: "Browse and join contribution plans",
    color: "text-primary",
    href: "/plans",
  },
  {
    id: "payments",
    icon: "NiReceipt",
    label: "Payments",
    description: "View your payment history",
    color: "text-primary",
    href: "/payments",
  },
  {
    id: "admin",
    icon: "NiSettings",
    label: "Admin",
    description: "Manage platform",
    color: "text-primary",
    href: "/admin",
    canAccess: [Viewer.ADMIN], // Only visible to admins
    children: [
      {
        id: "admin-settings",
        label: "Settings",
        href: "/admin/settings",
        description: "Configure maturity dates",
      },
      {
        id: "admin-plans",
        label: "Manage Plans",
        href: "/admin/plans",
        description: "Add, edit, or remove slots",
      },
      {
        id: "admin-payments",
        label: "Verify Payments",
        href: "/admin/payments",
        description: "Review payment submissions",
      },
      {
        id: "admin-payouts",
        label: "Payouts",
        href: "/admin/payouts",
        description: "Matured enrollments",
      },
      {
        id: "admin-payment-methods",
        label: "Payment Methods",
        href: "/admin/payment-methods",
        description: "Configure CashApp, Zelle, BTC",
      },
      {
        id: "admin-users",
        label: "Users",
        href: "/admin/users",
        description: "Manage user accounts",
      },
    ],
  },
];

export const leftMenuBottomItems: MenuItem[] = [
  { id: "profile", label: "Profile", href: "/profile", icon: "NiUser" },
  { id: "support", label: "Support", href: "/support", icon: "NiQuestionHexagon" },
  { id: "logout", label: "Logout", href: "/logout", icon: "NiArrowOutRight" },
];
