import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  Tags,
  Ruler,
  Users,
  FileText,
  Settings,
  Building2,
  Receipt,
  Percent,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Products",
    href: "/products",
    icon: Package,
    children: [
      { label: "Categories, Sizes & Ranges", href: "/masters/categories", icon: Tags },
      { label: "UOM / UOC", href: "/masters/uom", icon: Ruler },
    ],
  },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Quotations", href: "/quotations", icon: FileText },
  {
    label: "Settings",
    href: "/settings/company",
    icon: Settings,
    children: [
      { label: "Company Profile", href: "/settings/company", icon: Building2 },
      { label: "Quotation Settings", href: "/settings/quotation", icon: Receipt },
      { label: "Tax Settings", href: "/settings/tax", icon: Percent },
    ],
  },
];