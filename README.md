# HIMS OPD — Hospital OPD Management System

A modular, enterprise-grade Hospital Information Management System for outpatient
departments. Built as a single Next.js 14 full-stack application with PostgreSQL +
Prisma, JWT authentication, role-based access control, and a HL7/FHIR-ready data
model.

## Stack

| Layer        | Technology                                          |
|--------------|-----------------------------------------------------|
| Frontend     | Next.js 14 (App Router) · React · TypeScript        |
| Styling      | Tailwind CSS · custom design system · dark mode     |
| Backend      | Next.js Route Handlers (REST)                       |
| ORM          | Prisma 5                                            |
| Database     | PostgreSQL 16                                       |
| Auth         | JWT (httpOnly cookie) · bcrypt · RBAC               |
| Charts       | Recharts                                            |
| Container    | Docker + docker-compose                             |

## Modules

- **Authentication & RBAC** — 9 distinct roles with granular capability map.
- **Patient registry** — MRN generation, demographics, allergies, family/social
  history, vaccinations, documents, QR/barcode.
- **Scheduling** — Token queue, walk-ins, multi-doctor calendars, priority flags,
  full state machine (Scheduled → Checked-in → In Consultation → Completed).
- **Doctor workbench** — Vitals + auto BMI, structured exam, ICD diagnoses,
  e-prescription, lab/radiology ordering, allergy alerts.
- **Pharmacy** — Live inventory, dispensing workflow with partial/full states,
  low-stock alerts.
- **Lab & Radiology** — Test catalog with reference ranges, order lifecycle,
  result entry with high/low/critical flags.
- **Billing & Payments** — Multi-line invoices (consult, procedure, lab, pharmacy,
  radiology), discounts, taxes, multi-method payments, balance tracking.
- **Admin** — Users & roles, departments, full audit log of critical actions.
- **Reports** — KPIs, revenue, top diagnoses, doctor productivity, print/export.
- **Patient portal** — Records, prescriptions, lab reports, invoices.
- **Notifications** — In-app channel with extensible kinds (SMS/email/push hooks).

## Roles

| Role             | Key access                                                 |
|------------------|------------------------------------------------------------|
| Super Admin      | Everything + audit + user management                       |
| Hospital Admin   | Operations, billing, reports, users                        |
| Doctor           | Patients, appointments, examinations, Rx, lab orders       |
| Nurse            | Patients, examinations, vitals                             |
| Receptionist     | Patient registration, appointments, billing                |
| Lab Staff        | Lab orders, result entry                                   |
| Radiology Staff  | Radiology orders, result entry                             |
| Pharmacist       | Prescriptions, dispensing                                  |
| Patient          | Personal records, appointments, reports, invoices          |

## Demo accounts

All accounts share password `Password123!`.

| Role           | Email                  |
|----------------|------------------------|
| Super Admin    | admin@hims.local       |
| Hospital Admin | hospital@hims.local    |
| Doctor         | dr.sara@hims.local     |
| Doctor         | dr.ali@hims.local      |
| Nurse          | nurse@hims.local       |
| Receptionist   | reception@hims.local   |
| Lab Staff      | lab@hims.local         |
| Radiology      | radiology@hims.local   |
| Pharmacist     | pharmacy@hims.local    |
| Patient        | patient@hims.local     |

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up -d db
docker compose run --rm app npx prisma db push
docker compose run --rm app npx prisma db seed
docker compose up -d app
```

App will be available at <http://localhost:3000>.

## Quick start (local dev)

```bash
# 1. Start Postgres (or use docker compose up -d db)
# 2. Install
npm install

# 3. Configure
cp .env.example .env
# edit .env to point DATABASE_URL at your Postgres instance

# 4. Migrate + seed
npm run db:push
npm run db:seed

# 5. Run
npm run dev
```

Open <http://localhost:3000> and sign in with any demo account.

## Useful scripts

```bash
npm run dev          # next dev
npm run build        # next build (standalone)
npm run start        # production server

