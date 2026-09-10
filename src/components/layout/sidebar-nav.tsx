"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { NAV_ITEMS, type NavItem } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavGroup({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href) || item.children?.some((c) => isActive(pathname, c.href));
  const [open, setOpen] = useState(!!active);

  if (!item.children) {
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive(pathname, item.href)
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <item.icon className="size-4 shrink-0" />
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <div className="flex items-center">
        <Link
          href={item.href}
          className={cn(
            "flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            active ? "text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <item.icon className="size-4 shrink-0" />
          {item.label}
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="ml-auto rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={`Toggle ${item.label} submenu`}
        >
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>
      {open && (
        <div className="ml-4 mt-1 flex flex-col gap-1 border-l pl-3">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                isActive(pathname, child.href)
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const items = NAV_ITEMS;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <img src="/logo.png" alt="MTI" className="size-8" />
        <div className="leading-tight">
          <p className="text-sm font-bold">MASTER TECH</p>
          <p className="text-xs text-muted-foreground">INTERNATIONAL</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavGroup key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
    </div>
  );
}
