import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string, currency = 'PKR') {
  const n = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency }).format(
    isFinite(n) ? n : 0,
  );
}

export function formatDate(value: Date | string | null | undefined, withTime = false) {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '—';
  const opts: Intl.DateTimeFormatOptions = withTime
    ? { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }
    : { year: 'numeric', month: 'short', day: '2-digit' };
  return d.toLocaleString('en-GB', opts);
}

export function calcAge(dob: Date | string): number {
  const d = typeof dob === 'string' ? new Date(dob) : dob;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export function calcBMI(weightKg?: number | null, heightCm?: number | null): number | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function generateMRN(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `MRN-${year}-${rand}`;
}

export function generateVisitNo(): string {
  const stamp = Date.now().toString().slice(-8);
  return `V-${stamp}`;
}

export function generateOrderNo(prefix = 'LAB'): string {
  const stamp = Date.now().toString().slice(-8);
  return `${prefix}-${stamp}`;
}

export function generateInvoiceNo(): string {
  const stamp = Date.now().toString().slice(-8);
  return `INV-${stamp}`;
}

export const ROLES = [
  'SUPER_ADMIN',
  'HOSPITAL_ADMIN',
  'DOCTOR',
  'NURSE',
  'RECEPTIONIST',
  'LAB_STAFF',
  'RADIOLOGY_STAFF',
  'PHARMACIST',
  'PATIENT',
] as const;

export type RoleName = (typeof ROLES)[number];

export const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  HOSPITAL_ADMIN: 'Hospital Admin',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  RECEPTIONIST: 'Receptionist',
  LAB_STAFF: 'Lab Staff',
  RADIOLOGY_STAFF: 'Radiology',
  PHARMACIST: 'Pharmacist',
  PATIENT: 'Patient',
};
