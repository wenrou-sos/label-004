import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: '方法不允许' });
  }

  try {
    const payload = await authenticate(req, res);
    if (!payload) return;

    const diseaseTypes = await prisma.diseaseType.findMany({
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({ success: true, data: diseaseTypes });
  } catch (error) {
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
}
