import { NextApiRequest, NextApiResponse } from 'next';
import prisma from "../../../lib/prisma"; // ใช้ Prisma Client

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // นับจำนวนของรางวัลที่ถูกแลกไปแล้ว
    // สมมติว่ามีตาราง RewardRedemption ที่เก็บข้อมูลการแลกของรางวัล
    // อาจปรับตามโครงสร้างฐานข้อมูลจริงของคุณ
    const count = await prisma.rewardRedemption.count();
    
    return res.status(200).json({ count });
  } catch (error) {
    console.error('Error counting redeemed rewards:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}