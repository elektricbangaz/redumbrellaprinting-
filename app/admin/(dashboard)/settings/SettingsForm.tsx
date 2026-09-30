"use client";
import { useState } from "react";

type Settings={
  businessName:string;
  businessEmail:string;
  businessPhone:string;
  businessAddress:string;
  quoteValidityDays:number;
  invoiceDueDays:number;
  taxPercent:number;
  notificationEmail:string;
};

export function SettingsForm({initial}:{initial:Settings}){
  const [settings,setSettings]=useState(initial);
  const [status,setStatus]=useState<"idle"|"saving"|"saved"|"error">("idle");
  const [message,setMessage]=useState("");
  function patch<K extends keyof Settings>(key:K,value:Settings[K]){setSettings(current=>({...current,[key]:value}))}
  async function save(e:React.FormEvent){
    e.preventDefault();setStatus("saving");setMessage("");
    try{
      const res=await fetch("/api/admin/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(settings)});
      const data=await res.json();if(!res.ok)throw new Error(data.error||"Could not save settings.");
      setStatus("saved");setMessage("Settings saved.");
    }catch(error){setStatus("error");setMessage(error instanceof Error?error.message:"Could not save settings.")}
  }
  return <form className="settings-form" onSubmit={save}>
    <section className="admin-card">
      <h2>Business profile</h2>
      <div className="admin-form-row"><label>Business name<input value={settings.businessName} onChange={e=>patch("businessName",e.target.value)} required/></label><label>Business email<input type="email" value={settings.businessEmail} onChange={e=>patch("businessEmail",e.target.value)} required/></label></div>
      <div className="admin-form-row"><label>Phone<input value={settings.businessPhone} onChange={e=>patch("businessPhone",e.target.value)}/></label><label>Notification email<input type="email" value={settings.notificationEmail} onChange={e=>patch("notificationEmail",e.target.value)} required/></label></div>
      <label>Business address<textarea rows={3} value={settings.businessAddress} onChange={e=>patch("businessAddress",e.target.value)}/></label>
    </section>
    <section className="admin-card">
      <h2>Quote & invoice defaults</h2>
      <div className="admin-form-row">
        <label>Quote validity (days)<input type="number" min="1" max="365" value={settings.quoteValidityDays} onChange={e=>patch("quoteValidityDays",Number(e.target.value))}/></label>
        <label>Invoice due (days)<input type="number" min="0" max="365" value={settings.invoiceDueDays} onChange={e=>patch("invoiceDueDays",Number(e.target.value))}/></label>
      </div>
      <label>Default tax (%)<input type="number" min="0" max="100" step=".01" value={settings.taxPercent} onChange={e=>patch("taxPercent",Number(e.target.value))}/></label>
    </section>
    <div className="settings-savebar"><button className="button button-red" disabled={status==="saving"}>{status==="saving"?"Saving…":"Save Settings"}</button>{message&&<span className={status==="error"?"error":"success"}>{message}</span>}</div>
  </form>;
}
