import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { validateData, patientSchema } from '@/lib/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const payload = await authenticate(req, res);
    if (!payload) return;

    const { id } = req.query;
    const patientId = parseInt(id as string);

    if (isNaN(patientId)) {
      return res.status(400).json({ success: false, error: '无效的患者ID' });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({ success: false, error: '患者不存在' });
    }

    if (patient.doctorId !== payload.userId) {
      return res.status(403).json({ success: false, error: '无权访问该患者' });
    }

    switch (req.method) {
      case 'GET':
        return handleGet(req, res, patientId);
      case 'PUT':
        return handlePut(req, res, patientId);
      case 'DELETE':
        return handleDelete(req, res, patientId);
      default:
        return res.status(405).json({ success: false, error: '方法不允许' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, patientId: number) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      diseaseType: { select: { id: true, name: true, code: true, description: true } },
      doctor: { select: { id: true, realName: true, title: true, phone: true } },
      healthRecords: { orderBy: { recordDate: 'desc' }, take: 10 },
      followupPlans: { orderBy: { planDate: 'desc' }, take: 10 },
      followupRecords: { orderBy: { visitDate: 'desc' }, take: 10 },
      alerts: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  return res.status(200).json({ success: true, data: patient });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, patientId: number) {
  const validation = validateData(patientSchema.partial(), req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: validation.errors });
  }

  const { birthDate, ...rest } = validation.data;

  const data: any = { ...rest };
  if (birthDate) {
    data.birthDate = new Date(birthDate);
  }

  const patient = await prisma.patient.update({
    where: { id: patientId },
    data,
    include: {
      diseaseType: { select: { id: true, name: true, code: true } },
      doctor: { select: { id: true, realName: true } },
    },
  });

  return res.status(200).json({ success: true, data: patient });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, patientId: number) {
  await prisma.patient.delete({
    where: { id: patientId },
  });

  return res.status(200).json({ success: true, data: { message: '删除成功' } });
}
