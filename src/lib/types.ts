export type UserRole = 'admin' | 'professor';
export type UserStatus = 'active' | 'blocked';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  photoURL?: string;
  employeeId?: string;
  createdAt?: Date;
  lastLogin?: Date;
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

export interface LabRoomRecord {
  id: string;
  name: string;
  qrValue: string;
  createdAt?: Date;
  updatedAt?: Date;
}
