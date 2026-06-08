import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { getSeverityOrder } from '@/lib/healthUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const payload = await authenticate(req, res);
    if (!payload) return;

    switch (req.method) {
      case 'GET':
        return handleGet(req, res, payload.userId);
      case 'PUT':
        return handlePut(req, res, payload.userId);
      default:
        return res.status(405).json({ success: false, error: '方法不允许' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, doctorId: number) {
  const { resolved, patientId } = req.query;

  const where: any = {
    patient: { doctorId },
  };

  if (resolved !== undefined) {
    where.resolved = resolved === 'true';
  }

  if (patientId && typeof patientId === 'string') {
    where.patientId = parseInt(patientId);
  }

  const alerts = await prisma.alert.findMany({
    where,
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      healthRecord: { select: { id: true, recordDate: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  alerts.sort((a: { severity: string; createdAt: Date }, b: { severity: string; createdAt: Date }) => {
    const orderA = getSeverityOrder(a.severity);
    const orderB = getSeverityOrder(b.severity);
    if (orderA !== orderB) return orderA - orderB;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return res.status(200).json({ success: true, data: alerts });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, doctorId: number) {
  const { ids, isRead, resolved } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: '请提供要标记的提醒ID列表' });
  }

  const data: any = {};
  if (isRead !== undefined) {
    data.isRead = isRead;
  }
  if (resolved !== undefined) {
    data.resolved = resolved;
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ success: false, error: '请提供要更新的字段' });
  }

  await prisma.alert.updateMany({
    where: {
      id: { in: ids },
      patient: { doctorId },
    },
    data,
  });

  return res.status(200).json({ success: true, data: { message: '批量更新成功' } });
}
