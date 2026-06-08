import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { validateData, followupRecordSchema } from '@/lib/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const payload = await authenticate(req, res);
    if (!payload) return;

    const { id } = req.query;
    const recordId = parseInt(id as string);

    if (isNaN(recordId)) {
      return res.status(400).json({ success: false, error: '无效的记录ID' });
    }

    const record = await prisma.followupRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      return res.status(404).json({ success: false, error: '记录不存在' });
    }

    if (record.doctorId !== payload.userId) {
      return res.status(403).json({ success: false, error: '无权访问该记录' });
    }

    switch (req.method) {
      case 'GET':
        return handleGet(req, res, recordId);
      case 'PUT':
        return handlePut(req, res, recordId);
      case 'DELETE':
        return handleDelete(req, res, recordId);
      default:
        return res.status(405).json({ success: false, error: '方法不允许' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, recordId: number) {
  const record = await prisma.followupRecord.findUnique({
    where: { id: recordId },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      plan: { select: { id: true, planDate: true, notes: true } },
    },
  });

  return res.status(200).json({ success: true, data: record });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, recordId: number) {
  const validation = validateData(followupRecordSchema.partial(), req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: validation.errors });
  }

  const { visitDate, nextVisitDate, ...rest } = validation.data;

  const data: any = { ...rest };
  if (visitDate) {
    data.visitDate = new Date(visitDate);
  }
  if (nextVisitDate) {
    data.nextVisitDate = new Date(nextVisitDate);
  }

  const record = await prisma.followupRecord.update({
    where: { id: recordId },
    data,
    include: {
      patient: { select: { id: true, name: true } },
    },
  });

  return res.status(200).json({ success: true, data: record });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, recordId: number) {
  await prisma.followupRecord.delete({
    where: { id: recordId },
  });

  return res.status(200).json({ success: true, data: { message: '删除成功' } });
}
