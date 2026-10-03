"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Item={id:string;sku:string;name:string;category:string;unit:string;quantity:number;reorderLevel:number;reserved:number};
type Product={id:string;name:string;slug:string};
type Recipe={id:string;productName:string;itemName:string;unit:string;productionMethod:string|null;placement:string|null;quantityPerUnit:number;wastePercent:number};

export function InventoryManager({items,products,recipes}:{items:Item[];products:Product[];recipes:Recipe[]}){
 const router=useRouter();const [error,setError]=useState("");const [busy,setBusy]=useState(false);
 async function json(url:string,init:RequestInit){setBusy(true);setError("");try{const res=await fetch(url,init);const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||"Update failed.");router.refresh();return data;}catch(err){setError(err instanceof Error?err.message:"Update failed.");return null;}finally{setBusy(false)}}
 async function add(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();const form=e.currentTarget;const fd=new FormData(form);
  const data=await json("/api/admin/inventory",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sku:fd.get("sku"),name:fd.get("name"),category:fd.get("category"),unit:fd.get("unit"),quantity:Number(fd.get("quantity")),reorderLevel:Number(fd.get("reorderLevel"))})});
  if(data)form.reset();
 }
 async function adjust(id:string,delta:number,type:string,note:string){if(!Number.isFinite(delta)||delta===0)return;await json("/api/admin/inventory/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({delta,type,note})});}
 async function addRecipe(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();const form=e.currentTarget;const fd=new FormData(form);
  const data=await json("/api/admin/inventory/recipes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:fd.get("productId"),inventoryItemId:fd.get("inventoryItemId"),productionMethod:fd.get("productionMethod")||null,placement:fd.get("placement")||null,quantityPerUnit:Number(fd.get("quantityPerUnit")),wastePercent:Number(fd.get("wastePercent"))})});
  if(data)form.reset();
 }
 return <div className="inventory-manager">
  <div className="admin-grid-2">
   <form className="admin-card inventory-add" onSubmit={add}>
    <h2>Add inventory item</h2>
    <div className="admin-form-row"><label>SKU<input name="sku" required/></label><label>Name<input name="name" required/></label></div>
    <div className="admin-form-row"><label>Category<input name="category" required placeholder="Paper, vinyl, apparel blank…"/></label><label>Unit<input name="unit" defaultValue="unit" required/></label></div>
    <div className="admin-form-row"><label>Opening quantity<input name="quantity" type="number" min="0" step=".01" defaultValue="0"/></label><label>Reorder level<input name="reorderLevel" type="number" min="0" step=".01" defaultValue="0"/></label></div>
    <button className="button button-red" disabled={busy}>Add Item</button>
   </form>
   <form className="admin-card inventory-add" onSubmit={addRecipe}>
    <h2>Production material recipe</h2><p className="admin-data-note">Defines how much stock one finished unit consumes. Matching jobs reserve this stock automatically and consume it when production starts.</p>
    <div className="admin-form-row"><label>Product<select name="productId" required><option value="">Select product</option>{products.map(product=><option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>Inventory item<select name="inventoryItemId" required><option value="">Select stock</option>{items.map(item=><option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}</select></label></div>
    <div className="admin-form-row"><label>Production method<input name="productionMethod" placeholder="Optional: DTF, embroidery…"/></label><label>Placement<input name="placement" placeholder="Optional: full-front…"/></label></div>
    <div className="admin-form-row"><label>Qty used per finished unit<input name="quantityPerUnit" type="number" min="0.0001" step=".0001" required/></label><label>Waste allowance %<input name="wastePercent" type="number" min="0" max="100" step=".1" defaultValue="0"/></label></div>
    <button className="button button-red" disabled={busy}>Add Recipe</button>
   </form>
  </div>

  <section className="admin-card">
   <h2>Stock</h2>
   <div className="admin-table-wrap"><table className="admin-table">
    <thead><tr><th>SKU</th><th>Item</th><th>Category</th><th>On hand</th><th>Reserved</th><th>Available</th><th>Reorder at</th><th>Status</th><th>Adjust</th></tr></thead>
    <tbody>{items.map(item=><InventoryRow key={item.id} item={item} busy={busy} adjust={adjust}/>)}</tbody>
   </table>{!items.length&&<div className="admin-empty">No inventory items yet.</div>}</div>
  </section>

  <section className="admin-card"><h2>Material Recipes</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Material</th><th>Method</th><th>Placement</th><th>Usage / unit</th><th>Waste</th><th /></tr></thead><tbody>{recipes.map(recipe=><tr key={recipe.id}><td>{recipe.productName}</td><td>{recipe.itemName}<small>{recipe.unit}</small></td><td>{recipe.productionMethod||"Any"}</td><td>{recipe.placement||"Any"}</td><td>{recipe.quantityPerUnit}</td><td>{recipe.wastePercent}%</td><td><button className="admin-link-button" disabled={busy} onClick={()=>json(`/api/admin/inventory/recipes/${recipe.id}`,{method:"DELETE"})}>Disable</button></td></tr>)}</tbody></table>{!recipes.length&&<div className="admin-empty">No material recipes yet. Add recipes before expecting automatic job reservations.</div>}</div></section>
  {error&&<p className="wave-save-message" style={{color:"#b42318",background:"#fff1f1"}}>{error}</p>}
 </div>;
}

function InventoryRow({item,busy,adjust}:{item:Item;busy:boolean;adjust:(id:string,delta:number,type:string,note:string)=>Promise<void>}){
 const [delta,setDelta]=useState(0);const [type,setType]=useState("RECEIPT");const [note,setNote]=useState("");
 const available=Math.max(0,item.quantity-item.reserved);const low=available<=item.reorderLevel;
 return <tr>
  <td>{item.sku}</td><td>{item.name}<small>{item.unit}</small></td><td>{item.category}</td>
  <td>{item.quantity.toLocaleString()} {item.unit}</td><td>{item.reserved.toLocaleString()} {item.unit}</td><td><strong>{available.toLocaleString()} {item.unit}</strong></td><td>{item.reorderLevel.toLocaleString()}</td>
  <td><span className={"ru-status-pill "+(low?"s-overdue":"s-ready")}>{low?"Reorder":"OK"}</span></td>
  <td><div className="inventory-adjust"><select value={type} onChange={e=>setType(e.target.value)}><option>RECEIPT</option><option>USAGE</option><option>ADJUSTMENT</option><option>WASTE</option><option>RETURN</option></select><input type="number" step=".01" value={delta} onChange={e=>setDelta(Number(e.target.value))}/><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note"/><button disabled={busy||!delta} onClick={()=>adjust(item.id,delta,type,note)}>Apply</button></div></td>
 </tr>;
}
