"use client";

import { useEffect, useState, useRef } from "react";
import Image from 'next/image';
import Link from 'next/link';

interface Reward {
  id: string;
  name: string;
  points: number;
  stock: number;
  description?: string;
  image?: string;
}

// ฟังก์ชันสำหรับแปลง Cloudinary URL เพื่อปรับขนาดและคุณภาพอัตโนมัติ
const optimizeCloudinaryUrl = (url: string, width: number = 400): string => {
  if (!url || !url.includes('cloudinary.com')) return url || '/placeholder.png';
  
  // แยก URL เพื่อแทรก transformations
  const parts = url.split('/upload/');
  return `${parts[0]}/upload/c_fill,w_${width},q_auto/${parts[1]}`;
};

export default function AdminRewardTable() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [previewImages, setPreviewImages] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [isAddingReward, setIsAddingReward] = useState(false);
  const [isEditingReward, setIsEditingReward] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  const [newReward, setNewReward] = useState<Omit<Reward, "id">>({
    name: "",
    points: 0,
    stock: 0,
    description: "",
    image: "",
  });
  
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [editRewardImage, setEditRewardImage] = useState<File | null>(null);
  const [editRewardImagePreview, setEditRewardImagePreview] = useState<string | null>(null);
  
  const [newRewardImage, setNewRewardImage] = useState<File | null>(null);
  const [newRewardImagePreview, setNewRewardImagePreview] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/routers/rewards");
      if (!res.ok) {
        throw new Error("Failed to fetch rewards");
      }
      const data = await res.json();
      setRewards(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching rewards:", err);
      setError("Failed to load rewards. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, rewardId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ตรวจสอบชนิดไฟล์
    if (!file.type.startsWith('image/')) {
      alert("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น");
      return;
    }

    // ตรวจสอบขนาดไฟล์ (จำกัดที่ 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }

    // Preview image immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPreviewImages((prev) => ({
          ...prev,
          [rewardId]: event.target?.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("rewardId", rewardId);

    setUploading(rewardId);

    try {
      const res = await fetch("/api/routers/upload-reward-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await res.json();
      setPreviewImages((prev) => ({ ...prev, [rewardId]: data.imageUrl }));
      await fetchRewards();
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(null);
    }
  };

  const handleNewRewardImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ตรวจสอบชนิดไฟล์
    if (!file.type.startsWith('image/')) {
      alert("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น");
      return;
    }

    // ตรวจสอบขนาดไฟล์ (จำกัดที่ 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }

    setNewRewardImage(file);

    // Preview image
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewRewardImagePreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEditRewardImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ตรวจสอบชนิดไฟล์
    if (!file.type.startsWith('image/')) {
      alert("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น");
      return;
    }

    // ตรวจสอบขนาดไฟล์ (จำกัดที่ 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }

    setEditRewardImage(file);

    // Preview image
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditRewardImagePreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const validateReward = (reward: Omit<Reward, "id">) => {
    if (!reward.name.trim()) return "รางวัลต้องมีชื่อ";
    if (reward.points <= 0) return "คะแนนต้องมากกว่า 0";
    if (reward.stock < 0) return "จำนวนสินค้าต้องไม่น้อยกว่า 0";
    // ไม่บังคับให้กรอกรายละเอียด
    return null;
  };

  const handleAddReward = async () => {
    const validationError = validateReward(newReward);
    if (validationError) {
      alert(validationError);
      return;
    }

    setUploading("new");

    try {
      // First add the reward
      const res = await fetch("/api/routers/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReward),
      });

      if (!res.ok) {
        throw new Error("Failed to add reward");
      }

      const { id: newRewardId } = await res.json();

      // Then upload the image if there is one
      if (newRewardImage) {
        const formData = new FormData();
        formData.append("file", newRewardImage);
        formData.append("rewardId", newRewardId);

        const uploadRes = await fetch("/api/routers/upload-reward-image", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload image for new reward");
        }
      }

      await fetchRewards();
      setNewReward({ name: "", points: 0, stock: 0, image: "", description: "" });
      setNewRewardImage(null);
      setNewRewardImagePreview(null);
      setIsAddingReward(false);
    } catch (err) {
      console.error("Error adding reward:", err);
      alert("Failed to add reward. Please try again.");
    } finally {
      setUploading(null);
    }
  };

  const handleStartEditReward = (reward: Reward) => {
    setEditingReward({...reward});
    setEditRewardImagePreview(reward.image || null);
    setIsEditingReward(true);
    // Make sure we're not in add mode
    setIsAddingReward(false);
  };

  const handleCancelEdit = () => {
    setIsEditingReward(false);
    setEditingReward(null);
    setEditRewardImage(null);
    setEditRewardImagePreview(null);
  };

  const handleUpdateReward = async () => {
    if (!editingReward) return;

    const validationError = validateReward(editingReward);
    if (validationError) {
      alert(validationError);
      return;
    }

    setUploading("edit");

    try {
      // First update the reward
      const res = await fetch(`/api/routers/rewards/${editingReward.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingReward),
      });

      if (!res.ok) {
        throw new Error("Failed to update reward");
      }

      // Then upload the image if there is one
      if (editRewardImage) {
        const formData = new FormData();
        formData.append("file", editRewardImage);
        formData.append("rewardId", editingReward.id);

        const uploadRes = await fetch("/api/routers/upload-reward-image", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload image for edited reward");
        }
      }

      await fetchRewards();
      setIsEditingReward(false);
      setEditingReward(null);
      setEditRewardImage(null);
      setEditRewardImagePreview(null);
    } catch (err) {
      console.error("Error updating reward:", err);
      alert("Failed to update reward. Please try again.");
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteReward = async (rewardId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรางวัลนี้?")) return;

    try {
      const res = await fetch(`/api/routers/rewards?id=${rewardId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete reward");
      }

      await fetchRewards();
    } catch (err) {
      console.error("Error deleting reward:", err);
      alert("Failed to delete reward. Please try again.");
    }
  };

  const filteredRewards = rewards.filter(reward => 
    reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (reward.description && reward.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-8">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg fixed h-full transition-all duration-300 z-10`}>
        <div className="flex justify-between items-center p-4 border-b">
          {sidebarOpen ? (
            <h2 className="text-xl font-bold text-green-600">Admin Panel</h2>
          ) : (
            <span className="mx-auto text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="text-gray-500 hover:text-green-600"
          >
            {sidebarOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
        
        <nav className="mt-6">
          {/* Dashboard */}
          <Link href="/admin">
            <div className="flex items-center px-4 py-3 text-gray-600 bg-gray-100 border-l-4 border-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              {sidebarOpen && <span className="ml-3">Dashboard</span>}
            </div>
          </Link>
          
          {/* Rewards */}
          <Link href="/admin/rewards">
            <div className="flex items-center px-4 py-3 mt-2 text-gray-600 hover:bg-gray-100 hover:border-l-4 hover:border-green-500 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              {sidebarOpen && <span className="ml-3">Rewards</span>}
            </div>
          </Link>
          
          {/* Redemption History */}
          <Link href="/admin/history">
            <div className="flex items-center px-4 py-3 mt-2 text-gray-600 hover:bg-gray-100 hover:border-l-4 hover:border-green-500 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {sidebarOpen && <span className="ml-3">History</span>}
            </div>
          </Link>
          
          {/* Settings */}
          <Link href="/admin/userManage">
            <div className="flex items-center px-4 py-3 mt-2 text-gray-600 hover:bg-gray-100 hover:border-l-4 hover:border-green-500 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {sidebarOpen && <span className="ml-3">ManageOrders</span>}
            </div>
          </Link>
          
          {/* Logout - at the bottom */}
          <div className="absolute bottom-0 w-full border-t border-gray-200">
            <div className="flex items-center px-4 py-3 text-red-500 hover:bg-red-50 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {sidebarOpen && <span className="ml-3">Logout</span>}
            </div>
          </div>
        </nav>
      </div>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-green-600">จัดการรางวัล</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหารางวัล..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          
          <button
            onClick={() => {
              setIsAddingReward(!isAddingReward);
              if (isEditingReward) handleCancelEdit();
            }}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            {isAddingReward ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                ยกเลิก
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                เพิ่มรางวัลใหม่
              </>
            )}
          </button>
        </div>
      </div>
      

      {/* Add New Reward Form */}
      {isAddingReward && (
        <div className="bg-green-50 rounded-lg p-6 border border-green-100 shadow-sm">
          <h2 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            เพิ่มรางวัลใหม่
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 flex flex-col items-center justify-center">
              <div 
                className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-all mb-2 overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {newRewardImagePreview ? (
                  <Image
                    src={newRewardImagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleNewRewardImageChange}
                />
              </div>
              <span className="text-sm text-gray-500">คลิกเพื่อเลือกรูปภาพ (ไม่เกิน 5MB)</span>
            </div>
            
            <div className="col-span-2 md:col-span-2 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อรางวัล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  placeholder="ชื่อรางวัล"
                  className="text-black w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={newReward.name}
                  onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-1">
                    คะแนนที่ใช้แลก <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="points"
                    placeholder="คะแนน"
                    className="text-black w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={newReward.points}
                    onChange={(e) => setNewReward({ ...newReward, points: Number(e.target.value) })}
                  />
                </div>
                
                <div>
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนคงเหลือ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="stock" 
                    placeholder="จำนวน"
                    className="text-black w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={newReward.stock}
                    onChange={(e) => setNewReward({ ...newReward, stock: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด
                </label>
                <textarea
                  id="description"
                  placeholder="รายละเอียดของรางวัล"
                  rows={3}
                  className="text-black w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={newReward.description || ""}
                  onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                />
              </div>
              
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleAddReward}
                  disabled={uploading === "new"}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50"
                >
                  {uploading === "new" ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      กำลังเพิ่ม...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      เพิ่มรางวัล
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reward Form */}
      {isEditingReward && editingReward && (
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-100 shadow-sm">
          <h2 className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            แก้ไขรางวัล: {editingReward.name}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 flex flex-col items-center justify-center">
              <div 
                className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-all mb-2 overflow-hidden"
                onClick={() => editFileInputRef.current?.click()}
              >
                {editRewardImagePreview ? (
                  <Image
                    src={editRewardImagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : editingReward.image ? (
                  <Image
                    src={optimizeCloudinaryUrl(editingReward.image, 320)}
                    alt={editingReward.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={editFileInputRef}
                  onChange={handleEditRewardImageChange}
                />
              </div>
              <span className="text-sm text-gray-500">คลิกเพื่อเปลี่ยนรูปภาพ (ไม่เกิน 5MB)</span>
            </div>
            
            <div className="col-span-2 md:col-span-2 space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อรางวัล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="edit-name"
                  placeholder="ชื่อรางวัล"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 !text-black"
                  value={editingReward.name}
                  onChange={(e) => setEditingReward({ ...editingReward, name: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-points" className="block text-sm font-medium text-gray-700 mb-1">
                    คะแนนที่ใช้แลก <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="edit-points"
                    placeholder="คะแนน"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingReward.points}
                    onChange={(e) => setEditingReward({ ...editingReward, points: Number(e.target.value) })}
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-stock" className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนคงเหลือ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="edit-stock" 
                    placeholder="จำนวน"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingReward.stock}
                    onChange={(e) => setEditingReward({ ...editingReward, stock: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด
                </label>
                <textarea
                  id="edit-description"
                  placeholder="รายละเอียดของรางวัล"
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editingReward.description || ""}
                  onChange={(e) => setEditingReward({ ...editingReward, description: e.target.value })}
                />
              </div>
              
              <div className="flex justify-end pt-2 space-x-3">
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  ยกเลิก
                </button>
                <button
                  onClick={handleUpdateReward}
                  disabled={uploading === "edit"}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                >
                  {uploading === "edit" ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      บันทึกการแก้ไข
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rewards Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow">
          {filteredRewards.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      รูปภาพ
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ชื่อรางวัล
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      รายละเอียด
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      คะแนน
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      คงเหลือ
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRewards.map((reward) => (
                    <tr key={reward.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden">
                          <Image
                            width={160}
                            src={previewImages[reward.id] || 
                                (reward.image ? optimizeCloudinaryUrl(reward.image, 160) : "/placeholder.png")}
                            alt={reward.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{reward.name}</div>
                        <div className="text-xs text-gray-500">ID: {reward.id.substring(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs">
                          {reward.description ? (
                            <div className="line-clamp-2">{reward.description}</div>
                          ) : (
                            <span className="text-gray-400 italic">ไม่มีรายละเอียด</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="bg-yellow-50 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium text-yellow-800">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {reward.points.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${
                          reward.stock <= 0 
                            ? "bg-red-100 text-red-800" 
                            : reward.stock < 5 
                              ? "bg-amber-100 text-amber-800" 
                              : "bg-green-100 text-green-800"
                        }`}>
                          {reward.stock <= 0 ? "หมด" : `${reward.stock} ชิ้น`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleStartEditReward(reward)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            แก้ไข
                          </button>
                          
                          <label className="flex items-center justify-center px-3 py-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 cursor-pointer transition-colors">
                            {uploading === reward.id ? (
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                รูปภาพ
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageChange(e, reward.id)}
                              disabled={!!uploading}
                            />
                          </label>
                          
                          <button
                            onClick={() => handleDeleteReward(reward.id)}
                            className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              {searchTerm ? "ไม่พบรางวัลที่ค้นหา" : "ยังไม่มีรางวัลในระบบ"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}