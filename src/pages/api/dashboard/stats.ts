import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { startOfDay, endOfDay } from 'date-fns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: '方法不允许' });
  }

  try {
    const payload = await authenticate(req, res);
    if (!payload) return;

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [patientCount, todayFollowups, alertCount, pendingPlans] = await Promise.all([
      prisma.patient.count({
        where: { doctorId: payload.userId },
      }),
      prisma.followupPlan.count({
        where: {
          doctorId: payload.userId,
          planDate: { gte: todayStart, lte: todayEnd },
          status: 'PENDING',
        },
      }),
      prisma.alert.count({
        where: {
          patient: { doctorId: payload.userId },
          resolved: false,
        },
      }),
      prisma.followupPlan.count({
        where: {
          doctorId: payload.userId,
          status: 'PENDING',
          planDate: { gte: todayStart },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalPatients: patientCount,
        todayFollowups,
        unresolvedAlerts: alertCount,
        pendingPlans,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
}
