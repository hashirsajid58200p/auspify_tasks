export type NavIconName =
  | "dashboard"
  | "courses"
  | "builder"
  | "catalog"
  | "grades"
  | "certificates"
  | "submissions"
  | "users"
  | "categories"
  | "audit-logs"
  | "settings";

export interface NavItem {
  title: string;
  href: string;
  iconName: NavIconName;
  badge?: string;
}

export const STUDENT_NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", iconName: "dashboard" },
  { title: "My Courses", href: "/my-courses", iconName: "courses" },
  { title: "Explore Catalog", href: "/courses", iconName: "catalog" },
  { title: "Grades", href: "/grades", iconName: "grades" },
  { title: "Certificates", href: "/certificates", iconName: "certificates" },
  { title: "Settings", href: "/settings", iconName: "settings" },
];

export const INSTRUCTOR_NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/instructor", iconName: "dashboard" },
  { title: "My Courses", href: "/instructor/courses", iconName: "builder" },
  { title: "Submissions", href: "/instructor/submissions", iconName: "submissions" },
  { title: "Explore Catalog", href: "/courses", iconName: "catalog" },
  { title: "Settings", href: "/settings", iconName: "settings" },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { title: "Platform Overview", href: "/admin", iconName: "dashboard" },
  { title: "Users", href: "/admin/users", iconName: "users" },
  { title: "Courses", href: "/admin/courses", iconName: "courses" },
  { title: "Categories", href: "/admin/categories", iconName: "categories" },
  { title: "Audit Log", href: "/admin/audit-logs", iconName: "audit-logs" },
  { title: "Settings", href: "/settings", iconName: "settings" },
];

export const PUBLIC_NAV_ITEMS = [
  { title: "Home", href: "/" },
  { title: "Catalog", href: "/courses" },
  { title: "Verify Certificate", href: "/verify" },
];
