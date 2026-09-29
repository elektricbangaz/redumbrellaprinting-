"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  BarChart3,
  CreditCard,
  ClipboardCheck,
  CircleHelp,
  FileText,
  Factory,
  HandCoins,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  PackageCheck,
  ReceiptText,
  Settings,
  Shirt,
  ShoppingBag,
  UserRoundCog,
  Umbrella,
  Users,
  type LucideIcon,
} from "lucide-react";

const groups: { label: string; items: { href: string; label: string; icon: LucideIcon }[] }[] = [
  { label: "Workspace", items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Sales & finance",
    items: [
      { href: "/orders", label: "Orders", icon: ShoppingBag },
      { href: "/quotes", label: "Quotes", icon: FileText },
      { href: "/invoices", label: "Invoices", icon: ReceiptText },
      { href: "/payments", label: "Payments", icon: CreditCard },
      { href: "/receivables", label: "Receivables", icon: HandCoins },
      { href: "/customers", label: "Customers", icon: Users },
    ],
  },
  {
    label: "Print operations",
    items: [
      { href: "/catalog", label: "Products", icon: Shirt },
      { href: "/templates", label: "Templates", icon: LayoutTemplate },
      { href: "/work-orders", label: "Production", icon: Factory },
      { href: "/design-approvals", label: "Artwork review", icon: ClipboardCheck },
      { href: "/inventory", label: "Inventory", icon: Boxes },
      { href: "/purchase-orders", label: "Purchase orders", icon: PackageCheck },
    ],
  },
  { label: "Business", items: [
    { href: "/staff", label: "Staff", icon: UserRoundCog },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/broadcasts", label: "Marketing", icon: Megaphone },
    { href: "/settings", label: "Settings", icon: Settings },
  ] },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <Link className="admin-brand" href="/dashboard" aria-label="Red Umbrella Printing admin home">
        <span className="admin-brand-mark"><Umbrella size={21} strokeWidth={2.2} /></span>
        <span className="admin-brand-copy"><strong>RED UMBRELLA</strong><small>PRINT OPERATIONS</small></span>
      </Link>
      <nav className="admin-nav" aria-label="Admin navigation">
        {groups.map((group) => (
          <section className="admin-nav-group" key={group.label}>
            <h2>{group.label}</h2>
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link className={`admin-nav-link${active ? " active" : ""}`} href={href} key={href} aria-current={active ? "page" : undefined}>
                  <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </section>
        ))}
      </nav>
      <div className="admin-sidebar-help"><CircleHelp size={16} /><span><strong>Need help?</strong><small>Contact the print team</small></span></div>
      <div className="admin-sidebar-footer"><span className="admin-status-dot" /> Red Umbrella · Operations</div>
    </aside>
  );
}