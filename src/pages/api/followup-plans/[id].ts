import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { validateData, followupPlanSchema } from '@/lib/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const payload = await authenticate(req, res);
    if (!payload) return;

    const { id } = req.query;
    const planId = parseInt(id as string);

    if (isNaN(planId)) {
      return res.status(400).json({ success: false, error: '无效的计划ID' });
    }

    const plan = await prisma.followupPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return res.status(404).json({ success: false, error: '计划不存在' });
    }

    if (plan.doctorId !== payload.userId) {
      return res.status(403).json({ success: false, error: '无权访问该计划' });
    }

    switch (req.method) {
      case 'GET':
        return handleGet(req, res, planId);
      case 'PUT':
        return handlePut(req, res, planId);
      case 'DELETE':
        return handleDelete(req, res, planId);
      default:
        return res.status(405).json({ success: false, error: '方法不允许' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, planId: number) {
  const plan = await prisma.followupPlan.findUnique({
    where: { id: planId },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      followupRecords: { orderBy: { visitDate: 'desc' }, take: 5 },
    },
  });

  return res.status(200).json({ success: true, data: plan });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, planId: number) {
  const validation = validateData(followupPlanSchema.partial(), req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: validation.errors });
  }

  const { planDate, ...rest } = validation.data;

  const data: any = { ...rest };
  if (planDate) {
    data.planDate = new Date(planDate);
  }

  const plan = await prisma.followupPlan.update({
    where: { id: planId },
    data,
    include: {
      patient: { select: { id: true, name: true } },
    },
  });

  return res.status(200).json({ success: true, data: plan });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, planId: number) {
  await prisma.followupPlan.delete({
    where: { id: planId },
  });

  return res.status(200).json({ success: true, data: { message: '删除成功' } });
}
