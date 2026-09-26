export interface StudentListItem {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  gender: string;
  classId: string;
  className?: string;
  classGradeLevel?: string;
  status: string;
  enrollmentDate: Date | string;
  photoUrl?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface StudentDetail {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  dob: Date | string;
  gender: string;
  classId: string;
  class?: {
    id: string;
    name: string;
    gradeLevel: string;
    homeroomTeacherName?: string;
  };
  enrollmentDate: Date | string;
  status: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  phone?: string;
  email?: string;
  address?: string;
  photoUrl?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
