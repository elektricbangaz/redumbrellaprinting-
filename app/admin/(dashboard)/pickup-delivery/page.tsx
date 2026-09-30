import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { HandoffActions } from "./HandoffActions";

export const dynamic="force-dynamic";

export default async function PickupDeliveryPage(){
  const jobs=await prisma.workOrder.findMany({
    where:{stage:{in:["READY","COMPLETED"]}},
    include:{order:{include:{items:{include:{product:true}}}}},
    orderBy:{updatedAt:"desc"},
  });
  const ready=jobs.filter(j=>j.stage==="READY").length;
  const handedOff=jobs.filter(j=>j.stage==="COMPLETED"&&j.handoffAt).length;

  return <div className="ru-page">
    <div className="ru-page-heading"><div><h1>Pickup & Delivery</h1><p>Customer handoff, delivery references and completed collections.</p></div></div>
    <section className="admin-kpi-strip">
      <div><small>Ready for handoff</small><strong>{ready}</strong></div>
      <div><small>Handed off</small><strong>{handedOff}</strong></div>
      <div><small>Total in view</small><strong>{jobs.length}</strong></div>
    </section>
    <div className="admin-card"><div className="admin-table-wrap"><table className="admin-table">
      <thead><tr><th>Job</th><th>Customer</th><th>Order</th><th>Items</th><th>Status</th><th>Method / Tracking</th><th>Updated</th><th>Action</th></tr></thead>
      <tbody>{jobs.map(job=><tr key={job.id}>
        <td><Link href={"/jobs?job="+job.id}>{job.workOrderNumber}</Link></td>
        <td>{job.order.customerName}</td>
        <td><Link href={"/orders/"+job.order.id}>{job.order.orderNumber}</Link></td>
        <td>{job.order.items.reduce((sum,item)=>sum+item.quantity,0)}</td>
        <td><span className={"ru-status-pill s-"+job.stage.toLowerCase()}>{job.stage==="READY"?"Ready":"Completed"}</span></td>
        <td>{job.fulfillmentMethod??"—"}{job.trackingNumber&&<small>{job.trackingNumber}</small>}</td>
        <td>{job.handoffAt?.toLocaleString()??job.updatedAt.toLocaleString()}</td>
        <td><HandoffActions id={job.id} completed={job.stage==="COMPLETED"&&Boolean(job.handoffAt)} method={job.fulfillmentMethod} tracking={job.trackingNumber}/></td>
      </tr>)}</tbody>
    </table>{!jobs.length&&<div className="admin-empty"><PackageCheck/> No jobs ready for pickup or delivery.</div>}</div></div>
  </div>;
}
