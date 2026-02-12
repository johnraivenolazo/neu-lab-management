export type UserRole = 'admin' | 'professor';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  status: 'active' | 'blocked';
  employeeId?: string;
}

export interface LabLog {
  id: string;
  professorId: string;
  professorName: string;
  roomNumber: string;
  checkIn: Date;
  checkOut?: Date;
  duration?: number; // in minutes
}

export interface Room {
  id: string;
  name: string;
  building: string;
  qrCode?: string;
}
