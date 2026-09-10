"use client";
import { useMemo,useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { formatJMD } from "@/lib/money";

type P={id:string;name:string;slug:string;category:string;description:string|null;basePrice:number;images:string[]};
export function ProductsBrowser({products,initialQuery="",initialCategory=""}:{products:P[];initialQuery?:string;initialCategory?:string}){
 const [q,setQ]=useState(initialQuery); const [category,setCategory]=useState(initialCategory);
 const categories=Array.from(new Set(products.map(p=>p.category)));
 const filtered=useMemo(()=>products.filter(p=>(!category||p.category.toLowerCase().includes(category.toLowerCase()))&&(!q||[p.name,p.category,p.description||""].join(" ").toLowerCase().includes(q.toLowerCase()))),[products,q,category]);
 return <div className="catalog">
  <div className="catalog-toolbar"><label><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search products…"/></label><div className="catalog-chips"><button className={!category?"active":""} onClick={()=>setCategory("")}>All</button>{categories.map(c=><button key={c} className={category===c?"active":""} onClick={()=>setCategory(c)}>{c}</button>)}</div></div>
  <div className="catalog-count">{filtered.length} product{filtered.length===1?"":"s"}</div>
  <div className="catalog-grid">{filtered.map(p=><article key={p.id} className="catalog-card">
    <a href={`/products/${p.slug}`} className="catalog-image"><img src={p.images[0]} alt={p.name}/></a>
    <div className="catalog-body"><span>{p.category}</span><h2><a href={`/products/${p.slug}`}>{p.name}</a></h2><p>{p.description}</p><div><strong>{formatJMD(p.basePrice)}</strong><a href={`/create?product=${p.slug}`}>Customize <ArrowRight/></a></div></div>
  </article>)}</div>
  {!filtered.length&&<div className="catalog-empty"><h2>No products found.</h2><p>Try another search or request a custom quote for something outside the standard catalog.</p><a className="sf-primary" href="/quote">Request a Quote</a></div>}
 </div>
}
