"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Template={
  id:string;
  name:string;
  description:string|null;
  active:boolean;
  previewImage:string|null;
  productName:string|null;
};
type Design={
  id:string;
  productName:string;
  customer:string;
  previewImage:string|null;
  createdAt:string;
};

export function TemplateManager({templates,designs}:{templates:Template[];designs:Design[]}){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function createTemplate(designId:string,name:string){
    if(!name.trim())return;
    setBusy(true);setError("");
    try{
      const res=await fetch("/api/admin/templates",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({designId,name}),
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"Could not create template.");
      router.refresh();
    }catch(err){
      setError(err instanceof Error?err.message:"Could not create template.");
    }finally{setBusy(false)}
  }

  async function toggleTemplate(id:string,active:boolean){
    setBusy(true);setError("");
    try{
      const res=await fetch("/api/admin/templates/"+id,{
        method:"PATCH",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({active}),
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"Could not update template.");
      router.refresh();
    }catch(err){
      setError(err instanceof Error?err.message:"Could not update template.");
    }finally{setBusy(false)}
  }

  return <div className="template-manager">
    <section className="admin-card">
      <div className="admin-header admin-subheader"><div><h2>Reusable templates</h2><p>Saved artwork that can be reused for repeat jobs and customer requests.</p></div></div>
      <div className="template-grid">
        {templates.map(template=><article className="template-card" key={template.id}>
          <div className="template-preview">
            {template.previewImage?<img src={template.previewImage} alt={template.name}/>:<span>No preview</span>}
          </div>
          <div className="template-card-copy">
            <strong>{template.name}</strong>
            <small>{template.productName||"General template"}</small>
            {template.description&&<p>{template.description}</p>}
            <button disabled={busy} onClick={()=>toggleTemplate(template.id,!template.active)}>
              {template.active?"Archive":"Restore"}
            </button>
          </div>
        </article>)}
        {!templates.length&&<div className="admin-empty">No templates saved yet. Create one from a submitted design below.</div>}
      </div>
    </section>

    <section className="admin-card">
      <div className="admin-header admin-subheader"><div><h2>Create from submitted design</h2><p>Turn an approved or reusable customer design into a production template.</p></div></div>
      <div className="admin-table-wrap"><table className="admin-table">
        <thead><tr><th>Preview</th><th>Product</th><th>Customer</th><th>Submitted</th><th>Template name</th><th></th></tr></thead>
        <tbody>{designs.map(design=><DesignTemplateRow key={design.id} design={design} busy={busy} createTemplate={createTemplate}/>)}</tbody>
      </table>{!designs.length&&<div className="admin-empty">No submitted designs are available yet.</div>}</div>
    </section>
    {error&&<p className="wave-save-message" style={{color:"#b42318",background:"#fff1f1"}}>{error}</p>}
  </div>;
}

function DesignTemplateRow({
  design,busy,createTemplate
}:{
  design:Design;
  busy:boolean;
  createTemplate:(designId:string,name:string)=>Promise<void>;
}){
  const [name,setName]=useState("");
  return <tr>
    <td>{design.previewImage?<img className="template-thumb" src={design.previewImage} alt=""/>:"—"}</td>
    <td>{design.productName}</td>
    <td>{design.customer}</td>
    <td>{design.createdAt}</td>
    <td><input className="admin-inline-input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Bashco staff polo"/></td>
    <td><button className="button button-outline" disabled={busy||!name.trim()} onClick={()=>createTemplate(design.id,name)}>Save Template</button></td>
  </tr>;
}
