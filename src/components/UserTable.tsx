"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  points: number;
}

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof User | null;
    direction: "ascending" | "descending" | null;
  }>({ key: null, direction: null });
  
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/routers/user")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch users");
        }
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch users:", error);
        setError("Failed to load users. Please try again later.");
        setIsLoading(false);
      });
  }, []);

  const handleSort = (key: keyof User) => {
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

  const getSortedUsers = () => {
    const filteredUsers = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (!sortConfig.key || !sortConfig.direction) return filteredUsers;
    
    return [...filteredUsers].sort((a, b) => {
      const key = sortConfig.key as keyof User;
      if (a[key] < b[key]) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
  };

  const handleUserClick = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  const SortIcon = ({ column }: { column: keyof User }) => {
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

  // Function to get role badge styling
  const getRoleBadgeClass = (role: string) => {
    switch (role.toUpperCase()) {
      case "ADMIN":
        return "bg-red-100 text-red-800 border-red-200";
      case "MODERATOR":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "PREMIUM":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  return (
    <div className="w-full">
      {/* Search and info section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search users..."
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
        <div className="text-sm text-gray-500">
          Showing {getSortedUsers().length} of {users.length} users
        </div>
      </div>

      {/* User Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Name</span>
                    <SortIcon column="name" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Email</span>
                    <SortIcon column="email" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => handleSort("role")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Role</span>
                    <SortIcon column="role" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => handleSort("points")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Points</span>
                    <SortIcon column="points" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getSortedUsers().length > 0 ? (
                getSortedUsers().map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleUserClick(user.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">ID: {user.id.substring(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-yellow-500 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                        {user.points.toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? "No users match your search." : "No users found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Add User Button */}
    </div>
  );
}