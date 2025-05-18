// src/app/admin/userManage/page.tsx
import Link from 'next/link';

import { useState } from 'react';

export default function UserManagePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
      <main className="p-8">
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
        <h1 className="text-2xl font-bold mb-4">User Management</h1>
  
        <div className="border rounded p-4 bg-white shadow">
          <p className="text-gray-700">ที่นี่จะแสดงข้อมูลผู้ใช้ทั้งหมด เช่น ตารางผู้ใช้ ระบบแก้ไข/ลบ ฯลฯ</p>
        </div>
      </main>
    );
  }
  