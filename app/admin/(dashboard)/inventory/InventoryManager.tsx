"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Item={id:string;sku:string;name:string;category:string;unit:string;quantity:number;reorderLevel:number};

export function InventoryManager({items}:{items:Item[]}){
 const router=useRouter();const [error,setError]=useState("");const [busy,setBusy]=useState(false);
 async function add(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError("");const form=e.currentTarget;const fd=new FormData(form);
  try{
   const res=await fetch("/api/admin/inventory",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    sku:fd.get("sku"),name:fd.get("name"),category:fd.get("category"),unit:fd.get("unit"),
    quantity:Number(fd.get("quantity")),reorderLevel:Number(fd.get("reorderLevel")),
   })});
   const data=await res.json();if(!res.ok)throw new Error(data.error||"Could not add inventory.");
   form.reset();router.refresh();
  }catch(err){setError(err instanceof Error?err.message:"Could not add inventory.");}finally{setBusy(false)}
 }
 async function adjust(id:string,delta:number,type:string,note:string){
  if(!Number.isFinite(delta)||delta===0)return;
  setBusy(true);setError("");
  try{
   const res=await fetch("/api/admin/inventory/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({delta,type,note})});
   const data=await res.json();if(!res.ok)throw new Error(data.error||"Could not adjust stock.");
   router.refresh();
  }catch(err){setError(err instanceof Error?err.message:"Could not adjust stock.");}finally{setBusy(false)}
 }
 return <div className="inventory-manager">
  <form className="admin-card inventory-add" onSubmit={add}>
   <h2>Add inventory item</h2>
   <div className="admin-form-row"><label>SKU<input name="sku" required/></label><label>Name<input name="name" required/></label></div>
   <div className="admin-form-row"><label>Category<input name="category" required placeholder="Paper, vinyl, apparel blank…"/></label><label>Unit<input name="unit" defaultValue="unit" required/></label></div>
   <div className="admin-form-row"><label>Opening quantity<input name="quantity" type="number" min="0" step=".01" defaultValue="0"/></label><label>Reorder level<input name="reorderLevel" type="number" min="0" step=".01" defaultValue="0"/></label></div>
   <button className="button button-red" disabled={busy}>Add Item</button>
  </form>

  <section className="admin-card">
   <h2>Stock</h2>
   <div className="admin-table-wrap"><table className="admin-table">
    <thead><tr><th>SKU</th><th>Item</th><th>Category</th><th>On hand</th><th>Reorder at</th><th>Status</th><th>Adjust</th></tr></thead>
    <tbody>{items.map(item=><InventoryRow key={item.id} item={item} busy={busy} adjust={adjust}/>)}</tbody>
   </table>{!items.length&&<div className="admin-empty">No inventory items yet.</div>}</div>
  </section>
  {error&&<p className="wave-save-message" style={{color:"#b42318",background:"#fff1f1"}}>{error}</p>}
 </div>;
}

function InventoryRow({item,busy,adjust}:{item:Item;busy:boolean;adjust:(id:string,delta:number,type:string,note:string)=>Promise<void>}){
 const [delta,setDelta]=useState(0);const [type,setType]=useState("RECEIPT");const [note,setNote]=useState("");
 const low=item.quantity<=item.reorderLevel;
 return <tr>
  <td>{item.sku}</td><td>{item.name}<small>{item.unit}</small></td><td>{item.category}</td>
  <td>{item.quantity.toLocaleString()} {item.unit}</td><td>{item.reorderLevel.toLocaleString()}</td>
  <td><span className={"ru-status-pill "+(low?"s-overdue":"s-ready")}>{low?"Low stock":"OK"}</span></td>
  <td><div className="inventory-adjust"><select value={type} onChange={e=>setType(e.target.value)}><option>RECEIPT</option><option>USAGE</option><option>ADJUSTMENT</option><option>WASTE</option><option>RETURN</option></select><input type="number" step=".01" value={delta} onChange={e=>setDelta(Number(e.target.value))}/><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note"/><button disabled={busy||!delta} onClick={()=>adjust(item.id,delta,type,note)}>Apply</button></div></td>
 </tr>;
}
