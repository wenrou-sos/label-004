import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { validateData, followupRecordSchema } from '@/lib/validation';

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
  const { patientId, startDate, endDate } = req.query;

  const where: any = { doctorId };

  if (patientId && typeof patientId === 'string') {
    where.patientId = parseInt(patientId);
  }

  if (startDate || endDate) {
    where.visitDate = {
      ...(startDate ? { gte: new Date(startDate as string) } : {}),
      ...(endDate ? { lte: new Date(endDate as string) } : {}),
    };
  }

  const records = await prisma.followupRecord.findMany({
    where,
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      plan: { select: { id: true, planDate: true } },
    },
    orderBy: { visitDate: 'desc' },
  });

  return res.status(200).json({ success: true, data: records });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, doctorId: number) {
  const validation = validateData(followupRecordSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: validation.errors });
  }

  const { patientId, visitDate, nextVisitDate, ...rest } = validation.data;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient || patient.doctorId !== doctorId) {
    return res.status(403).json({ success: false, error: '无权为该患者创建随访记录' });
  }

  const data: any = {
    patientId,
    doctorId,
    visitDate: new Date(visitDate),
    ...rest,
  };

  if (nextVisitDate) {
    data.nextVisitDate = new Date(nextVisitDate);
  }

  const record = await prisma.followupRecord.create({
    data,
    include: {
      patient: { select: { id: true, name: true } },
    },
  });

  if (rest.planId) {
    await prisma.followupPlan.update({
      where: { id: rest.planId },
      data: { status: 'COMPLETED' },
    });
  }

  return res.status(201).json({ success: true, data: record });
}
