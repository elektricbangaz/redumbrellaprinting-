"use client";
import { useState } from "react";

export function QuoteResponse({token,status}:{token:string;status:string}){
 const [current,setCurrent]=useState(status);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function choose(decision:"ACCEPTED"|"DECLINED"){
  setBusy(true);setError("");
  try{
   const res=await fetch("/api/quotes/"+token+"/respond",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({decision})});
   const data=await res.json();if(!res.ok)throw new Error(data.error||"Could not save your response.");
   setCurrent(data.status);
  }catch(err){setError(err instanceof Error?err.message:"Could not save your response.")}
  finally{setBusy(false)}
 }
 if(["ACCEPTED","DECLINED","CONVERTED","EXPIRED"].includes(current))return <div className={"public-doc-response "+current.toLowerCase()}><strong>{current==="ACCEPTED"?"Quote accepted":current==="DECLINED"?"Quote declined":current.replaceAll("_"," ")}</strong>{current==="ACCEPTED"&&<p>Thank you. Red Umbrella can now prepare the job and invoice.</p>}</div>;
 return <div className="public-doc-actions"><button className="sf-primary" disabled={busy} onClick={()=>choose("ACCEPTED")}>Accept Quote</button><button className="sf-secondary" disabled={busy} onClick={()=>choose("DECLINED")}>Decline</button>{error&&<p className="quote-error">{error}</p>}</div>;
}
