import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import type { Role } from '@prisma/client';
import { prisma } from './prisma';

const SECRET = process.env.JWT_SECRET || 'dev-secret';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';
export const SESSION_COOKIE = 'hims_session';

export interface AuthPayload {
  sub: string;
  email: string;
  role: Role;
  name: string;
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthPayload | null> {
  const c = cookies().get(SESSION_COOKIE);
  if (!c?.value) return null;
  return verifyToken(c.value);
}

export async function requireSession(): Promise<AuthPayload> {
  const s = await getSession();
  if (!s) throw new Error('UNAUTHORIZED');
  return s;
}

export async function requireRole(...allowed: Role[]): Promise<AuthPayload> {
  const s = await requireSession();
  if (!allowed.includes(s.role)) throw new Error('FORBIDDEN');
  return s;
}

export async function getCurrentUser() {
  const s = await getSession();
  if (!s) return null;
  return prisma.user.findUnique({
    where: { id: s.sub },
    include: { doctorProfile: true, patientProfile: true, department: true },
  });
}

// Role permission map — coarse capabilities used to gate UI/API.
export type Capability =
  | 'patients.read'
  | 'patients.write'
  | 'appointments.read'
  | 'appointments.write'
  | 'examinations.write'
  | 'prescriptions.read'
  | 'prescriptions.write'
  | 'prescriptions.dispense'
  | 'lab.read'
  | 'lab.order'
  | 'lab.result'
  | 'billing.read'
  | 'billing.write'
  | 'reports.read'
  | 'admin.users'
  | 'admin.system';

export const RBAC: Record<Role, Capability[]> = {
  SUPER_ADMIN: [
    'patients.read', 'patients.write',
    'appointments.read', 'appointments.write',
    'examinations.write',
    'prescriptions.read', 'prescriptions.write', 'prescriptions.dispense',
    'lab.read', 'lab.order', 'lab.result',
    'billing.read', 'billing.write',
    'reports.read', 'admin.users', 'admin.system',
  ],
  HOSPITAL_ADMIN: [
    'patients.read', 'patients.write',
    'appointments.read', 'appointments.write',
    'prescriptions.read',
    'lab.read',
    'billing.read', 'billing.write',
    'reports.read', 'admin.users',
  ],
  DOCTOR: [
    'patients.read', 'patients.write',
    'appointments.read', 'appointments.write',
    'examinations.write',
    'prescriptions.read', 'prescriptions.write',
    'lab.read', 'lab.order',
    'billing.read',
    'reports.read',
  ],
  NURSE: [
    'patients.read', 'patients.write',
    'appointments.read',
    'examinations.write',
    'prescriptions.read',
    'lab.read',
  ],
  RECEPTIONIST: [
    'patients.read', 'patients.write',
    'appointments.read', 'appointments.write',
    'billing.read', 'billing.write',
  ],
  LAB_STAFF: [
    'patients.read',
    'lab.read', 'lab.result',
  ],
  RADIOLOGY_STAFF: [
    'patients.read',
    'lab.read', 'lab.result',
  ],
  PHARMACIST: [
    'patients.read',
    'prescriptions.read', 'prescriptions.dispense',
    'billing.read',
  ],
  PATIENT: [
    'appointments.read',
    'prescriptions.read',
    'lab.read',
    'billing.read',
  ],
};

export function hasCapability(role: Role, cap: Capability) {
  return RBAC[role]?.includes(cap) ?? false;
}
