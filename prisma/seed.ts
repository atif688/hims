import { PrismaClient, Role, Gender, PatientCategory, AllergySeverity, HistoryType, AppointmentStatus, AppointmentPriority, LabKind, PrescriptionStatus, InvoiceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding HIMS OPD…');

  const password = await bcrypt.hash('Password123!', 10);

  // -------------------- Departments --------------------
  const depts = [
    { name: 'General Medicine', code: 'MED', about: 'Internal medicine, adult OPD.' },
    { name: 'Pediatrics', code: 'PED', about: 'Children and adolescent care.' },
    { name: 'Cardiology', code: 'CARD', about: 'Heart and vascular conditions.' },
    { name: 'Orthopedics', code: 'ORTHO', about: 'Bone and joint care.' },
    { name: 'Gynecology', code: 'GYN', about: 'Women’s health.' },
    { name: 'ENT', code: 'ENT', about: 'Ear, nose and throat.' },
    { name: 'Dermatology', code: 'DERM', about: 'Skin conditions.' },
  ];
  const deptRecords = await Promise.all(
    depts.map((d) => prisma.department.upsert({ where: { code: d.code }, create: d, update: d })),
  );
  const byCode = Object.fromEntries(deptRecords.map((d) => [d.code, d]));

  // -------------------- Users --------------------
  const userSpec: Array<{ email: string; name: string; role: Role; phone?: string; deptCode?: string }> = [
    { email: 'admin@hims.local', name: 'Admin User', role: 'SUPER_ADMIN' },
    { email: 'hospital@hims.local', name: 'Adeel Hospital Admin', role: 'HOSPITAL_ADMIN' },
    { email: 'reception@hims.local', name: 'Hina Reception', role: 'RECEPTIONIST' },
    { email: 'nurse@hims.local', name: 'Asma Nurse', role: 'NURSE', deptCode: 'MED' },
    { email: 'lab@hims.local', name: 'Imran Lab', role: 'LAB_STAFF' },
    { email: 'radiology@hims.local', name: 'Bilal Radiology', role: 'RADIOLOGY_STAFF' },
    { email: 'pharmacy@hims.local', name: 'Tariq Pharmacist', role: 'PHARMACIST' },
    { email: 'patient@hims.local', name: 'Ahmed Patient', role: 'PATIENT', phone: '03001234567' },
  ];
  const users: Record<string, { id: string }> = {};
  for (const u of userSpec) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { fullName: u.name, role: u.role, active: true, phone: u.phone },
      create: {
        email: u.email,
        fullName: u.name,
        role: u.role,
        active: true,
        phone: u.phone,
        passwordHash: password,
        departmentId: u.deptCode ? byCode[u.deptCode].id : undefined,
      },
    });
    users[u.email] = user;
  }

  // -------------------- Doctors --------------------
  const doctorsSpec: Array<{
    email: string; name: string; specialty: string; deptCode: string;
    qualification: string; consultFee: number;
  }> = [
    { email: 'dr.sara@hims.local', name: 'Sara Khan', specialty: 'Internal Medicine', deptCode: 'MED', qualification: 'MBBS, FCPS', consultFee: 2500 },
    { email: 'dr.ali@hims.local', name: 'Ali Raza', specialty: 'Cardiology', deptCode: 'CARD', qualification: 'MBBS, MD Cardio', consultFee: 4500 },
    { email: 'dr.ayesha@hims.local', name: 'Ayesha Iqbal', specialty: 'Pediatrics', deptCode: 'PED', qualification: 'MBBS, FCPS Peds', consultFee: 2200 },
    { email: 'dr.usman@hims.local', name: 'Usman Tariq', specialty: 'Orthopedics', deptCode: 'ORTHO', qualification: 'MBBS, FRCS', consultFee: 3500 },
    { email: 'dr.maryam@hims.local', name: 'Maryam Hussain', specialty: 'Gynecology', deptCode: 'GYN', qualification: 'MBBS, FCPS Gyn', consultFee: 3000 },
    { email: 'dr.bilal@hims.local', name: 'Bilal Akhtar', specialty: 'ENT', deptCode: 'ENT', qualification: 'MBBS, FCPS ENT', consultFee: 2800 },
  ];
  const doctors = [];
  for (const ds of doctorsSpec) {
    const user = await prisma.user.upsert({
      where: { email: ds.email },
      update: { fullName: ds.name, role: 'DOCTOR' as Role },
      create: {
        email: ds.email,
        fullName: ds.name,
        role: 'DOCTOR' as Role,
        passwordHash: password,
        departmentId: byCode[ds.deptCode].id,
      },
    });
    const doctor = await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {
        specialty: ds.specialty,
        qualification: ds.qualification,
        consultFee: ds.consultFee,
        departmentId: byCode[ds.deptCode].id,
      },
      create: {
        userId: user.id,
        specialty: ds.specialty,
        qualification: ds.qualification,
        consultFee: ds.consultFee,
        departmentId: byCode[ds.deptCode].id,
      },
    });
    doctors.push(doctor);

    // schedule: weekdays 9-17
    for (let wd = 1; wd <= 5; wd++) {
      const existing = await prisma.schedule.findFirst({
        where: { doctorId: doctor.id, weekday: wd },
      });
      if (!existing) {
        await prisma.schedule.create({
          data: {
            doctorId: doctor.id,
            departmentId: byCode[ds.deptCode].id,
            weekday: wd,
            startTime: '09:00',
            endTime: '17:00',
            slotMinutes: 15,
          },
        });
      }
    }
  }

  // -------------------- Medications --------------------
  const meds = [
    { name: 'Paracetamol', generic: 'Acetaminophen', strength: '500 mg', form: 'tablet', price: 5, stock: 800 },
    { name: 'Brufen', generic: 'Ibuprofen', strength: '400 mg', form: 'tablet', price: 12, stock: 320 },
    { name: 'Augmentin', generic: 'Amoxicillin/Clavulanate', strength: '625 mg', form: 'tablet', price: 35, stock: 220 },
    { name: 'Klacid', generic: 'Clarithromycin', strength: '500 mg', form: 'tablet', price: 60, stock: 110 },
    { name: 'Panadol', generic: 'Acetaminophen', strength: '500 mg', form: 'tablet', price: 6, stock: 540 },
    { name: 'Risek', generic: 'Omeprazole', strength: '20 mg', form: 'capsule', price: 10, stock: 280 },
    { name: 'Telma', generic: 'Telmisartan', strength: '40 mg', form: 'tablet', price: 18, stock: 160 },
    { name: 'Glucophage', generic: 'Metformin', strength: '500 mg', form: 'tablet', price: 8, stock: 420 },
    { name: 'Disprin', generic: 'Aspirin', strength: '300 mg', form: 'tablet', price: 4, stock: 18 },
    { name: 'Ventolin', generic: 'Salbutamol', strength: '100 mcg', form: 'inhaler', price: 350, stock: 28 },
    { name: 'Calpol', generic: 'Acetaminophen', strength: '120 mg/5ml', form: 'syrup', price: 60, stock: 90 },
    { name: 'Avil', generic: 'Pheniramine', strength: '25 mg', form: 'tablet', price: 5, stock: 12 },
  ];
  for (const m of meds) {
    await prisma.medication.upsert({
      where: { name: m.name },
      update: {
        genericName: m.generic, strength: m.strength, form: m.form, unitPrice: m.price, stockQty: m.stock,
      },
      create: {
        name: m.name, genericName: m.generic, strength: m.strength, form: m.form,
        unitPrice: m.price, stockQty: m.stock, reorderLevel: 20,
      },
    });
  }

  // -------------------- Lab Tests --------------------
  const tests = [
    { code: 'CBC', name: 'Complete Blood Count', kind: 'LABORATORY' as LabKind, category: 'Hematology', price: 600, units: 'cells/µL', refRange: 'Varies' },
    { code: 'BSF', name: 'Blood Sugar Fasting', kind: 'LABORATORY' as LabKind, category: 'Biochem', price: 250, units: 'mg/dL', refRange: '70-110' },
    { code: 'BSR', name: 'Blood Sugar Random', kind: 'LABORATORY' as LabKind, category: 'Biochem', price: 250, units: 'mg/dL', refRange: '<140' },
    { code: 'LFT', name: 'Liver Function Test', kind: 'LABORATORY' as LabKind, category: 'Biochem', price: 1500, units: 'U/L', refRange: 'Varies' },
    { code: 'RFT', name: 'Renal Function Test', kind: 'LABORATORY' as LabKind, category: 'Biochem', price: 1500, units: 'mg/dL', refRange: 'Varies' },
    { code: 'LIPID', name: 'Lipid Profile', kind: 'LABORATORY' as LabKind, category: 'Biochem', price: 1800, units: 'mg/dL', refRange: 'Varies' },
    { code: 'TSH', name: 'Thyroid Stimulating Hormone', kind: 'LABORATORY' as LabKind, category: 'Endocrine', price: 900, units: 'mIU/L', refRange: '0.4-4.0' },
    { code: 'HBA1C', name: 'HbA1c', kind: 'LABORATORY' as LabKind, category: 'Biochem', price: 1200, units: '%', refRange: '<5.7' },
    { code: 'URINE', name: 'Urine Routine Examination', kind: 'LABORATORY' as LabKind, category: 'Microbiology', price: 350, units: '', refRange: 'Negative' },
    { code: 'CXR', name: 'Chest X-Ray PA View', kind: 'RADIOLOGY' as LabKind, category: 'X-Ray', price: 1200 },
    { code: 'USG-ABD', name: 'Ultrasound Abdomen', kind: 'RADIOLOGY' as LabKind, category: 'Ultrasound', price: 3000 },
    { code: 'CT-BRAIN', name: 'CT Scan Brain', kind: 'RADIOLOGY' as LabKind, category: 'CT', price: 8500 },
    { code: 'MRI-LS', name: 'MRI Lumbar Spine', kind: 'RADIOLOGY' as LabKind, category: 'MRI', price: 18000 },
  ];
  for (const t of tests) {
    await prisma.labTest.upsert({
      where: { code: t.code },
      update: t,
      create: t,
    });
  }

  // -------------------- Patients --------------------
  const patientsSpec = [
    { name: 'Ahmed Raza', gender: 'MALE' as Gender, dob: new Date('1985-04-12'), phone: '03001234567', cnic: '35202-1234567-1', bloodGroup: 'O+', city: 'Karachi' },
    { name: 'Fatima Bibi', gender: 'FEMALE' as Gender, dob: new Date('1992-08-19'), phone: '03211234567', cnic: '35202-7654321-2', bloodGroup: 'A+', city: 'Lahore' },
    { name: 'Hassan Ali', gender: 'MALE' as Gender, dob: new Date('1978-01-03'), phone: '03331234567', cnic: '35202-1111111-3', bloodGroup: 'B-', city: 'Islamabad' },
    { name: 'Sana Tariq', gender: 'FEMALE' as Gender, dob: new Date('2005-11-28'), phone: '03451234567', cnic: '35202-2222222-4', bloodGroup: 'AB+', city: 'Karachi' },
    { name: 'Bilal Khan', gender: 'MALE' as Gender, dob: new Date('1965-06-22'), phone: '03551234567', cnic: '35202-3333333-5', bloodGroup: 'O-', city: 'Faisalabad' },
    { name: 'Aisha Naveed', gender: 'FEMALE' as Gender, dob: new Date('1989-02-14'), phone: '03661234567', cnic: '35202-4444444-6', bloodGroup: 'A-', city: 'Multan' },
    { name: 'Imran Saleem', gender: 'MALE' as Gender, dob: new Date('2015-07-08'), phone: '03771234567', bloodGroup: 'B+', city: 'Karachi' },
    { name: 'Mariam Yousaf', gender: 'FEMALE' as Gender, dob: new Date('1970-09-30'), phone: '03881234567', cnic: '35202-5555555-7', bloodGroup: 'O+', city: 'Lahore' },
  ];

  const patients = [];
  for (let i = 0; i < patientsSpec.length; i++) {
    const p = patientsSpec[i];
    const mrn = `MRN-25-${(100000 + i).toString()}`;
    const isPortalUser = i === 0; // link first patient to the demo patient account
    const patient = await prisma.patient.upsert({
      where: { mrn },
      update: {
        fullName: p.name,
        gender: p.gender,
        dob: p.dob,
        phone: p.phone,
        cnic: p.cnic,
        bloodGroup: p.bloodGroup,
        city: p.city,
        userId: isPortalUser ? users['patient@hims.local'].id : undefined,
      },
      create: {
        mrn,
        qrCode: mrn,
        fullName: p.name,
        gender: p.gender,
        dob: p.dob,
        phone: p.phone,
        cnic: p.cnic,
        bloodGroup: p.bloodGroup,
        city: p.city,
        category: 'NEW' as PatientCategory,
        userId: isPortalUser ? users['patient@hims.local'].id : undefined,
      },
    });
    patients.push(patient);
  }

  // Allergies, history for first patient
  const ahmed = patients[0];
  await prisma.allergy.deleteMany({ where: { patientId: ahmed.id } });
  await prisma.allergy.createMany({
    data: [
      { patientId: ahmed.id, kind: 'drug', substance: 'Penicillin', reaction: 'Rash', severity: 'SEVERE' as AllergySeverity },
      { patientId: ahmed.id, kind: 'food', substance: 'Peanuts', reaction: 'Hives', severity: 'MODERATE' as AllergySeverity },
    ],
  });

  await prisma.medicalHistory.deleteMany({ where: { patientId: ahmed.id } });
  await prisma.medicalHistory.createMany({
    data: [
      { patientId: ahmed.id, type: 'DIAGNOSIS_CHRONIC' as HistoryType, title: 'Hypertension', details: 'Diagnosed 2019, on Telmisartan 40 mg.' },
      { patientId: ahmed.id, type: 'DIAGNOSIS_CHRONIC' as HistoryType, title: 'Type 2 Diabetes', details: 'Diagnosed 2021, on Metformin.' },
      { patientId: ahmed.id, type: 'SURGERY' as HistoryType, title: 'Appendectomy', details: 'Laparoscopic, 2008.' },
    ],
  });

  // -------------------- Appointments + clinical artifacts --------------------
  const now = new Date();
  const today9 = new Date(now); today9.setHours(9, 0, 0, 0);
  const offsets = [-2, -1, 0, 0, 0, 1]; // days
  const slotMinutes = [0, 15, 30, 60, 90, 0];

  for (let i = 0; i < 12; i++) {
    const doctor = doctors[i % doctors.length];
    const patient = patients[i % patients.length];
    const dayOffset = offsets[i % offsets.length];
    const slotMin = slotMinutes[i % slotMinutes.length] + Math.floor(i / 6) * 30;

    const scheduledAt = new Date(today9);
    scheduledAt.setDate(scheduledAt.getDate() + dayOffset);
    scheduledAt.setMinutes(slotMin);

    let status: AppointmentStatus = 'SCHEDULED';
    if (dayOffset < 0) status = 'COMPLETED';
    else if (dayOffset === 0 && i % 3 === 0) status = 'CHECKED_IN';
    else if (dayOffset === 0 && i % 3 === 1) status = 'IN_CONSULTATION';

    const existing = await prisma.appointment.findFirst({
      where: { patientId: patient.id, doctorId: doctor.id, scheduledAt },
    });
    if (existing) continue;

    const appt = await prisma.appointment.create({
      data: {
        visitNo: `V-${Date.now().toString().slice(-7)}-${i}`,
        tokenNo: (i % 8) + 1,
        patientId: patient.id,
        doctorId: doctor.id,
        scheduledAt,
        status,
        priority: i === 5 ? 'EMERGENCY' as AppointmentPriority : 'ROUTINE' as AppointmentPriority,
        reason: ['Fever', 'Follow-up', 'Headache', 'Chest pain', 'Cough', 'Back pain'][i % 6],
        source: 'WALK_IN',
        checkedInAt: status !== 'SCHEDULED' ? new Date(scheduledAt.getTime() + 10 * 60_000) : undefined,
        startedAt: ['IN_CONSULTATION', 'COMPLETED'].includes(status) ? new Date(scheduledAt.getTime() + 20 * 60_000) : undefined,
        completedAt: status === 'COMPLETED' ? new Date(scheduledAt.getTime() + 35 * 60_000) : undefined,
      },
    });

    if (status === 'COMPLETED') {
      const cbc = await prisma.labTest.findUnique({ where: { code: 'CBC' } });
      const para = await prisma.medication.findUnique({ where: { name: 'Paracetamol' } });

      await prisma.examination.create({
        data: {
          appointmentId: appt.id,
          patientId: patient.id,
          doctorId: doctor.id,
          bpSystolic: 120 + (i % 5) * 4,
          bpDiastolic: 78 + (i % 4) * 3,
          pulse: 72 + (i % 6),
          tempC: 36.8 + (i % 3) * 0.2,
          spo2: 97 + (i % 3),
          heightCm: 170,
          weightKg: 72 + i,
          bmi: Math.round(((72 + i) / (1.7 * 1.7)) * 10) / 10,
          chiefComplaint: 'Fever and body aches for 3 days.',
          hopi: 'No travel history, no chronic illness exacerbation.',
          diagnosis: 'Viral upper respiratory tract infection',
          icdCodes: 'J06.9',
          painScore: 3,
          clinicalImpression: 'Stable. Symptomatic management advised.',
          signedAt: new Date(),
          signedBy: doctor.userId,
        },
      });

      if (para) {
        await prisma.prescription.create({
          data: {
            appointmentId: appt.id,
            patientId: patient.id,
            doctorId: doctor.id,
            status: i % 2 === 0 ? ('DISPENSED' as PrescriptionStatus) : ('PRESCRIBED' as PrescriptionStatus),
            advice: 'Plenty of fluids, rest, return if symptoms persist beyond 5 days.',
            followUpDate: new Date(scheduledAt.getTime() + 5 * 86_400_000),
            items: {
              create: [
                {
                  medicationId: para.id,
                  drugName: 'Paracetamol 500 mg',
                  dose: '500 mg',
                  frequency: 'TDS',
                  route: 'PO',
                  durationDays: 5,
                  quantity: 15,
                  instructions: 'After meals',
                },
              ],
            },
          },
        });
      }

      if (cbc && i % 2 === 0) {
        await prisma.labOrder.create({
          data: {
            orderNo: `LAB-${Date.now().toString().slice(-7)}-${i}`,
            appointmentId: appt.id,
            patientId: patient.id,
            doctorId: doctor.id,
            status: 'REPORTED',
            collectedAt: new Date(),
            resultedAt: new Date(),
            reportedAt: new Date(),
            items: {
              create: [{
                testId: cbc.id, resultValue: '7.2 x10^3', resultUnits: cbc.units ?? 'cells/µL',
                refRange: cbc.refRange ?? '4-11 x10^3', reportedAt: new Date(),
              }],
            },
          },
        });
      }

      // Invoice
      await prisma.invoice.create({
        data: {
          invoiceNo: `INV-${Date.now().toString().slice(-7)}-${i}`,
          appointmentId: appt.id,
          patientId: patient.id,
          status: i % 3 === 0 ? ('PAID' as InvoiceStatus) : ('PARTIAL' as InvoiceStatus),
          subtotal: Number(doctor.consultFee) + 600,
          discount: 0,
          tax: 0,
          total: Number(doctor.consultFee) + 600,
          amountPaid: i % 3 === 0 ? Number(doctor.consultFee) + 600 : Number(doctor.consultFee),
          issuedAt: new Date(),
          items: {
            create: [
              { kind: 'CONSULT', description: `Consultation — Dr. ${doctor.specialty}`, qty: 1, unitPrice: Number(doctor.consultFee), discount: 0, total: Number(doctor.consultFee) },
              { kind: 'LAB', description: 'CBC', qty: 1, unitPrice: 600, discount: 0, total: 600 },
            ],
          },
          payments: i % 3 === 0
            ? { create: { amount: Number(doctor.consultFee) + 600, method: 'CASH' } }
            : { create: { amount: Number(doctor.consultFee), method: 'CARD' } },
        },
      });
    }
  }

  // -------------------- Notifications --------------------
  const admin = users['admin@hims.local'];
  await prisma.notification.createMany({
    data: [
      { userId: admin.id, kind: 'SYSTEM', title: 'Welcome to HIMS OPD', body: 'Demo data has been seeded. Explore the dashboard.' },
      { userId: admin.id, kind: 'CRITICAL_ALERT', title: 'Low stock alert', body: 'Disprin and Avil are below reorder level.' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed complete.');
  console.log('   Login: admin@hims.local / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
