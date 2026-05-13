// Application-level string-literal enums (SQLite build).
// These must match the values documented in prisma/schema.prisma.

export type Role =
  | 'SUPER_ADMIN'
  | 'HOSPITAL_ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'LAB_STAFF'
  | 'RADIOLOGY_STAFF'
  | 'PHARMACIST'
  | 'PATIENT';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type PatientCategory =
  | 'NEW'
  | 'REPEAT'
  | 'CORPORATE'
  | 'GOVT_SCHEME'
  | 'EMERGENCY'
  | 'REFERRED';

export type HistoryType =
  | 'DIAGNOSIS_CHRONIC'
  | 'DIAGNOSIS_ACUTE'
  | 'DIAGNOSIS_RESOLVED'
  | 'SURGERY'
  | 'PROCEDURE'
  | 'HOSPITALIZATION'
  | 'LIFESTYLE_SMOKING'
  | 'LIFESTYLE_ALCOHOL'
  | 'LIFESTYLE_DRUG'
  | 'LIFESTYLE_DIET'
  | 'LIFESTYLE_EXERCISE'
  | 'FEMALE_MENSTRUAL'
  | 'FEMALE_PREGNANCY';

export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CHECKED_IN'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type AppointmentPriority = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

export type PlanStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type PrescriptionStatus =
  | 'PRESCRIBED'
  | 'READY'
  | 'DISPENSED'
  | 'PARTIALLY_DISPENSED'
  | 'REJECTED';

export type LabKind = 'LABORATORY' | 'RADIOLOGY';

export type LabOrderStatus =
  | 'ORDERED'
  | 'SAMPLE_COLLECTED'
  | 'IN_PROGRESS'
  | 'RESULT_READY'
  | 'REPORTED'
  | 'CANCELLED';

export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PARTIAL'
  | 'PAID'
  | 'REFUNDED'
  | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'WALLET' | 'INSURANCE';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';

export type NotificationKind =
  | 'APPOINTMENT'
  | 'LAB_RESULT'
  | 'PRESCRIPTION'
  | 'PAYMENT'
  | 'CRITICAL_ALERT'
  | 'FOLLOW_UP'
  | 'SYSTEM';
