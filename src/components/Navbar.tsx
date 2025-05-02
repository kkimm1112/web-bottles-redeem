"use client";

import useSWR, { mutate } from "swr";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Menu } from "@headlessui/react";
import { useState, useEffect } from "react";
import Image from 'next/image';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Navbar() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const { data: userData } = useSWR(
    userId ? `/api/users/${userId}/points` : null,
    fetcher
  );
  const [isScrolled, setIsScrolled] = useState(false);

  // เพิ่ม effect เพื่อตรวจจับการ scroll และปรับ style ของ navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const refreshUserData = () => {
    if (userId) {
      mutate(`/api/users/${userId}/points`);
    }
  };

  const renderLinks = () => (
    <>
      <Link href="/" className="relative group px-4 py-2 text-white font-medium">
        <span className="relative z-10">Home</span>
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white rounded-full transition-all duration-300 group-hover:w-full"></span>
      </Link>
      <Link href="/rewards" className="relative group px-4 py-2 text-white font-medium">
        <span className="relative z-10">Rewards</span>
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white rounded-full transition-all duration-300 group-hover:w-full"></span>
      </Link>
      <Link href="/history" className="relative group px-4 py-2 text-white font-medium">
        <span className="relative z-10">History</span>
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white rounded-full transition-all duration-300 group-hover:w-full"></span>
      </Link>
      <Link href="/redeem-qr" className="relative group px-4 py-2 text-white font-medium">
        <span className="relative z-10">TopUp</span>
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white rounded-full transition-all duration-300 group-hover:w-full"></span>
      </Link>
    </>
  );

  // คำนวณความสูงของ navbar สำหรับ spacer
  const navbarHeight = isScrolled ? "h-16" : "h-20";

  return (
    <>
      {/* Navbar */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-gradient-to-r from-green-600 to-green-500 shadow-lg py-2" 
          : "bg-gradient-to-r from-green-500 to-teal-500 py-4"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                Bottle<span className="text-yellow-300">Coins</span>
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex space-x-6 items-center">{renderLinks()}</div>

            {/* User Info Desktop */}
            <div className="hidden md:flex items-center">
              {status === "loading" ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : status === "authenticated" ? (
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center space-x-3 bg-white bg-opacity-10 backdrop-blur-sm hover:bg-opacity-20 transition-all duration-200 px-4 py-2 rounded-full cursor-pointer border border-white border-opacity-20">
                    <Image
                      width={32}
                      height={32}
                      src={session.user.image ?? "/default-avatar.png"}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
                    />
                    <span className="font-medium text-white">
                      {userData?.name ?? session.user.name}
                    </span>
                    <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 rounded-full font-bold shadow-md">
                      {userData?.points ?? 0}
                    </span>
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-3 px-4">
                      <p className="text-sm font-medium text-gray-900">Signed in as</p>
                      <p className="truncate text-sm text-gray-500">{session.user.email}</p>
                    </div>
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`${
                              active ? "bg-green-50 text-green-600" : "text-gray-700"
                            } flex w-full items-center px-4 py-3 text-sm`}
                            onClick={refreshUserData}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/account"
                            className={`${
                              active ? "bg-green-50 text-green-600" : "text-gray-700"
                            } flex w-full items-center px-4 py-3 text-sm`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Account
                          </Link>
                        )}
                      </Menu.Item>
                    </div>
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`${
                              active ? "bg-red-50 text-red-500" : "text-gray-700"
                            } flex w-full items-center px-4 py-3 text-sm`}
                            onClick={() => signOut()}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Menu>
              ) : (
                <button
                  onClick={() => signIn("google")}
                  className="flex items-center space-x-2 bg-white text-green-600 hover:bg-opacity-90 transition-colors px-4 py-2 rounded-full font-medium shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign in</span>
                </button>
              )}
            </div>

            {/* Mobile User Dropdown */}
            <div className="md:hidden">
              {status === "authenticated" ? (
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center space-x-2 bg-white bg-opacity-10 backdrop-blur-sm hover:bg-opacity-20 px-3 py-1 rounded-full cursor-pointer border border-white border-opacity-20">
                    <Image
                      width={32}
                      height={32}
                      src={session.user.image ?? "/default-avatar.png"}
                      alt="User Icon"
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-white"
                    />
                    <span className="text-yellow-300 font-bold text-sm">
                      {userData?.points ?? 0}
                    </span>
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="px-4 py-3">
                      <p className="text-base font-medium text-gray-900 truncate">
                        {userData?.name ?? session.user.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{session.user.email}</p>
                      <div className="mt-2 flex items-center">
                        <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                          {userData?.points ?? 0} Points
                        </span>
                      </div>
                    </div>
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/"
                            className={`${
                              active ? "bg-green-50 text-green-600" : "text-gray-700"
                            } flex items-center px-4 py-3 text-sm`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-7-7v14" />
                            </svg>
                            Home
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/rewards"
                            className={`${
                              active ? "bg-green-50 text-green-600" : "text-gray-700"
                            } flex items-center px-4 py-3 text-sm`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                            Rewards
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/history"
                            className={`${
                              active ? "bg-green-50 text-green-600" : "text-gray-700"
                            } flex items-center px-4 py-3 text-sm`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            History
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/redeem-qr"
                            className={`${
                              active ? "bg-green-50 text-green-600" : "text-gray-700"
                            } flex items-center px-4 py-3 text-sm`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            TopUp
                          </Link>
                        )}
                      </Menu.Item>
                    </div>
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`${
                              active ? "bg-green-50 text-green-600" : "text-gray-700"
                            } flex w-full items-center px-4 py-3 text-sm`}
                            onClick={refreshUserData}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/account"
                            className={`${
                              active ? "bg-green-50 text-green-600" : "text-gray-700"
                            } flex items-center px-4 py-3 text-sm`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Account
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`${
                              active ? "bg-red-50 text-red-500" : "text-gray-700"
                            } flex w-full items-center px-4 py-3 text-sm`}
                            onClick={() => signOut()}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Menu>
              ) : (
                <button
                  onClick={() => signIn("google")}
                  className="flex items-center space-x-1 bg-white text-green-600 px-3 py-2 rounded-full font-medium shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign in</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Spacer element เพื่อป้องกันเนื้อหาถูกทับด้วย navbar */}
      <div className={`${navbarHeight}`}></div>
    </>
  );
}