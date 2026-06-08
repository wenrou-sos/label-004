import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { validateData, patientSchema } from '@/lib/validation';

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
  const { name, diseaseTypeId, lastFollowupFrom, lastFollowupTo } = req.query;

  const where: any = { doctorId };

  if (name && typeof name === 'string') {
    where.name = { contains: name };
  }

  if (diseaseTypeId && typeof diseaseTypeId === 'string') {
    where.diseaseTypeId = parseInt(diseaseTypeId);
  }

  if (lastFollowupFrom || lastFollowupTo) {
    where.followupRecords = {
      some: {
        visitDate: {
          ...(lastFollowupFrom ? { gte: new Date(lastFollowupFrom as string) } : {}),
          ...(lastFollowupTo ? { lte: new Date(lastFollowupTo as string) } : {}),
        },
      },
    };
  }

  const patients = await prisma.patient.findMany({
    where,
    include: {
      diseaseType: { select: { id: true, name: true, code: true } },
      doctor: { select: { id: true, realName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json({ success: true, data: patients });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, doctorId: number) {
  const validation = validateData(patientSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: validation.errors });
  }

  const { birthDate, ...rest } = validation.data;

  const patient = await prisma.patient.create({
    data: {
      ...rest,
      birthDate: new Date(birthDate),
      doctorId,
    },
    include: {
      diseaseType: { select: { id: true, name: true, code: true } },
      doctor: { select: { id: true, realName: true } },
    },
  });

  return res.status(201).json({ success: true, data: patient });
}
