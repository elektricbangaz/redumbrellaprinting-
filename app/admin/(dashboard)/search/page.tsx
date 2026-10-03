import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatJMD } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const term = q.slice(0, 120);

  const empty = { jobs: [], customers: [], orders: [], quotes: [], invoices: [] } as const;
  const results = term.length < 2 ? empty : await Promise.all([
    prisma.workOrder.findMany({
      where: { OR: [
        { workOrderNumber: { contains: term, mode: "insensitive" } },
        { order: { orderNumber: { contains: term, mode: "insensitive" } } },
        { order: { customerName: { contains: term, mode: "insensitive" } } },
        { order: { customerEmail: { contains: term, mode: "insensitive" } } },
      ] },
      include: { order: true }, orderBy: { updatedAt: "desc" }, take: 8,
    }),
    prisma.customer.findMany({
      where: { OR: [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
      ] }, orderBy: { createdAt: "desc" }, take: 8,
    }),
    prisma.order.findMany({
      where: { OR: [
        { orderNumber: { contains: term, mode: "insensitive" } },
        { customerName: { contains: term, mode: "insensitive" } },
        { customerEmail: { contains: term, mode: "insensitive" } },
        { customerPhone: { contains: term, mode: "insensitive" } },
      ] }, orderBy: { updatedAt: "desc" }, take: 8,
    }),
    prisma.quote.findMany({
      where: { OR: [
        { quoteNumber: { contains: term, mode: "insensitive" } },
        { customerName: { contains: term, mode: "insensitive" } },
        { customerEmail: { contains: term, mode: "insensitive" } },
        { jobType: { contains: term, mode: "insensitive" } },
      ] }, orderBy: { updatedAt: "desc" }, take: 8,
    }),
    prisma.invoice.findMany({
      where: { OR: [
        { invoiceNumber: { contains: term, mode: "insensitive" } },
        { customer: { name: { contains: term, mode: "insensitive" } } },
        { customer: { email: { contains: term, mode: "insensitive" } } },
      ] }, include: { customer: true }, orderBy: { updatedAt: "desc" }, take: 8,
    }),
  ]).then(([jobs, customers, orders, quotes, invoices]) => ({ jobs, customers, orders, quotes, invoices }));

  const total = Object.values(results).reduce((sum, rows) => sum + rows.length, 0);

  return <div className="ru-page">
    <div className="ru-page-heading"><div><h1>Search</h1><p>Find jobs, customers, orders, quotes and invoices from one place.</p></div></div>
    <form className="admin-card admin-search-page" action="/search"><Search size={18}/><input name="q" defaultValue={term} autoFocus placeholder="Search by name, email, phone or reference number"/><button className="button button-red">Search</button></form>
    {term.length < 2 ? <div className="admin-card admin-empty">Enter at least two characters to search the portal.</div> : total === 0 ? <div className="admin-card admin-empty">No results for “{term}”.</div> : <div className="search-results-grid">
      {results.jobs.length > 0 && <section className="admin-card"><h2>Jobs</h2>{results.jobs.map(row => <Link className="portal-search-result" key={row.id} href={`/jobs?job=${row.id}`}><strong>{row.workOrderNumber}</strong><span>{row.order.customerName} · {row.order.orderNumber}</span><small>{row.stage.replaceAll("_", " ")}</small></Link>)}</section>}
      {results.customers.length > 0 && <section className="admin-card"><h2>Customers</h2>{results.customers.map(row => <Link className="portal-search-result" key={row.id} href={`/customers/${row.id}`}><strong>{row.name || row.email}</strong><span>{row.email}</span><small>{row.phone || "No phone"}</small></Link>)}</section>}
      {results.orders.length > 0 && <section className="admin-card"><h2>Orders</h2>{results.orders.map(row => <Link className="portal-search-result" key={row.id} href={`/orders/${row.id}`}><strong>{row.orderNumber}</strong><span>{row.customerName}</span><small>{row.status.replaceAll("_", " ")} · {formatJMD(row.total)}</small></Link>)}</section>}
      {results.quotes.length > 0 && <section className="admin-card"><h2>Quotes</h2>{results.quotes.map(row => <Link className="portal-search-result" key={row.id} href={`/quotes/${row.id}`}><strong>{row.quoteNumber}</strong><span>{row.customerName} · {row.jobType}</span><small>{row.status} · {formatJMD(row.total)}</small></Link>)}</section>}
      {results.invoices.length > 0 && <section className="admin-card"><h2>Invoices</h2>{results.invoices.map(row => <Link className="portal-search-result" key={row.id} href={`/invoices/${row.id}`}><strong>{row.invoiceNumber}</strong><span>{row.customer.name || row.customer.email}</span><small>{row.status} · {formatJMD(row.balance)} balance</small></Link>)}</section>}
    </div>}
  </div>;
}
