"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewJobForm(){
 const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError("");const fd=new FormData(e.currentTarget);
  try{
   const res=await fetch("/api/admin/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    name:fd.get("name"),email:fd.get("email"),phone:fd.get("phone"),
    description:fd.get("description"),quantity:Number(fd.get("quantity")),unitPriceJmd:Number(fd.get("unitPriceJmd")),
    dueDate:fd.get("dueDate"),priority:fd.get("priority"),productionMethod:fd.get("productionMethod"),
    placement:fd.get("placement"),notes:fd.get("notes"),paid:fd.get("paid")==="on",
   })});
   const data=await res.json();if(!res.ok)throw new Error(data.error||"Could not create job.");
   router.push("/orders/"+data.orderId);
  }catch(err){setError(err instanceof Error?err.message:"Could not create job.");setBusy(false)}
 }
 return <form className="wave-document" onSubmit={submit}>
  <header className="wave-document-head"><div><span className="wave-kicker">NEW JOB</span><h1>Counter Job</h1><p>Create a walk-in/manual job, invoice and production record in one step.</p></div><button className="button button-red" disabled={busy}>{busy?"Creating…":"Create Job"}</button></header>
  <section className="wave-meta-grid">
   <label><small>Customer name</small><input name="name" required/></label>
   <label><small>Email</small><input type="email" name="email" required/></label>
   <label><small>Phone</small><input name="phone"/></label>
   <label><small>Due date</small><input type="date" name="dueDate"/></label>
   <label><small>Priority</small><select name="priority" defaultValue="NORMAL"><option>LOW</option><option>NORMAL</option><option>HIGH</option><option>URGENT</option></select></label>
   <label><small>Production method</small><input name="productionMethod" placeholder="DTF, embroidery, wide format…"/></label>
   <label><small>Placement / station</small><input name="placement" placeholder="Full front, left chest, press 1…"/></label>
   <label className="wave-paid-toggle"><small>Payment</small><span><input type="checkbox" name="paid"/> Paid at counter</span></label>
  </section>
  <section className="wave-lines">
   <div className="wave-line wave-line-head"><span>Description</span><span>Qty</span><span>Rate (JMD)</span><span>Amount</span><span></span></div>
   <div className="wave-line"><input name="description" required placeholder="Job / product description"/><input name="quantity" type="number" min="1" defaultValue="1" required/><input name="unitPriceJmd" type="number" min="0" step=".01" required/><strong>Counter price</strong><span></span></div>
  </section>
  <section className="wave-document-foot"><label className="wave-notes"><small>Production notes</small><textarea name="notes" rows={5}/></label></section>
  {error&&<p className="wave-save-message" style={{color:"#b42318",background:"#fff1f1"}}>{error}</p>}
 </form>
}
