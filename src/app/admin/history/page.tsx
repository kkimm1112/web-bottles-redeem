"use client";

import React, { useEffect, useState } from "react";
// import Link from "next/link";

interface HistoryItem {
  id: string;
  user: {
    name: string;
    email: string;
  };
  reward: {
    name: string;
    description: string;
  };
  createdAt: string;
  status?: "PENDING" | "SHIPPED" | "COMPLETED";
}

export default function AdminHistoryPage() {
  // const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof HistoryItem | "user.name" | "reward.name";
    direction: "ascending" | "descending";
  }>({
    key: "createdAt",
    direction: "descending",
  });

  // Status update states
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    // Apply search filter
    const filtered = history.filter(
      (item) =>
        item.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.reward.description &&
          item.reward.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Apply sorting
    const sortedData = [...filtered].sort((a, b) => {
      // Handle nested properties
      if (sortConfig.key === "user.name") {
        if (a.user.name < b.user.name) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a.user.name > b.user.name) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      } else if (sortConfig.key === "reward.name") {
        if (a.reward.name < b.reward.name) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a.reward.name > b.reward.name) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      } else {
        const aValue = a[sortConfig.key as keyof HistoryItem];
        const bValue = b[sortConfig.key as keyof HistoryItem];
        
        if (sortConfig.key === "createdAt") {
          return sortConfig.direction === "ascending"
            ? new Date(aValue as string).getTime() - new Date(bValue as string).getTime()
            : new Date(bValue as string).getTime() - new Date(aValue as string).getTime();
        }
        
        if ((aValue ?? "") < (bValue ?? "")) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if ((aValue ?? "") > (bValue ?? "")) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      }
    });

    setFilteredHistory(sortedData);
  }, [history, searchTerm, sortConfig]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/get-history`);
      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }
      const data = await response.json();
      
      // ถ้าข้อมูลจาก API ยังไม่มีสถานะ (สำหรับการทดสอบเท่านั้น)
      // ให้ลบส่วนนี้ออกเมื่อ API พร้อมใช้งานจริง
      if (data.length > 0 && !data[0].status) {
        const statuses = ["PENDING", "COMPLETED"];
        const enhancedData = data.map((item: HistoryItem) => ({
          ...item,
          status: statuses[Math.floor(Math.random() * statuses.length)] as HistoryItem["status"]
        }));
        setHistory(enhancedData);
      } else {
        setHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch admin history:", error);
      setErrorMessage("ไม่สามารถโหลดข้อมูลประวัติได้");
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (redemptionId: string, status: HistoryItem["status"]) => {
    setUpdatingId(redemptionId);
    try {
      // ใช้ endpoint เดียวกับฝั่ง user
      const response = await fetch("/api/redemptions/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ redemptionId, status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      // Update local state on success
      setHistory((prev) =>
        prev.map((item) =>
          item.id === redemptionId ? { ...item, status } : item
        )
      );

      setSuccessMessage(`สถานะอัพเดตเป็น ${getStatusText(status)} เรียบร้อยแล้ว`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error updating status:", error);
      setErrorMessage("เกิดข้อผิดพลาดในการอัพเดตสถานะ กรุณาลองใหม่อีกครั้ง");
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setUpdatingId(null);
    }
  };

  const requestSort = (key: typeof sortConfig.key) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "PENDING":
        return "รอส่ง";
      case "COMPLETED":
        return "รับแล้ว";
      default:
        return "ไม่ระบุสถานะ";
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const SortIcon = ({ active, direction }: { active: boolean; direction: string }) => {
    return active ? (
      <svg
        className={`w-4 h-4 ml-1 ${direction === "ascending" ? "transform rotate-180" : ""}`}
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 ml-1 text-gray-400"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Notification Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-md z-50">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-md z-50">
          {errorMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-green-600">ประวัติการแลกของรางวัล</h1>
        
        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหา..."
            className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">รอส่ง</p>
              <p className="text-2xl font-bold text-yellow-600">
                {history.filter(item => item.status === "PENDING").length}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">รับแล้ว</p>
              <p className="text-2xl font-bold text-green-600">
                {history.filter(item => item.status === "COMPLETED").length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-medium text-gray-600 mb-2">ยังไม่มีรายการแลกของรางวัล</h3>
          <p className="text-gray-500">ไม่มีผู้ใช้ทำการแลกของรางวัลในขณะนี้</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      ลำดับ
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort("user.name")}
                    >
                      <div className="flex items-center">
                        ผู้ใช้
                        <SortIcon 
                          active={sortConfig.key === "user.name"} 
                          direction={sortConfig.direction} 
                        />
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort("reward.name")}
                    >
                      <div className="flex items-center">
                        รางวัล
                        <SortIcon 
                          active={sortConfig.key === "reward.name"} 
                          direction={sortConfig.direction} 
                        />
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      รายละเอียด
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      สถานะปัจจุบัน
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort("createdAt")}
                    >
                      <div className="flex items-center">
                        วันที่แลก
                        <SortIcon 
                          active={sortConfig.key === "createdAt"} 
                          direction={sortConfig.direction} 
                        />
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      อัพเดตสถานะ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.length > 0 ? (
                    currentItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-medium">
                              {item.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{item.user.name}</div>
                              <div className="text-sm text-gray-500">{item.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.reward.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs line-clamp-2">
                            {item.reward.description || "ไม่มีรายละเอียด"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full border ${getStatusBadgeClass(item.status)}`}>
                            {getStatusText(item.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.createdAt).toLocaleString("th-TH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap justify-center gap-2">
                            {/* Pending Button */}
                            <button
                              disabled={item.status === "PENDING" || updatingId === item.id}
                              onClick={() => updateOrderStatus(item.id, "PENDING")}
                              className={`px-3 py-1 text-xs rounded-md border border-yellow-300 
                                ${item.status === "PENDING" 
                                  ? "bg-yellow-100 text-yellow-800 cursor-not-allowed opacity-50" 
                                  : "bg-white text-yellow-600 hover:bg-yellow-50"}`}
                            >
                              {updatingId === item.id ? (
                                <svg className="animate-spin h-4 w-4 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : "รอส่ง"}
                            </button>
                            
                            
                            {/* Completed Button (เดิมชื่อ received) */}
                            <button
                              disabled={item.status === "COMPLETED" || updatingId === item.id}
                              onClick={() => updateOrderStatus(item.id, "COMPLETED")}
                              className={`px-3 py-1 text-xs rounded-md border border-green-300
                                ${item.status === "COMPLETED" 
                                  ? "bg-green-100 text-green-800 cursor-not-allowed opacity-50" 
                                  : "bg-white text-green-600 hover:bg-green-50"}`}
                            >
                              {updatingId === item.id ? (
                                <svg className="animate-spin h-4 w-4 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : "รับแล้ว"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        ไม่พบรายการที่ตรงกับการค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                แสดง {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredHistory.length)} จาก {filteredHistory.length} รายการ
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ก่อนหน้า
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and pages around current
                    return (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    );
                  })
                  .map((page, i, arr) => (
                    <React.Fragment key={page}>
                      {i > 0 && arr[i - 1] !== page - 1 && (
                        <span className="px-3 py-1 text-sm text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => paginate(page)}
                        className={`px-3 py-1 rounded border text-sm font-medium ${
                          currentPage === page
                            ? "bg-green-600 text-white border-green-600"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}