export type RoleType = "JOB_SEEKER" | "EMPLOYER" | "ADMIN";

export type NavIconName =
  | "dashboard"
  | "jobs"
  | "companies"
  | "applications"
  | "saved-jobs"
  | "profile"
  | "post-job"
  | "users"
  | "moderation"
  | "categories"
  | "audit-logs"
  | "settings";

export interface NavItem {
  title: string;
  href: string;
  iconName: NavIconName;
  badge?: string;
}

export const publicNavItems: NavItem[] = [
  { title: "Find Jobs", href: "/jobs", iconName: "jobs" },
  { title: "Companies", href: "/companies", iconName: "companies" },
];

export const seekerNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", iconName: "dashboard" },
  { title: "My Applications", href: "/applications", iconName: "applications" },
  { title: "Saved Jobs", href: "/saved-jobs", iconName: "saved-jobs" },
  { title: "Profile", href: "/profile", iconName: "profile" },
  { title: "Settings", href: "/settings", iconName: "settings" },
];

export const employerNavItems: NavItem[] = [
  { title: "Dashboard", href: "/employer", iconName: "dashboard" },
  { title: "Company Profile", href: "/employer/company", iconName: "companies" },
  { title: "Manage Jobs", href: "/employer/jobs", iconName: "jobs" },
  { title: "Post a Job", href: "/employer/jobs/new", iconName: "post-job" },
  { title: "Settings", href: "/settings", iconName: "settings" },
];

export const adminNavItems: NavItem[] = [
  { title: "Overview", href: "/admin", iconName: "dashboard" },
  { title: "Manage Users", href: "/admin/users", iconName: "users" },
  { title: "Job Moderation", href: "/admin/jobs", iconName: "moderation" },
  { title: "Categories", href: "/admin/categories", iconName: "categories" },
  { title: "Audit Log", href: "/admin/audit-logs", iconName: "audit-logs" },
  { title: "Settings", href: "/settings", iconName: "settings" },
];

export function getRoleNavItems(role?: RoleType | string): NavItem[] {
  if (role === "JOB_SEEKER") return seekerNavItems;
  if (role === "EMPLOYER") return employerNavItems;
  if (role === "ADMIN") return adminNavItems;
  return publicNavItems;
}
