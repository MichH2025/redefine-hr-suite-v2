
export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  TEAM_LEAD = 'TEAM_LEAD',
  CEO = 'CEO'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  remainingVacationDays: number;
  vacationDaysPreviousYear: number;
}

export enum AbsenceType {
  VACATION = 'Urlaub',
  SPECIAL_LEAVE = 'Sonderurlaub',
  HOME_OFFICE = 'Homeoffice',
  SICK_LEAVE = 'Krankheit'
}

export enum AbsenceStatus {
  PLANNED = 'Geplant',
  PENDING_TEAM_LEAD = 'Wartet auf Teamleiter',
  PENDING_CEO = 'Wartet auf CEO',
  APPROVED = 'Freigegeben',
  REJECTED = 'Abgelehnt'
}

export interface AbsenceRequest {
  id: string;
  userId: string;
  userName: string;
  type: AbsenceType;
  startDate: string;
  endDate: string;
  status: AbsenceStatus;
  createdAt: string;
  days: number;
}

export interface TimeEntry {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in hours
}

export interface Document {
  id: string;
  userId: string;
  name: string;
  type: 'Lohnabrechnung' | 'Vertrag' | 'Sonstiges';
  uploadDate: string;
  url: string;
}
