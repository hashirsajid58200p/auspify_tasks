export interface ClassWithCounts {
  id: string;
  name: string;
  gradeLevel: string;
  capacity: number;
  homeroomTeacherName: string;
  enrolledCount: number;
  activeCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}
