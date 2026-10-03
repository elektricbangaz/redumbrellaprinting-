import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic="force-dynamic";

export default async function DesignsArchivePage({searchParams}:{searchParams:Promise<{q?:string;status?:string;approval?:string}>}){
 const sp=await searchParams;const q=(sp.q||"").trim();const statuses=["PENDING","COMPLETE","CANCELLED"] as const;const approvals=["PENDING","APPROVED","CHANGES_REQUESTED","REJECTED"] as const;
 const status=statuses.includes(sp.status as typeof statuses[number])?sp.status as typeof statuses[number]:undefined;
 const approval=approvals.includes(sp.approval as typeof approvals[number])?sp.approval as typeof approvals[number]:undefined;
 const designs=await prisma.design.findMany({
  where:{...(status?{status}:{}),...(approval?{approvalStatus:approval}:{}),...(q?{OR:[{customer:{name:{contains:q,mode:"insensitive"}}},{customer:{email:{contains:q,mode:"insensitive"}}},{product:{name:{contains:q,mode:"insensitive"}}}]}:{})},
  include:{customer:true,product:true,_count:{select:{orderItems:true,quotes:true}}},orderBy:{createdAt:"desc"},take:250,
 });
 const counts=await prisma.design.groupBy({by:["status"],_count:{_all:true}});
 const count=(key:string)=>counts.find(row=>row.status===key)?._count._all||0;
 return <div className="ru-page">
  <div className="ru-page-heading"><div><h1>Design Archive</h1><p>Every submitted design, proof state, customer, linked order and lifecycle status in one operational archive.</p></div></div>
  <section className="ru-stat-strip"><article><span><small>Pending</small><strong>{count("PENDING")}</strong><em>active designs</em></span></article><article><span><small>Complete</small><strong>{count("COMPLETE")}</strong><em>produced</em></span></article><article><span><small>Cancelled</small><strong>{count("CANCELLED")}</strong><em>closed</em></span></article><article><span><small>Results</small><strong>{designs.length}</strong><em>current filter</em></span></article></section>
  <form className="admin-toolbar" action="/designs"><input name="q" defaultValue={q} placeholder="Search customer or product"/><select name="status" defaultValue={status||""}><option value="">All lifecycle statuses</option>{statuses.map(value=><option key={value}>{value}</option>)}</select><select name="approval" defaultValue={approval||""}><option value="">All proof states</option>{approvals.map(value=><option key={value}>{value}</option>)}</select><button>Filter</button><Link href="/designs">Clear</Link></form>
  <section className="admin-card"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Preview</th><th>Design</th><th>Customer</th><th>Lifecycle</th><th>Proof</th><th>Orders</th><th>Quotes</th><th>Created</th><th /></tr></thead><tbody>{designs.map(design=><tr key={design.id}><td>{design.previewImage?<img className="design-archive-thumb" src={design.previewImage} alt=""/>:<span className="design-archive-placeholder">No preview</span>}</td><td><strong>{design.product.name}</strong><small>{design.color}</small></td><td>{design.customer?.name||"Guest"}<small>{design.customer?.email||"No email"}</small></td><td><span className={"ru-status-pill s-"+design.status.toLowerCase()}>{design.status}</span></td><td><span className={"ru-status-pill s-"+design.approvalStatus.toLowerCase()}>{design.approvalStatus.replaceAll("_"," ")}</span></td><td>{design._count.orderItems}</td><td>{design._count.quotes}</td><td>{design.createdAt.toLocaleDateString()}</td><td><Link className="admin-link-button" href={`/design-approvals/${design.id}`}>Open</Link></td></tr>)}</tbody></table>{!designs.length&&<div className="admin-empty">No designs match this filter.</div>}</div></section>
 </div>;
}
