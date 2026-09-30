"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function StaffRateEditor({id,jobTitle,hourlyRate}:{id:string;jobTitle:string|null;hourlyRate:number}){
 const router=useRouter(); const [open,setOpen]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");const f=new FormData(e.currentTarget);const res=await fetch("/api/admin/staff/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({jobTitle:f.get("jobTitle"),hourlyRateJmd:Number(f.get("hourlyRateJmd"))})});const body=await res.json();setBusy(false);if(!res.ok){setError(body.error||"Could not save.");return;}setOpen(false);router.refresh();}
 if(!open)return <button className="ru-rate-edit" onClick={()=>setOpen(true)}>Edit rate</button>;
 return <form className="ru-rate-form" onSubmit={submit}><input name="jobTitle" defaultValue={jobTitle||""} placeholder="Role / title"/><input name="hourlyRateJmd" type="number" min="0" step="1" defaultValue={(hourlyRate/100).toFixed(0)} placeholder="JMD / hr"/><button disabled={busy}>{busy?"Saving…":"Save"}</button><button type="button" onClick={()=>setOpen(false)}>Cancel</button>{error&&<small>{error}</small>}</form>;
}
