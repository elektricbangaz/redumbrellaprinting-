"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes, ClipboardCheck, FileText, Factory, FileClock, Home, PackageCheck,
  ReceiptText, Settings, Shirt, ShoppingBag, Truck, UserRoundCog, Users
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/jobs", label: "Jobs", icon: PackageCheck },
  { href: "/job-queue", label: "Job Queue", icon: FileClock },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/catalog", label: "Products", icon: Shirt },
  { href: "/design-approvals", label: "Design Proofs", icon: ClipboardCheck },
  { href: "/production", label: "Production", icon: Factory },
  { href: "/pickup-delivery", label: "Pickup & Delivery", icon: Truck },
  { href: "/invoices", label: "Invoices", icon: ReceiptText },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/staff", label: "Staff", icon: UserRoundCog },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="admin-sidebar ru-sidebar">
      <Link className="admin-brand ru-brand" href="/dashboard" aria-label="Red Umbrella Printing admin home">
        <img className="admin-brand-logo" src="/logo-white.svg" alt="" />
        <span className="admin-brand-copy"><strong>Red Umbrella</strong><small>PRINTING</small></span>
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
