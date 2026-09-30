"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function HandoffActions({id,completed,method,tracking}:{id:string;completed:boolean;method:string|null;tracking:string|null}){
  const router=useRouter();
  const [fulfillmentMethod,setMethod]=useState<"PICKUP"|"DELIVERY">((method==="DELIVERY"?"DELIVERY":"PICKUP"));
  const [trackingNumber,setTracking]=useState(tracking||"");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  async function handoff(){
    setBusy(true);setMessage("");
    try{
      const res=await fetch("/api/admin/work-orders/"+id+"/handoff",{
        method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({fulfillmentMethod,trackingNumber}),
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"Could not complete handoff.");
      setMessage("Handoff recorded.");router.refresh();
    }catch(error){setMessage(error instanceof Error?error.message:"Could not complete handoff.")}
    finally{setBusy(false)}
  }

  if(completed)return <span className="handoff-complete">Handed off</span>;

  return <div className="handoff-actions">
    <select value={fulfillmentMethod} onChange={e=>setMethod(e.target.value as "PICKUP"|"DELIVERY")}><option value="PICKUP">Pickup</option><option value="DELIVERY">Delivery</option></select>
    {fulfillmentMethod==="DELIVERY"&&<input value={trackingNumber} onChange={e=>setTracking(e.target.value)} placeholder="Driver / tracking ref"/>}
    <button disabled={busy} onClick={handoff}>{busy?"Saving…":"Complete Handoff"}</button>
    {message&&<small>{message}</small>}
  </div>;
}
