"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Reward {
  id: number;
  name: string;
  points: number;
  stock: number;
}

interface NewsItem {
  id: number;
  title: string;
  content: string;
  date: string;
}

export default function HomePage() {
  const [stats, setStats] = useState({ users: 0, redeemed: 0, coinsUsed: 0 });
  const [recommended, setRecommended] = useState<Reward[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newItems, setNewItems] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {

    // 👇 ตรวจว่าอยู่ใน client ก่อนใช้ document
    if (typeof window !== "undefined") {
      const style = document.createElement('style');
      style.textContent = `
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
      }

      @keyframes float-delay {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-15px); }
        100% { transform: translateY(0px); }
      }

      .animate-float {
        animation: float 5s ease-in-out infinite;
      }

      .animate-float-delay {
        animation: float-delay 6s ease-in-out infinite;
        animation-delay: 2s;
      }

      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `;
      document.head.appendChild(style);
    }

    const fetchData = async () => {
      try {
        const [statsRes, recommendedRes, newsRes, newItemsRes] = await Promise.all([
          fetch("/api/routers/stats").then(res => res.json()),
          fetch("/api/rewards/").then(res => res.json()),
          fetch("/api/routers/news").then(res => res.json()),
          fetch("/api/rewards/").then(res => res.json())
        ]);

        setStats(statsRes);
        setRecommended(recommendedRes);
        setNews(newsRes);
        setNewItems(newItemsRes);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // เพิ่ม scroll observer เพื่อทำ animation เมื่อ scroll ถึงส่วนนั้นๆ
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    const sections = document.querySelectorAll(".animate-section");
    sections.forEach(section => observer.observe(section));

    return () => {
      sections.forEach(section => observer.unobserve(section));
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-t-green-500 border-green-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-6 text-green-600 font-medium text-lg">กำลังโหลดข้อมูล...</p>
          <p className="text-gray-500 mt-2">รอสักครู่นะ กำลังดึงข้อมูลล่าสุดมาให้คุณ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Banner ที่ปรับปรุงแล้ว */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-green-400 text-white">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white"></div>
          <div className="absolute top-40 right-20 w-64 h-64 rounded-full bg-white"></div>
          <div className="absolute bottom-10 left-1/3 w-48 h-48 rounded-full bg-white"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold mb-4 leading-tight">
                เปลี่ยนขวดเป็น<span className="text-yellow-300">รางวัล</span>
                <br />กับ <span className="text-yellow-300">BottleCoins</span>
              </h1>
              <p className="text-lg md:text-xl opacity-90 mb-8 max-w-xl md:mx-0 mx-auto">
                ระบบสะสมแต้มที่ช่วยให้คุณเปลี่ยนขวดพลาสติกเป็นของรางวัลสุดพิเศษ ง่ายๆ เพียงสแกนและแลกของรางวัลที่คุณชื่นชอบ
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Link href="/redeem-qr" className="bg-white text-green-600 px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
                  </svg>
                  สแกน QR แลกคะแนน
                </Link>
                <Link href="/rewards" className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 hover:bg-yellow-400 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
                  </svg>
                  ดูของรางวัลทั้งหมด
                </Link>
              </div>
            </div>
            <div className="hidden md:block relative">
              <div className="relative z-10 w-full max-w-md mx-auto">
                <div className="w-72 h-72 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-full mx-auto flex items-center justify-center shadow-xl border border-white border-opacity-20">
                  <div className="w-56 h-56 bg-yellow-300 rounded-full flex items-center justify-center shadow-inner">
                    <div className="text-center">
                      <div className="text-green-700 text-5xl font-bold">BottleCoins</div>
                      <div className="text-green-800 font-medium">รักษ์โลก ได้รางวัล</div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-5 right-5 w-20 h-20 bg-white bg-opacity-40 backdrop-filter backdrop-blur-lg rounded-full flex items-center justify-center shadow-lg border border-white border-opacity-20 animate-float">
                  <div className="text-green-600 text-3xl">🌿</div>
                </div>
                <div className="absolute bottom-10 left-0 w-16 h-16 bg-white bg-opacity-40 backdrop-filter backdrop-blur-lg rounded-full flex items-center justify-center shadow-lg border border-white border-opacity-20 animate-float-delay">
                  <div className="text-blue-600 text-2xl">💧</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave Bottom */}
        <div className="absolute bottom-0 left-0 w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-auto">
            <path fill="#f9fafb" fillOpacity="1" d="M0,64L80,58.7C160,53,320,43,480,48C640,53,800,75,960,75C1120,75,1280,53,1360,42.7L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Stats ที่ปรับปรุงแล้ว */}
        <div id="stats-section" className="animate-section relative -mt-10 md:-mt-16 z-20 mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 transform transition-all duration-300 hover:shadow-xl">
              <div className="flex items-start">
                <div className="bg-green-100 rounded-lg p-3 mr-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">ผู้ใช้งานทั้งหมด</p>
                  <div className="flex items-baseline">
                    <p className="text-3xl font-bold text-gray-800">{stats.users.toLocaleString()}</p>
                    <span className="ml-2 text-green-500 text-sm font-medium">+12%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">เพิ่มขึ้นจากเดือนที่แล้ว</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 transform transition-all duration-300 hover:shadow-xl">
              <div className="flex items-start">
                <div className="bg-yellow-100 rounded-lg p-3 mr-4">
                  <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Coins ใช้ไปแล้ว</p>
                  <div className="flex items-baseline">
                    <p className="text-3xl font-bold text-gray-800">{stats.coinsUsed.toLocaleString()}</p>
                    <span className="ml-2 text-green-500 text-sm font-medium">+28%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">เพิ่มขึ้นจากเดือนที่แล้ว</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 transform transition-all duration-300 hover:shadow-xl">
              <div className="flex items-start">
                <div className="bg-blue-100 rounded-lg p-3 mr-4">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">ของรางวัลถูกแลก</p>
                  <div className="flex items-baseline">
                    <p className="text-3xl font-bold text-gray-800">{stats.redeemed.toLocaleString()}</p>
                    <span className="ml-2 text-green-500 text-sm font-medium">+18%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">เพิ่มขึ้นจากเดือนที่แล้ว</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommend Section ที่ปรับปรุงแล้ว */}
        <div id="recommended-section" className={`animate-section mb-20 transition-opacity duration-700 ${activeSection === "recommended-section" ? "opacity-100" : "opacity-90"}`}>
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-2xl">🔥</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              สินค้าแนะนำ<span className="text-orange-500 ml-2">ยอดนิยม</span>
            </h2>
            <div className="ml-auto">
              <Link 
                href="/rewards" 
                className="text-green-600 hover:text-green-700 font-medium flex items-center bg-green-50 px-4 py-2 rounded-lg transition-colors hover:bg-green-100"
              >
                ดูทั้งหมด
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            {recommended.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="h-4 bg-gradient-to-r from-green-400 to-green-500"></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-xl text-gray-800 group-hover:text-green-600 transition-colors duration-300">
                      {item.name}
                    </h3>
                    <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                      <span className="mr-1 text-base">🪙</span>
                      {item.points.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                      </svg>
                      <span>
                        สต๊อก <span className={item.stock < 5 ? "text-red-500 font-medium" : ""}>{item.stock}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="text-gray-300">★</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <Link 
                      href={`/rewards/${item.id}`} 
                      className="block text-center bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all group-hover:shadow-md"
                    >
                      <span className="inline-flex items-center">
                        <span>ดูรายละเอียด</span>
                        <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                        </svg>
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* News Section ที่ปรับปรุงแล้ว */}
        <div id="news-section" className={`animate-section mb-20 transition-opacity duration-700 ${activeSection === "news-section" ? "opacity-100" : "opacity-90"}`}>
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-2xl">📢</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              ข่าวสาร<span className="text-blue-500 ml-2">และกิจกรรม</span>
            </h2>
            <div className="ml-auto">
              <Link 
                href="/news" 
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center bg-blue-50 px-4 py-2 rounded-lg transition-colors hover:bg-blue-100"
              >
                ข่าวทั้งหมด
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {news.map((n, index) => (
              <div 
                key={n.id} 
                className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
              >
                <div className={`h-2 ${index % 2 === 0 ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                <div className="p-6">
                  <div className="flex items-start">
                    <div className={`${index % 2 === 0 ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'} p-3 rounded-lg mr-4 flex-shrink-0`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center mb-1">
                        <h4 className="font-bold text-lg text-gray-800">{n.title}</h4>
                        <span className="ml-3 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          {n.date}
                        </span>
                      </div>
                      <p className="text-gray-600 line-clamp-3 mb-4">{n.content}</p>
                      <Link 
                        href={`/news/${n.id}`} 
                        className={`inline-flex items-center text-sm font-medium ${index % 2 === 0 ? 'text-blue-600 hover:text-blue-700' : 'text-green-600 hover:text-green-700'}`}
                      >
                        อ่านเพิ่มเติม
                        <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* New Items Section ที่ปรับปรุงแล้ว */}
        <div id="new-items-section" className={`animate-section transition-opacity duration-700 ${activeSection === "new-items-section" ? "opacity-100" : "opacity-90"}`}>
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-2xl">🎁</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              สินค้าใหม่<span className="text-red-500 ml-2">ล่าสุด</span>
            </h2>
            <div className="ml-auto">
              <Link 
                href="/rewards" 
                className="text-red-600 hover:text-red-700 font-medium flex items-center bg-red-50 px-4 py-2 rounded-lg transition-colors hover:bg-red-100"
              >
                ดูทั้งหมด
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {newItems.map((item, index) => (
              <Link
                key={item.id}
                href={`/rewards/${item.id}`}
                className="group bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
              >
                <div className="relative">
                  <div className="h-3 bg-gradient-to-r from-red-400 to-red-500"></div>
                  {index < 2 && (
                    <div className="absolute -right-8 -top-8 bg-yellow-500 text-white w-24 h-24 rotate-45 transform">
                      <div className="absolute bottom-5 left-5 transform -rotate-45 text-xs font-bold">NEW</div>
                    </div>
                  )}
                </div>
                
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center justify-center bg-gray-50 rounded-xl p-6 mb-4 group-hover:bg-gray-100 transition-colors">
                    <div className="text-4xl">🎁</div>
                  </div>
                  
                  <h3 className="font-bold text-gray-800 text-center mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                    {item.name}
                  </h3>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg text-center font-medium mb-2">
                      {item.points.toLocaleString()} Coins
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        สต๊อก: {item.stock}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        มาใหม่
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 py-12 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white"></div>
          <div className="absolute top-40 right-20 w-64 h-64 rounded-full bg-white"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-bold mb-4">เริ่มต้นแลกของรางวัลกับ BottleCoins วันนี้</h2>
          <p className="text-green-100 max-w-2xl mx-auto mb-8">
            เพียงนำขวดพลาสติกมาแลกเป็นคะแนน คุณก็สามารถรับของรางวัลมากมายได้ง่ายๆ แถมยังช่วยรักษาสิ่งแวดล้อมไปพร้อมกัน
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/rewards" className="bg-white text-green-600 px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
              เริ่มต้นใช้งาน
            </Link>
            <Link href="/about" className="bg-transparent text-white border border-white px-6 py-3 rounded-lg font-bold hover:bg-white hover:bg-opacity-10 transition-all">
              เรียนรู้เพิ่มเติม
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// เพิ่ม CSS Animation
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes float-delay {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
    100% { transform: translateY(0px); }
  }
  
  .animate-float {
    animation: float 5s ease-in-out infinite;
  }
  
  .animate-float-delay {
    animation: float-delay 6s ease-in-out infinite;
    animation-delay: 2s;
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;
document.head.appendChild(style);