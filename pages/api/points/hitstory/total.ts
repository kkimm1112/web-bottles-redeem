import prisma from "../../../../lib/prisma"; // ใช้ Prisma Client
import { NextApiRequest, NextApiResponse } from 'next';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // คำนวณจำนวน coin ที่ใช้ไปทั้งหมด
    // สมมติว่ามีตาราง PointHistory ที่เก็บประวัติการใช้คอยน์
    // อาจปรับตามโครงสร้างฐานข้อมูลจริงของคุณ
    const result = await prisma.pointHistory.aggregate({
      _sum: {
        points: true
      }
    });
    
    const total = result._sum.points || 0;
    
    return res.status(200).json({ total });
  } catch (error) {
    console.error('Error calculating total points used:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}