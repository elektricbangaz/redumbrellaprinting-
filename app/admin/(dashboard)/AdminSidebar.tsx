"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes, ClipboardCheck, FileText, Factory, FileClock, Home, PackageCheck,
  ReceiptText, Settings, Shirt, ShoppingBag, Truck, UserRoundCog, Users, MonitorSmartphone,
  Images, Landmark, Megaphone, BarChart3, LayoutTemplate, BellRing, CircleDollarSign
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/pos", label: "POS", icon: MonitorSmartphone },
  { href: "/jobs", label: "Jobs", icon: PackageCheck },
  { href: "/job-queue", label: "Job Queue", icon: FileClock },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/catalog", label: "Products", icon: Shirt },
  { href: "/designs", label: "Designs", icon: Images },
  { href: "/design-approvals", label: "Design Proofs", icon: ClipboardCheck },
  { href: "/production", label: "Production", icon: Factory },
  { href: "/pickup-delivery", label: "Pickup & Delivery", icon: Truck },
  { href: "/invoices", label: "Invoices", icon: ReceiptText },
  { href: "/payments", label: "Payments", icon: CircleDollarSign },
  { href: "/receivables", label: "Receivables", icon: Landmark },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/purchase-orders", label: "Purchase Orders", icon: ShoppingBag },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/staff", label: "Staff", icon: UserRoundCog },
  { href: "/notifications", label: "Notifications", icon: BellRing },
  { href: "/broadcasts", label: "Broadcasts", icon: Megaphone },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="admin-sidebar ru-sidebar">
      <Link className="admin-brand ru-brand" href="/dashboard" aria-label="Red Umbrella Printing admin home">
        <img className="admin-brand-logo admin-brand-logo-full" src="/android-chrome-512x512.png" alt="Red Umbrella Printing" />
      </Link>
      <nav className="admin-nav ru-nav" aria-label="Admin navigation">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/") ||
            (href === "/jobs" && pathname === "/work-orders");
          return (
            <Link className={"admin-nav-link" + (active ? " active" : "")} href={href} key={href} aria-current={active ? "page" : undefined}>
              <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
