export interface StaffUserItem {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  status: "ACTIVE" | "SUSPENDED";
  mustChangePassword: boolean;
  isDemo: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}
