export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/lib/auth';
import { err, handle, ok } from '@/lib/api';

export async function GET() {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return err('Unauthorized', 401);
    return ok({
      id: user.id,
      email: user.email,
      name: user.fullName,
      role: user.role,
      phone: user.phone,
      department: user.department?.name,
      doctorId: user.doctorProfile?.id,
      patientId: user.patientProfile?.id,
    });
  });
}
