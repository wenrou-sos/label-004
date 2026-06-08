import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { validateData, healthRecordSchema } from '@/lib/validation';
import { createAlertsForHealthRecord } from '@/lib/healthUtils';

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

  const where: any = {
    patient: { doctorId },
  };

  if (patientId && typeof patientId === 'string') {
    where.patientId = parseInt(patientId);
  }

  if (startDate || endDate) {
    where.recordDate = {
      ...(startDate ? { gte: new Date(startDate as string) } : {}),
      ...(endDate ? { lte: new Date(endDate as string) } : {}),
    };
  }

  const records = await prisma.healthRecord.findMany({
    where,
    include: {
      patient: { select: { id: true, name: true } },
      alerts: true,
    },
    orderBy: { recordDate: 'desc' },
  });

  return res.status(200).json({ success: true, data: records });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, doctorId: number) {
  const validation = validateData(healthRecordSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: validation.errors });
  }

  const { patientId, recordDate, ...rest } = validation.data;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient || patient.doctorId !== doctorId) {
    return res.status(403).json({ success: false, error: '无权为该患者创建记录' });
  }

  const record = await prisma.healthRecord.create({
    data: {
      patientId,
      recordDate: new Date(recordDate),
      ...rest,
    },
    include: {
      patient: { select: { id: true, name: true } },
    },
  });

  const abnormalities = await createAlertsForHealthRecord(record.id, patientId, rest);

  return res.status(201).json({
    success: true,
    data: {
      ...record,
      abnormalities,
    },
  });
}
