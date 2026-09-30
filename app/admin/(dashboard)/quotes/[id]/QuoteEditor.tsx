"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

type Item={description:string;quantity:number;unitPriceJmd:number};
type Props={
  id:string;
  quoteNumber:string;
  status:string;
  issueDate:string;
  validUntil:string|null;
  customerName:string;
  customerEmail:string;
  customerPhone:string|null;
  company:string|null;
  jobType:string;
  details:string;
  artworkUrl:string|null;
  budget:string|null;
  notes:string|null;
  taxJmd:number;
  items:Item[];
};

const statuses=["REQUESTED","DRAFT","SENT","VIEWED","ACCEPTED","DECLINED","EXPIRED","CONVERTED","CANCELLED"];

function money(value:number){
  return new Intl.NumberFormat("en-JM",{style:"currency",currency:"JMD",minimumFractionDigits:2}).format(value);
}

export function QuoteEditor(props:Props){
  const router=useRouter();
  const [items,setItems]=useState<Item[]>(props.items.length?props.items:[{description:props.jobType,quantity:1,unitPriceJmd:0}]);
  const [status,setStatus]=useState(props.status);
  const [validUntil,setValidUntil]=useState(props.validUntil||"");
  const [notes,setNotes]=useState(props.notes||"");
  const [taxJmd,setTaxJmd]=useState(props.taxJmd);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  const subtotal=useMemo(()=>items.reduce((sum,item)=>sum+item.quantity*item.unitPriceJmd,0),[items]);
  const total=subtotal+taxJmd;

  function updateItem(index:number,patch:Partial<Item>){
    setItems(current=>current.map((item,i)=>i===index?{...item,...patch}:item));
  }
  function addItem(){setItems(current=>[...current,{description:"",quantity:1,unitPriceJmd:0}]);}
  function removeItem(index:number){setItems(current=>current.length===1?current:current.filter((_,i)=>i!==index));}

  async function save(){
    setBusy(true);setMessage("");
    try{
      const res=await fetch("/api/admin/quotes/"+props.id,{
        method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({status,validUntil:validUntil||null,notes:notes||null,taxJmd,items}),
      });
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Could not save quote.");
      setMessage("Saved");
      router.refresh();
      return true;
    }catch(error){setMessage(error instanceof Error?error.message:"Could not save quote.");return false}
    finally{setBusy(false)}
  }

  async function createInvoice(){
    const saved=await save();
    if(!saved)return;
    setBusy(true);setMessage("");
    try{
      const res=await fetch("/api/admin/quotes/"+props.id+"/invoice",{method:"POST"});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"Could not create invoice.");
      router.push("/invoices/"+data.invoiceId);
    }catch(error){setMessage(error instanceof Error?error.message:"Could not create invoice.");setBusy(false)}
  }

  return <div className="wave-document">
    <header className="wave-document-head">
      <div><span className="wave-kicker">QUOTE</span><h1>{props.quoteNumber}</h1><p>{props.jobType}</p></div>
      <div className="wave-document-actions">
        <select value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select>
        <button className="button button-outline" onClick={save} disabled={busy}>{busy?"Saving…":"Save Quote"}</button>
        <button className="button button-red" onClick={createInvoice} disabled={busy||total<=0}>Create Invoice</button>
      </div>
    </header>

    <section className="wave-meta-grid">
      <div><small>Bill to</small><strong>{props.customerName}</strong>{props.company&&<span>{props.company}</span>}<span>{props.customerEmail}</span>{props.customerPhone&&<span>{props.customerPhone}</span>}</div>
      <label><small>Issue date</small><input value={props.issueDate} readOnly/></label>
      <label><small>Valid until</small><input type="date" value={validUntil} onChange={e=>setValidUntil(e.target.value)}/></label>
      <div><small>Budget supplied</small><strong>{props.budget||"Not specified"}</strong></div>
    </section>

    <section className="wave-brief">
      <h2>Customer brief</h2>
      <p>{props.details}</p>
      {props.artworkUrl&&<a href={props.artworkUrl} target="_blank" rel="noreferrer">Open artwork / file link →</a>}
    </section>

    <section className="wave-lines">
      <div className="wave-line wave-line-head"><span>Description</span><span>Qty</span><span>Rate (JMD)</span><span>Amount</span><span></span></div>
      {items.map((item,index)=><div className="wave-line" key={index}>
        <input value={item.description} onChange={e=>updateItem(index,{description:e.target.value})} placeholder="Item or service"/>
        <input type="number" min="1" value={item.quantity} onChange={e=>updateItem(index,{quantity:Math.max(1,Number(e.target.value)||1)})}/>
        <input type="number" min="0" step="0.01" value={item.unitPriceJmd} onChange={e=>updateItem(index,{unitPriceJmd:Math.max(0,Number(e.target.value)||0)})}/>
        <strong>{money(item.quantity*item.unitPriceJmd)}</strong>
        <button type="button" onClick={()=>removeItem(index)} aria-label="Remove line item"><Trash2 size={15}/></button>
      </div>)}
      <button className="wave-add-line" type="button" onClick={addItem}><Plus size={15}/> Add line item</button>
    </section>

    <section className="wave-document-foot">
      <label className="wave-notes"><small>Notes / terms</small><textarea rows={5} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Production notes, payment terms, exclusions or validity conditions."/></label>
      <div className="wave-totals">
        <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
        <label><span>Tax</span><input type="number" min="0" step="0.01" value={taxJmd} onChange={e=>setTaxJmd(Math.max(0,Number(e.target.value)||0))}/></label>
        <div className="total"><span>Total</span><strong>{money(total)}</strong></div>
      </div>
    </section>
    {message&&<p className="wave-save-message">{message}</p>}
  </div>;
}
