import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { validateData, followupPlanSchema } from '@/lib/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const payload = await authenticate(req, res);
    if (!payload) return;

    switch (req.method) {
      case 'GET':
        return handleGet(req, res, payload.userId);
      case 'POST':
        return handlePost(req, res, payload.userId);
      default:
        return res.status(405).json({ success: false, error: '方法不允许' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, doctorId: number) {
  const { patientId, startDate, endDate, status } = req.query;

  const where: any = { doctorId };

  if (patientId && typeof patientId === 'string') {
    where.patientId = parseInt(patientId);
  }

  if (startDate || endDate) {
    where.planDate = {
      ...(startDate ? { gte: new Date(startDate as string) } : {}),
      ...(endDate ? { lte: new Date(endDate as string) } : {}),
    };
  }

  if (status && typeof status === 'string') {
    where.status = status;
  }

  const plans = await prisma.followupPlan.findMany({
    where,
    include: {
      patient: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { planDate: 'asc' },
  });

  return res.status(200).json({ success: true, data: plans });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, doctorId: number) {
  const validation = validateData(followupPlanSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: validation.errors });
  }

  const { patientId, planDate, ...rest } = validation.data;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient || patient.doctorId !== doctorId) {
    return res.status(403).json({ success: false, error: '无权为该患者创建计划' });
  }

  const plan = await prisma.followupPlan.create({
    data: {
      patientId,
      doctorId,
      planDate: new Date(planDate),
      ...rest,
    },
    include: {
      patient: { select: { id: true, name: true } },
    },
  });

  return res.status(201).json({ success: true, data: plan });
}
