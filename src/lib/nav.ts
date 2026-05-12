import type { Role } from '@prisma/client';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  Pill,
  FlaskConical,
  Scan,
  Receipt,
  ClipboardList,
  Building2,
  ShieldCheck,
  Bell,
  FileText,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
  group?: string;
}

export const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: [
    'SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LAB_STAFF', 'RADIOLOGY_STAFF', 'PHARMACIST', 'PATIENT',
  ] },

  // Reception/clinical
  { label: 'Patients', href: '/patients', icon: Users, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LAB_STAFF', 'RADIOLOGY_STAFF', 'PHARMACIST'], group: 'Clinical' },
  { label: 'Appointments', href: '/appointments', icon: Calendar, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'], group: 'Clinical' },
  { label: 'Doctor Workbench', href: '/workbench', icon: Stethoscope, roles: ['DOCTOR', 'SUPER_ADMIN'], group: 'Clinical' },

  // Pharmacy / Lab / Rad
  { label: 'Pharmacy', href: '/pharmacy', icon: Pill, roles: ['PHARMACIST', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'], group: 'Operations' },
  { label: 'Laboratory', href: '/lab', icon: FlaskConical, roles: ['LAB_STAFF', 'SUPER_ADMIN', 'DOCTOR', 'HOSPITAL_ADMIN'], group: 'Operations' },
  { label: 'Radiology', href: '/radiology', icon: Scan, roles: ['RADIOLOGY_STAFF', 'SUPER_ADMIN', 'DOCTOR', 'HOSPITAL_ADMIN'], group: 'Operations' },

  // Billing
  { label: 'Billing', href: '/billing', icon: Receipt, roles: ['RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'], group: 'Operations' },

  // Admin
  { label: 'Departments', href: '/admin/departments', icon: Building2, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'], group: 'Admin' },
  { label: 'Users & Roles', href: '/admin/users', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'], group: 'Admin' },
  { label: 'Audit Log', href: '/admin/audit', icon: ClipboardList, roles: ['SUPER_ADMIN'], group: 'Admin' },
  { label: 'Reports', href: '/reports', icon: FileText, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'], group: 'Admin' },

  // Patient portal
  { label: 'My Records', href: '/portal/records', icon: FileText, roles: ['PATIENT'], group: 'Patient Portal' },
  { label: 'My Appointments', href: '/portal/appointments', icon: Calendar, roles: ['PATIENT'], group: 'Patient Portal' },
  { label: 'Notifications', href: '/notifications', icon: Bell, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LAB_STAFF', 'RADIOLOGY_STAFF', 'PHARMACIST', 'PATIENT'] },
];

export function navForRole(role: Role): NavItem[] {
  return NAV.filter((n) => n.roles.includes(role));
}
