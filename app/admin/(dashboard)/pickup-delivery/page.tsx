import Link from "next/link";
import { PackageCheck, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
export const dynamic="force-dynamic";
export default async function PickupDeliveryPage(){
  const jobs=await prisma.workOrder.findMany({where:{stage:{in:["READY","COMPLETED"]}},include:{order:{include:{items:{include:{product:true}}}}},orderBy:{updatedAt:"desc"}});
  return <div className="ru-page"><div className="ru-page-heading"><div><h1>Pickup & Delivery</h1><p>Jobs that are ready for handoff or have been completed.</p></div></div><div className="admin-card"><table className="ru-queue-table"><thead><tr><th>Job</th><th>Customer</th><th>Order</th><th>Items</th><th>Status</th><th>Updated</th></tr></thead><tbody>{jobs.map(j=><tr key={j.id}><td><Link href={"/jobs?job="+j.id}>{j.workOrderNumber}</Link></td><td>{j.order.customerName}</td><td>{j.order.orderNumber}</td><td>{j.order.items.reduce((s,i)=>s+i.quantity,0)}</td><td><span className="ru-status-pill">{j.stage==="READY"?"Ready":"Completed"}</span></td><td>{j.updatedAt.toLocaleString()}</td></tr>)}</tbody></table>{!jobs.length&&<div className="admin-empty"><PackageCheck/> No jobs ready for pickup or delivery.</div>}</div></div>;
}
