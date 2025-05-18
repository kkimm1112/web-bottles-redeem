"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Reward {
  id: string;
  name: string;
  points: number;
  stock: number;
}

export default function RewardTable() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [rewardToDelete, setRewardToDelete] = useState<Reward | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Reward | null;
    direction: "ascending" | "descending" | null;
  }>({ key: null, direction: null });
  
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/routers/rewards")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch rewards");
        }
        return res.json();
      })
      .then((data) => {
        setRewards(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch rewards:", error);
        setError("Failed to load rewards. Please try again later.");
        setIsLoading(false);
      });
  }, []);

  const deleteReward = (id: string) => {
    setIsLoading(true);
    fetch(`/api/routers/rewards?id=${id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to delete reward");
        }
        return res.json();
      })
      .then(() => {
        setRewards((prev) => prev.filter((reward) => reward.id !== id));
        setShowDeleteModal(false);
        setRewardToDelete(null);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to delete reward:", error);
        setError("Failed to delete reward. Please try again later.");
        setIsLoading(false);
      });
  };

  const confirmDelete = (reward: Reward) => {
    setRewardToDelete(reward);
    setShowDeleteModal(true);
  };

  const handleSort = (key: keyof Reward) => {
    let direction: "ascending" | "descending" | null = "ascending";
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === "ascending") {
        direction = "descending";
      } else if (sortConfig.direction === "descending") {
        direction = null;
      }
    }
    
    setSortConfig({ key, direction });
  };

  const getSortedRewards = () => {
    const filteredRewards = rewards.filter(
      (reward) =>
        reward.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (!sortConfig.key || !sortConfig.direction) return filteredRewards;
    
    return [...filteredRewards].sort((a, b) => {
      const key = sortConfig.key as keyof Reward;
      if (a[key] < b[key]) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
  };

  const handleAddReward = () => {
    router.push("/admin/rewards");
  };

 

  const SortIcon = ({ column }: { column: keyof Reward }) => {
    if (sortConfig.key !== column) {
      return (
        <svg className="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
        </svg>
      );
    }
    
    if (sortConfig.direction === "ascending") {
      return (
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
        </svg>
      );
    }
    
    return (
      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    );
  };

  // Function to get stock level styling
  const getStockLevelClass = (stock: number) => {
    if (stock <= 0) return "text-red-600 bg-red-50";
    if (stock < 5) return "text-amber-600 bg-amber-50";
    if (stock < 10) return "text-blue-600 bg-blue-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <div className="w-full">
      {/* Header and search section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-green-700 flex items-center">
          <span className="mr-2">🎁</span> รายการของรางวัล
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาของรางวัล..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
            onClick={handleAddReward}
            className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            เพิ่มของรางวัล
          </button>
        </div>
      </div>

      {/* Information row */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          แสดง {getSortedRewards().length} จาก {rewards.length} รายการ
        </div>
        <div className="flex gap-2">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
            <span className="text-xs text-gray-600">มีเพียงพอ</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
            <span className="text-xs text-gray-600">ใกล้หมด</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-500 mr-1"></span>
            <span className="text-xs text-gray-600">เหลือน้อย</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>
            <span className="text-xs text-gray-600">หมด</span>
          </div>
        </div>
      </div>

      {/* Rewards Table */}
      {isLoading && !showDeleteModal ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      ) : (
        <div className="overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-green-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>📦 ชื่อรางวัล</span>
                      <SortIcon column="name" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort("points")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>💰 Coins ที่ใช้แลก</span>
                      <SortIcon column="points" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort("stock")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>📦 สินค้าคงเหลือ</span>
                      <SortIcon column="stock" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider"
                  >
                    ⚙️ จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getSortedRewards().length > 0 ? (
                  getSortedRewards().map((reward) => (
                    <tr
                      key={reward.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center text-green-700">
                            🛍️
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{reward.name}</div>
                            <div className="text-xs text-gray-500">ID: {reward.id.substring(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-yellow-50 rounded-full px-3 py-1 text-sm font-medium text-yellow-700">
                            <span className="mr-1">💰</span>
                            {reward.points.toLocaleString()} Coins
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStockLevelClass(reward.stock)}`}>
                          {reward.stock <= 0 ? (
                            <>⚠️ หมด</>
                          ) : (
                            <>{reward.stock} ชิ้น</>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          
                          <button
                            onClick={() => confirmDelete(reward)}
                            className="bg-red-50 text-red-600 px-3 py-1 rounded-md hover:bg-red-100 transition-colors flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                      {searchTerm ? (
                        <>⛔ ไม่พบของรางวัลที่ค้นหา</>
                      ) : (
                        <>⛔ ยังไม่มีรางวัลในระบบ</>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && rewardToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">ยืนยันการลบของรางวัล</h3>
            <p className="text-sm text-gray-500 mb-6">
              คุณต้องการลบของรางวัล <span className="font-semibold text-red-600">{rewardToDelete.name}</span> ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setRewardToDelete(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                disabled={isLoading}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => deleteReward(rewardToDelete.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังลบ...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    ยืนยันการลบ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}