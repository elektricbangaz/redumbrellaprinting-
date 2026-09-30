"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props={
  id:string; invoiceNumber:string; publicToken:string; status:string; issueDate:string; dueDate:string|null;
  customerName:string; customerEmail:string; customerPhone:string|null;
  subtotalJmd:number; taxJmd:number; totalJmd:number; amountPaidJmd:number; balanceJmd:number;
  notes:string|null; items:{description:string;quantity:number;unitPriceJmd:number;lineTotalJmd:number}[];
};
const statuses=["DRAFT","SENT","PARTIAL","PAID","OVERDUE","VOID"];
function money(value:number){return new Intl.NumberFormat("en-JM",{style:"currency",currency:"JMD",minimumFractionDigits:2}).format(value)}

export function InvoiceEditor(props:Props){
 const router=useRouter();
 const [status,setStatus]=useState(props.status);
 const [dueDate,setDueDate]=useState(props.dueDate||"");
 const [notes,setNotes]=useState(props.notes||"");
 const [amountPaidJmd,setAmountPaidJmd]=useState(props.amountPaidJmd);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 async function copyCustomerLink(){
  const url=window.location.origin.replace("admin.","www.")+"/i/"+props.publicToken;
  try{await navigator.clipboard.writeText(url);setMessage("Customer link copied.");}
  catch{setMessage("Customer link: "+url);}
 }
 async function sendInvoice(){
  setBusy(true);setMessage("");
  try{
   const res=await fetch("/api/admin/invoices/"+props.id+"/send",{method:"POST"});
   const data=await res.json();if(!res.ok)throw new Error(data.error||"Could not send invoice.");
   if(status==="DRAFT")setStatus("SENT");
   setMessage("Invoice sent. Customer link: "+data.url);router.refresh();
  }catch(error){setMessage(error instanceof Error?error.message:"Could not send invoice.")}
  finally{setBusy(false)}
 }
 async function save(){
  setBusy(true);setMessage("");
  try{
   const res=await fetch("/api/admin/invoices/"+props.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status,dueDate:dueDate||null,notes:notes||null,amountPaidJmd})});
   const data=await res.json(); if(!res.ok)throw new Error(data.error||"Could not save invoice.");
   setStatus(data.invoice.status); setMessage("Saved"); router.refresh();
  }catch(error){setMessage(error instanceof Error?error.message:"Could not save invoice.")}
  finally{setBusy(false)}
 }
 const liveBalance=Math.max(0,props.totalJmd-amountPaidJmd);
 return <div className="wave-document">
  <header className="wave-document-head">
   <div><span className="wave-kicker">INVOICE</span><h1>{props.invoiceNumber}</h1><p>{props.customerName}</p></div>
   <div className="wave-document-actions"><select value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select><button className="button button-outline" onClick={copyCustomerLink} disabled={busy}>Copy Link</button><button className="button button-outline" onClick={sendInvoice} disabled={busy}>Send Invoice</button><button className="button button-red" onClick={save} disabled={busy}>{busy?"Saving…":"Save Invoice"}</button></div>
  </header>
  <section className="wave-meta-grid">
   <div><small>Bill to</small><strong>{props.customerName}</strong><span>{props.customerEmail}</span>{props.customerPhone&&<span>{props.customerPhone}</span>}</div>
   <label><small>Issue date</small><input value={props.issueDate} readOnly/></label>
   <label><small>Due date</small><input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></label>
   <div><small>Status</small><strong>{status.replaceAll("_"," ")}</strong></div>
  </section>
  <section className="wave-lines">
   <div className="wave-line wave-line-head"><span>Description</span><span>Qty</span><span>Rate</span><span>Amount</span><span></span></div>
   {props.items.map((item,index)=><div className="wave-line wave-line-readonly" key={index}><span>{item.description}</span><span>{item.quantity}</span><span>{money(item.unitPriceJmd)}</span><strong>{money(item.lineTotalJmd)}</strong><span></span></div>)}
  </section>
  <section className="wave-document-foot">
   <label className="wave-notes"><small>Notes / terms</small><textarea rows={5} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
   <div className="wave-totals">
    <div><span>Subtotal</span><strong>{money(props.subtotalJmd)}</strong></div>
    <div><span>Tax</span><strong>{money(props.taxJmd)}</strong></div>
    <div className="total"><span>Total</span><strong>{money(props.totalJmd)}</strong></div>
    <label><span>Amount paid</span><input type="number" min="0" step="0.01" value={amountPaidJmd} onChange={e=>setAmountPaidJmd(Math.max(0,Number(e.target.value)||0))}/></label>
    <div className="balance"><span>Balance due</span><strong>{money(liveBalance)}</strong></div>
   </div>
  </section>
  {message&&<p className="wave-save-message">{message}</p>}
 </div>;
}
