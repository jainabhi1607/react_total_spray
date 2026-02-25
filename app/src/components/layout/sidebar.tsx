"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
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
  icon?: React.ElementType;
  iconSrc?: string;
  iconInline?: React.ReactNode;
  roles: number[];
  badge?: number;
  dividerAfter?: boolean;
}

function ArchiveIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", iconSrc: "/dashboard.svg", roles: [1, 2, 3, 4, 6] },
  { label: "Support Tickets", href: "/support-tickets", iconSrc: "/support_tickets.svg", roles: [1, 2, 3, 4, 6] },
  { label: "Job Cards", href: "/job-cards", iconSrc: "/briefcase.svg", roles: [1, 2, 3, 4, 6] },
  { label: "Clients", href: "/clients", iconSrc: "/clients.svg", roles: [1, 2, 3] },
  { label: "Assets", href: "/assets", iconSrc: "/package.svg", roles: [1, 2, 3, 4, 6] },
  { label: "Contacts", href: "/contacts", iconSrc: "/phone.svg", roles: [1, 2, 3, 4, 6] },
  { label: "Technicians", href: "/technicians", iconSrc: "/tool.svg", roles: [1, 2, 3] },
  { label: "To Invoice", href: "/support-tickets?tab=to-invoice", iconSrc: "/invoice.svg", roles: [1, 2, 3] },
  { label: "Resources", href: "/resources", iconSrc: "/resources.svg", roles: [1, 2, 3, 4], dividerAfter: true },
  { label: "Archive", href: "/archive", icon: ArchiveIcon, roles: [1, 2, 3] },
  { label: "Settings", href: "/settings", iconSrc: "/settings.svg", roles: [1, 4] },
  { label: "Users", href: "/users", iconSrc: "/users.svg", roles: [1] },
];

export function Sidebar({ userRole, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside
      className={cn(
        "fixed left-0 top-[calc(3.5rem+3px)] z-40 h-[calc(100vh-3.5rem-3px)] bg-[#e4f5fa] transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm cursor-pointer hover:bg-gray-50"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-gray-600" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-gray-600" />
        )}
      </button>

      {/* Navigation */}
      <ScrollArea className="h-[calc(100vh-3.5rem-3px-4rem)]">
        <nav className="flex flex-col gap-1 py-4 pl-[20px] pr-3">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href.split("?")[0]));

            return (
              <React.Fragment key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-[10px] py-2.5 pl-4 pr-3 text-[12px] font-normal transition-colors",
                    isActive
                      ? "bg-[#B7EBFF] text-[#2EA4D0]"
                      : "text-[#323E42] hover:bg-[#B7EBFF] hover:text-[#2EA4D0]",
                    collapsed && "justify-center px-2 rounded-full"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {item.iconSrc ? (
                    <img
                      src={item.iconSrc}
                      alt=""
                      className={cn("h-[16px] w-[16px] shrink-0 sidebar-icon-tint", isActive && "sidebar-icon-active")}
                    />
                  ) : item.icon ? (
                    <item.icon className={cn("h-[16px] w-[16px] shrink-0", isActive ? "text-[#2EA4D0]" : "text-gray-500 group-hover:text-[#2EA4D0]")} />
                  ) : null}
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#29b6f6] px-1.5 text-[11px] font-bold text-white border border-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="absolute bottom-0 left-0 right-0 py-3 pl-[20px] pr-3">
        <Link
          href="/api/auth/signout"
          className={cn(
            "group flex items-center gap-3 rounded-[10px] py-2.5 pl-4 pr-3 text-[12px] font-normal text-[#323E42] hover:bg-[#B7EBFF] hover:text-[#2EA4D0] transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-[16px] w-[16px] shrink-0 text-gray-500 group-hover:text-[#2EA4D0]" />
          {!collapsed && <span>Logout</span>}
        </Link>
      </div>
    </aside>
  );
}
