"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
  user: {
    id: string;
    name: string;
    lastName?: string;
    email: string;
    role: number;
    clientId?: string;
    image?: string;
  };
}

export function AdminLayout({ children, user }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Full-width header */}
      <Header
        user={user}
        onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex flex-1">
        {/* Sidebar - desktop */}
        <div className="hidden lg:block">
          <Sidebar
            userRole={user.role}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Sidebar - mobile */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 lg:hidden transition-transform duration-300",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar
            userRole={user.role}
            collapsed={false}
            onToggle={() => setMobileMenuOpen(false)}
          />
        </div>

        {/* Main content */}
        <div
          className={cn(
            "flex-1 transition-all duration-300",
            sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
          )}
        >
          <main className="px-[70px] pt-[45px] pb-[70px]">{children}</main>
        </div>
      </div>
    </div>
  );
}
