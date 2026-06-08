import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const payload = await authenticate(req, res);
    if (!payload) return;

    const { id } = req.query;
    const alertId = parseInt(id as string);

    if (isNaN(alertId)) {
      return res.status(400).json({ success: false, error: '无效的提醒ID' });
    }

    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      include: { patient: true },
    });

    if (!alert) {
      return res.status(404).json({ success: false, error: '提醒不存在' });
    }

    if (alert.patient.doctorId !== payload.userId) {
      return res.status(403).json({ success: false, error: '无权访问该提醒' });
    }

    switch (req.method) {
      case 'GET':
        return handleGet(req, res, alertId);
      case 'PUT':
        return handlePut(req, res, alertId);
      case 'DELETE':
        return handleDelete(req, res, alertId);
      default:
        return res.status(405).json({ success: false, error: '方法不允许' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, alertId: number) {
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      healthRecord: true,
    },
  });

  return res.status(200).json({ success: true, data: alert });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, alertId: number) {
  const { isRead, resolved } = req.body;

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

  const alert = await prisma.alert.update({
    where: { id: alertId },
    data,
    include: {
      patient: { select: { id: true, name: true } },
    },
  });

  return res.status(200).json({ success: true, data: alert });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, alertId: number) {
  await prisma.alert.delete({
    where: { id: alertId },
  });

  return res.status(200).json({ success: true, data: { message: '删除成功' } });
}
