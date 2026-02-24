"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  Menu,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  user: {
    name: string;
    lastName?: string;
    email: string;
    role: number;
    image?: string;
  };
  onMenuToggle: () => void;
}

export function Header({ user, onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex flex-col">
      <div className="flex h-14 items-center bg-[#1c2b3a] px-5">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-white hover:bg-white/10"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center shrink-0 ml-[15px]">
          <Image
            src="/logo.svg"
            alt="Total Spray Care"
            width={100}
            height={100}
            className="object-contain"
          />
        </Link>

        {/* Search - centered */}
        <div className="flex-1 flex justify-center px-8">
          <form onSubmit={handleSearch} className="w-full max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder=""
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 rounded-[10px] bg-[#263d50] border border-[#344e63] pl-9 pr-4 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </form>
        </div>

        {/* Right side: Welcome + Logout */}
        <div className="flex items-center gap-5 shrink-0">
          <span className="hidden md:block text-sm text-white">
            Welcome back, {user.name} {user.lastName}!
          </span>

          <Link
            href="/api/auth/signout"
            className="flex items-center gap-2 text-sm text-white hover:text-cyan-400 transition-colors"
          >
            <span className="hidden sm:inline font-medium">Logout</span>
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Cyan gradient line */}
      <div className="h-[3px] bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-500" />
    </header>
  );
}
