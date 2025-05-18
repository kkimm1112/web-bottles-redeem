// src/api/users/count.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from "../../../lib/prisma"; // ใช้ Prisma Client

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // นับจำนวนผู้ใช้ทั้งหมด
    const count = await prisma.user.count();
    
    return res.status(200).json({ count });
  } catch (error) {
    console.error('Error counting users:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}