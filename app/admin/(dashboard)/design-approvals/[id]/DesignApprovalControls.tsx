"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DesignApprovalControls({id,status,note}:{id:string;status:string;note:string|null}){
  const router=useRouter();
  const [current,setCurrent]=useState(status);
  const [approvalNote,setApprovalNote]=useState(note||"");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  async function update(next:"APPROVED"|"CHANGES_REQUESTED"|"REJECTED"){
    setBusy(true);setMessage("");
    try{
      const res=await fetch("/api/admin/designs/"+id+"/approval",{
        method:"PATCH",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({status:next,note:approvalNote}),
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"Could not update design.");
      setCurrent(next);setMessage("Design review updated.");router.refresh();
    }catch(error){setMessage(error instanceof Error?error.message:"Could not update design.")}
    finally{setBusy(false)}
  }

  return <div className="design-approval-controls">
    <div><small>Current status</small><strong className={"ru-status-pill s-"+current.toLowerCase()}>{current.replaceAll("_"," ")}</strong></div>
    <label>Review note<textarea rows={5} value={approvalNote} onChange={e=>setApprovalNote(e.target.value)} placeholder="Production comments, changes required, colour or placement notes."/></label>
    <div className="design-approval-actions">
      <button disabled={busy} onClick={()=>update("APPROVED")} className="button button-red">Approve</button>
      <button disabled={busy} onClick={()=>update("CHANGES_REQUESTED")} className="button button-outline">Request Changes</button>
      <button disabled={busy} onClick={()=>update("REJECTED")} className="button button-outline">Reject</button>
    </div>
    {message&&<p className="wave-save-message">{message}</p>}
  </div>;
}