npm run db:generate  # prisma generate
npm run db:push      # push schema to DB without migrations
npm run db:migrate   # create + apply a migration
npm run db:seed      # populate demo data
npm run db:reset     # nuke + re-seed (force)
```

## Project layout

```
src/
├── app/
│   ├── (dashboard)/        # authenticated app shell
│   │   ├── dashboard/
│   │   ├── patients/
│   │   ├── appointments/
│   │   ├── workbench/       # doctor consultation workspace
│   │   ├── pharmacy/
│   │   ├── lab/
│   │   ├── radiology/
│   │   ├── billing/
│   │   ├── admin/           # users, departments, audit
│   │   ├── reports/
│   │   ├── notifications/
│   │   └── portal/          # patient portal
│   ├── api/                 # REST API route handlers
│   ├── login/
│   └── layout.tsx
├── components/
│   ├── shell/               # sidebar, topbar
│   ├── ui/                  # primitives
│   └── dashboard/           # chart components
├── lib/
│   ├── prisma.ts            # singleton client
│   ├── auth.ts              # JWT + RBAC capabilities
│   ├── audit.ts             # audit logger
│   ├── api.ts               # response helpers
│   ├── utils.ts             # MRN/visit/invoice generators, formatters
│   └── nav.ts               # role-aware navigation
└── middleware.ts            # session enforcement
prisma/
├── schema.prisma            # data model (25+ tables)
└── seed.ts                  # demo data seeder
```

## REST API summary

All endpoints sit under `/api`. JWT cookie required except `/api/auth/login`
and `/api/health`. See [`docs/openapi.yaml`](./docs/openapi.yaml).

| Method | Path                                  | Notes                              |
|--------|---------------------------------------|------------------------------------|
| POST   | `/api/auth/login`                     | issue session cookie               |
| POST   | `/api/auth/logout`                    |                                    |
| GET    | `/api/auth/me`                        | current user                       |
| GET    | `/api/dashboard`                      | role-aware KPIs                    |
| GET    | `/api/patients?q=…`                   | search & list                      |
| POST   | `/api/patients`                       | register                           |
| GET    | `/api/patients/:id`                   | full record                        |
| PATCH  | `/api/patients/:id`                   | update                             |
| GET    | `/api/doctors`                        | doctors with schedules             |
| GET    | `/api/departments`                    |                                    |
| GET    | `/api/appointments`                   | filter by status/doctor/date       |
| POST   | `/api/appointments`                   | book                               |
| PATCH  | `/api/appointments/:id`               | transition status                  |
| POST   | `/api/examinations`                   | upsert vitals/diagnosis (doctor)   |
| POST   | `/api/prescriptions`                  | upsert Rx (with allergy alerts)    |
| POST   | `/api/prescriptions/:id/dispense`     | pharmacist action                  |
| GET    | `/api/medications?q=…`                | search inventory                   |
| GET    | `/api/lab-tests?q=…&kind=…`           | catalog                            |
| GET    | `/api/lab-orders`                     | filter by status / kind            |
| POST   | `/api/lab-orders`                     | create order                       |
| PATCH  | `/api/lab-orders/:id`                 | results + status                   |
| GET    | `/api/invoices`                       |                                    |
| POST   | `/api/invoices`                       | issue                              |
| POST   | `/api/invoices/:id/pay`               | take payment                       |
| GET    | `/api/notifications`                  |                                    |

## Security notes

- Passwords hashed with bcrypt (cost 10).
- JWT signed with `JWT_SECRET`; tokens delivered via `httpOnly` `SameSite=Lax`
  cookie. Production should set `Secure`.
- Every mutation routes through `requireSession()` / `requireRole(...)`.
- Every mutation writes an entry to `AuditLog` with actor, action, entity,
  before/after snapshots, IP + UA.
- Allergy/medication interaction alerts surface inline in the doctor workbench
  and on Rx submission.
- Designed to be HL7/FHIR-ready: patient/practitioner/encounter/observation/
  prescription tables map cleanly onto FHIR resources.

## Extending

- **2FA & consent management**: hooks reserved on `User.twoFactorOn` and a
  pending `Consent` table.
- **WebSocket queue updates**: introduce a separate service or Edge runtime
  route to broadcast `Appointment` status transitions.
- **PACS / DICOM viewer**: the radiology workflow already records imaging
  orders. Link out by `LabOrder.id` to your PACS gateway.
- **HL7 / FHIR exchange**: add an adapter in `src/lib/fhir/` mapping
  `Patient`/`Appointment`/`Encounter`/`Observation`/`MedicationRequest`.

---

© HIMS OPD — Demo build for evaluation.
