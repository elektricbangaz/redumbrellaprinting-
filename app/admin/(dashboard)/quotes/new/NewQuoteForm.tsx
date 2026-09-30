"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

type Line={description:string;quantity:number;unitPriceJmd:number};

export function NewQuoteForm(){
 const router=useRouter();
 const [lines,setLines]=useState<Line[]>([{description:"",quantity:1,unitPriceJmd:0}]);
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const subtotal=lines.reduce((sum,l)=>sum+l.quantity*l.unitPriceJmd,0);
 function patch(i:number,p:Partial<Line>){setLines(x=>x.map((l,n)=>n===i?{...l,...p}:l))}
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError("");const fd=new FormData(e.currentTarget);
  try{
   const res=await fetch("/api/admin/quotes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    name:fd.get("name"),email:fd.get("email"),phone:fd.get("phone"),company:fd.get("company"),
    jobType:fd.get("jobType"),validUntil:fd.get("validUntil"),notes:fd.get("notes"),items:lines,
   })});
   const data=await res.json();if(!res.ok)throw new Error(data.error||"Could not create quote.");
   router.push("/quotes/"+data.quoteId);
  }catch(err){setError(err instanceof Error?err.message:"Could not create quote.");setBusy(false)}
 }
 return <form className="wave-document" onSubmit={submit}>
  <header className="wave-document-head"><div><span className="wave-kicker">NEW QUOTE</span><h1>Quick Quote</h1><p>Create a customer estimate and continue editing it in the quote workspace.</p></div><button className="button button-red" disabled={busy}>{busy?"Creating…":"Create Quote"}</button></header>
  <section className="wave-meta-grid">
   <label><small>Customer name</small><input name="name" required/></label>
   <label><small>Email</small><input name="email" type="email" required/></label>
   <label><small>Phone</small><input name="phone"/></label>
   <label><small>Company</small><input name="company"/></label>
   <label><small>Job type</small><input name="jobType" required/></label>
   <label><small>Valid until</small><input name="validUntil" type="date"/></label>
  </section>
  <section className="wave-lines">
   <div className="wave-line wave-line-head"><span>Description</span><span>Qty</span><span>Rate (JMD)</span><span>Amount</span><span></span></div>
   {lines.map((line,i)=><div className="wave-line" key={i}>
    <input value={line.description} onChange={e=>patch(i,{description:e.target.value})} required placeholder="Product / service"/>
    <input type="number" min="1" value={line.quantity} onChange={e=>patch(i,{quantity:Math.max(1,Number(e.target.value)||1)})}/>
    <input type="number" min="0" step=".01" value={line.unitPriceJmd} onChange={e=>patch(i,{unitPriceJmd:Math.max(0,Number(e.target.value)||0)})}/>
    <strong>{"J$"+(line.quantity*line.unitPriceJmd).toLocaleString()}</strong>
    <button type="button" onClick={()=>setLines(x=>x.length===1?x:x.filter((_,n)=>n!==i))}><Trash2 size={15}/></button>
   </div>)}
   <button className="wave-add-line" type="button" onClick={()=>setLines(x=>[...x,{description:"",quantity:1,unitPriceJmd:0}])}><Plus size={15}/> Add line item</button>
  </section>
  <section className="wave-document-foot"><label className="wave-notes"><small>Notes / production brief</small><textarea name="notes" rows={5}/></label><div className="wave-totals"><div className="total"><span>Estimate</span><strong>{"J$"+subtotal.toLocaleString()}</strong></div></div></section>
  {error&&<p className="wave-save-message" style={{color:"#b42318",background:"#fff1f1"}}>{error}</p>}
 </form>
}
