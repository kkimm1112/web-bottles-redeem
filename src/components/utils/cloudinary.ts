import { v2 as cloudinary } from 'cloudinary';

// กำหนดค่า Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ฟังก์ชันอัปโหลดรูปภาพไปยัง Cloudinary จากไฟล์
export const uploadImage = async (imagePath: string) => {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'user-profiles', // ชื่อโฟลเดอร์ที่จะเก็บรูปบน Cloudinary
      use_filename: true,
      unique_filename: true,
      overwrite: true,
      resource_type: 'image',
    });
    
    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// ฟังก์ชันอัปโหลดรูปภาพไปยัง Cloudinary จาก Base64
export const uploadImageFromBase64 = async (base64Image: string) => {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'user-profiles',
      resource_type: 'image',
    });
    
    return result;
  } catch (error) {
    console.error('Error uploading base64 to Cloudinary:', error);
    throw error;
  }
};

// ฟังก์ชันลบรูปภาพจาก Cloudinary (ถ้าต้องการ)
export const deleteImage = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// ฟังก์ชันสร้าง URL แบบปรับแต่งได้
export const generateImageUrl = (publicId: string, options = {}) => {
  const defaultOptions = {
    width: 300,
    height: 300,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto',
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  return cloudinary.url(publicId, mergedOptions);
};

// แยก Public ID จาก URL
export const getPublicIdFromUrl = (url: string) => {
  try {
    if (!url || !url.includes('cloudinary.com')) return null;
    
    // URL รูปแบบ: https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/folder/filename.jpg
    const parts = url.split('/');
    const filenameWithExtension = parts[parts.length - 1];
    // const filename = filenameWithExtension.split('.')[0];
    
    // Public ID รวม path ภายใน Cloudinary เช่น "folder/filename"
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    const publicIdParts = parts.slice(uploadIndex + 2); // ข้าม "upload" และ version "v12345"
    return publicIdParts.join('/');
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};