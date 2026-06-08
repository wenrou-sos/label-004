import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: '方法不允许' });
  }

  try {
    res.setHeader('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
    return res.status(200).json({ success: true, data: { message: '登出成功' } });
  } catch (error) {
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
}
