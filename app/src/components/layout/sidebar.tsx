"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TicketCheck,
  ClipboardList,
  Building2,
  Boxes,
  Contact,
  Wrench,
  Receipt,
  FolderOpen,
  Archive,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  userRole: number;
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: number[];
  badge?: number;
  dividerAfter?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: [1, 2, 3, 4, 6] },
  { label: "Support Tickets", href: "/support-tickets", icon: TicketCheck, roles: [1, 2, 3, 4, 6] },
  { label: "Job Cards", href: "/job-cards", icon: ClipboardList, roles: [1, 2, 3, 4, 6] },
  { label: "Clients", href: "/clients", icon: Building2, roles: [1, 2, 3] },
  { label: "Assets", href: "/assets", icon: Boxes, roles: [1, 2, 3, 4, 6] },
  { label: "Contacts", href: "/contacts", icon: Contact, roles: [1, 2, 3, 4, 6] },
  { label: "Technicians", href: "/technicians", icon: Wrench, roles: [1, 2, 3] },
  { label: "To Invoice", href: "/support-tickets?tab=to-invoice", icon: Receipt, roles: [1, 2, 3], dividerAfter: true },
  { label: "Resources", href: "/resources", icon: FolderOpen, roles: [1, 2, 3, 4], dividerAfter: true },
  { label: "Archive", href: "/archive", icon: Archive, roles: [1, 2, 3] },
  { label: "Settings", href: "/settings", icon: Settings, roles: [1, 4] },
  { label: "Users", href: "/users", icon: Users, roles: [1] },
];

export function Sidebar({ userRole, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-gray-200 bg-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center border-b border-gray-200 py-3 px-2">
        <Link href="/dashboard" className="flex items-center justify-center">
          <Image
            src="/logo.jpg"
            alt="Total Spray Care"
            width={130}
            height={130}
            className={cn("object-contain", collapsed ? "w-10 h-10" : "w-[120px] h-auto")}
          />
        </Link>
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-gray-600" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-gray-600" />
        )}
      </button>

      {/* Navigation */}
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <nav className="flex flex-col gap-1 p-3">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href.split("?")[0]));

            return (
              <React.Fragment key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-blue-600")} />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-xs font-semibold text-red-700">
                      {item.badge}
                    </span>
                  )}
                </Link>
                {item.dividerAfter && (
                  <div className="my-2 h-px bg-gray-100" />
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-3">
        <Link
          href="/api/auth/signout"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Link>
      </div>
    </aside>
  );
}
