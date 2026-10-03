"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Printer, Search, ShoppingCart, Trash2 } from "lucide-react";
import { formatJMD } from "@/lib/money";

type Product = { id:string;name:string;slug:string;category:string;basePrice:number;colors:string[];sizes:string[] };
type CartLine = { key:string;productId:string;name:string;quantity:number;size:string;color:string;unitPriceJmd:number;basePrice:number };

export function PosTerminal({ products }:{ products:Product[] }){
 const router=useRouter();
 const [query,setQuery]=useState("");const [category,setCategory]=useState("All");const [cart,setCart]=useState<CartLine[]>([]);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [receipt,setReceipt]=useState<{orderNumber:string;orderId:string;total:number}|null>(null);
 const categories=useMemo(()=>["All",...Array.from(new Set(products.map(p=>p.category))).sort()], [products]);
 const filtered=products.filter(p=>(category==="All"||p.category===category)&&(!query||`${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase())));
 const total=cart.reduce((sum,line)=>sum+Math.round(line.unitPriceJmd*100)*line.quantity,0);
 function add(product:Product){setCart(prev=>[...prev,{key:crypto.randomUUID(),productId:product.id,name:product.name,quantity:1,size:product.sizes[0]||"Standard",color:product.colors[0]||"Custom",unitPriceJmd:product.basePrice/100,basePrice:product.basePrice}]);}
 function patch(key:string,next:Partial<CartLine>){setCart(prev=>prev.map(line=>line.key===key?{...line,...next}:line));}
 async function checkout(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(!cart.length){setError("Add at least one item to the sale.");return;}setBusy(true);setError("");setReceipt(null);const form=e.currentTarget;const fd=new FormData(form);
  try{
   const res=await fetch("/api/admin/pos/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    customer:{name:fd.get("name"),email:fd.get("email"),phone:fd.get("phone"),address:fd.get("address")},
    items:cart.map(line=>({productId:line.productId,quantity:line.quantity,size:line.size,color:line.color,unitPriceJmd:line.unitPriceJmd})),
    productionMethod:fd.get("productionMethod"),placement:fd.get("placement"),dueDate:fd.get("dueDate"),priority:fd.get("priority"),fulfillmentMethod:fd.get("fulfillmentMethod"),paymentType:fd.get("paymentType"),notes:fd.get("notes"),
   })});
   const body=await res.json().catch(()=>({}));if(!res.ok)throw new Error(body.error||"Could not complete the sale.");
   setReceipt({orderNumber:body.orderNumber,orderId:body.orderId,total:body.total});setCart([]);form.reset();router.refresh();
  }catch(err){setError(err instanceof Error?err.message:"Could not complete the sale.");}finally{setBusy(false)}
 }
 return <div className="pos-shell">
  <section className="pos-catalog admin-card">
   <header><div><h2>Products</h2><small>{filtered.length} available</small></div><div className="pos-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products"/></div></header>
   <div className="pos-categories">{categories.map(item=><button key={item} className={category===item?"active":""} onClick={()=>setCategory(item)}>{item}</button>)}</div>
   <div className="pos-product-grid">{filtered.map(product=><button className="pos-product" key={product.id} onClick={()=>add(product)}><span>{product.category}</span><strong>{product.name}</strong><b>{product.basePrice>0?formatJMD(product.basePrice):"Enter price at POS"}</b><em><Plus size={14}/> Add</em></button>)}</div>
  </section>

  <form className="pos-checkout admin-card" onSubmit={checkout}>
   <header><div><ShoppingCart size={20}/><h2>Current Sale</h2></div><strong>{formatJMD(total)}</strong></header>
   <div className="pos-cart-lines">{cart.map(line=>{const product=products.find(p=>p.id===line.productId)!;return <article key={line.key}><div className="pos-line-head"><strong>{line.name}</strong><button type="button" onClick={()=>setCart(prev=>prev.filter(item=>item.key!==line.key))}><Trash2 size={14}/></button></div><div className="pos-line-options"><select value={line.size} onChange={e=>patch(line.key,{size:e.target.value})}>{product.sizes.map(size=><option key={size}>{size}</option>)}</select><select value={line.color} onChange={e=>patch(line.key,{color:e.target.value})}>{product.colors.map(color=><option key={color}>{color}</option>)}</select></div><div className="pos-line-price"><div><button type="button" onClick={()=>patch(line.key,{quantity:Math.max(1,line.quantity-1)})}><Minus size={13}/></button><b>{line.quantity}</b><button type="button" onClick={()=>patch(line.key,{quantity:line.quantity+1})}><Plus size={13}/></button></div><label>Unit J$<input type="number" min="0" step="1" value={line.unitPriceJmd} onChange={e=>patch(line.key,{unitPriceJmd:Number(e.target.value)})}/></label><strong>{formatJMD(Math.round(line.unitPriceJmd*100)*line.quantity)}</strong></div></article>})}{!cart.length&&<div className="pos-empty">Select a product to begin a sale.</div>}</div>

   <section className="pos-customer"><h3>Customer</h3><div className="admin-form-row"><label>Name<input name="name" required defaultValue="Walk-in Customer"/></label><label>Phone<input name="phone"/></label></div><div className="admin-form-row"><label>Email<input name="email" type="email"/></label><label>Address<input name="address"/></label></div></section>
   <section className="pos-production"><h3>Production</h3><div className="admin-form-row"><label>Method<input name="productionMethod" placeholder="DTF, screen print, routing…"/></label><label>Placement / station<input name="placement" placeholder="Full front, press 1…"/></label></div><div className="admin-form-row"><label>Due date<input name="dueDate" type="date"/></label><label>Priority<select name="priority" defaultValue="NORMAL"><option>LOW</option><option>NORMAL</option><option>HIGH</option><option>URGENT</option></select></label></div><div className="admin-form-row"><label>Fulfillment<select name="fulfillmentMethod" defaultValue="PICKUP"><option>PICKUP</option><option>DELIVERY</option></select></label><label>Payment<select name="paymentType" defaultValue="CASH"><option value="CASH">Cash — paid</option><option value="CARD_TERMINAL">Card terminal — paid</option><option value="BANK_TRANSFER">Bank transfer — paid</option><option value="UNPAID">Invoice / pay later</option></select></label></div><label>Notes<textarea name="notes" rows={2}/></label></section>
   <footer><div><span>Total</span><strong>{formatJMD(total)}</strong></div><button className="button button-red" disabled={busy||!cart.length}>{busy?"Processing…":"Complete Sale"}</button></footer>
   {error&&<p className="ru-action-error">{error}</p>}
  </form>

  {receipt&&<section className="pos-receipt admin-card"><div><small>SALE COMPLETE</small><h2>{receipt.orderNumber}</h2><p>Total {formatJMD(receipt.total)} · Order, invoice and production job created.</p></div><div><a className="button button-outline" href={`/orders/${receipt.orderId}`}>Open Order</a><button className="button button-red" onClick={()=>window.print()}><Printer size={14}/> Print Receipt</button></div></section>}
 </div>;
}
