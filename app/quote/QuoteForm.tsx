"use client";
import { useState } from "react";
import { ArrowRight, CheckCircle2, UploadCloud } from "lucide-react";

export function QuoteForm(){
 const [status,setStatus]=useState<"idle"|"sending"|"done"|"error">("idle");
 const [ref,setRef]=useState("");
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault(); setStatus("sending");
  const fd=new FormData(e.currentTarget);
  const payload=Object.fromEntries(fd.entries());
  try{
   const res=await fetch("/api/quotes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const data=await res.json();
   if(!res.ok) throw new Error(data.error||"Could not submit quote.");
   setRef(data.reference); setStatus("done"); e.currentTarget.reset();
  }catch{setStatus("error")}
 }
 if(status==="done") return <div className="quote-success"><CheckCircle2/><h2>Quote request received.</h2><p>Your reference is <strong>{ref}</strong>. We have your brief and can review the production requirements from here.</p><a className="sf-primary" href="/products">Browse Products <ArrowRight/></a></div>
 return <form className="quote-form" onSubmit={submit}>
  <div className="quote-form-grid">
   <label>Full name<input name="name" required/></label>
   <label>Email<input name="email" type="email" required/></label>
   <label>Phone<input name="phone"/></label>
   <label>Company<input name="company"/></label>
   <label>Job type<select name="jobType" required defaultValue=""><option value="" disabled>Select one</option><option>Custom Signage</option><option>Vehicle Graphics</option><option>Large Format Printing</option><option>Bulk Apparel</option><option>Promotional Merchandise</option><option>Custom Fabrication</option><option>Other</option></select></label>
   <label>Quantity<input name="quantity" placeholder="e.g. 50"/></label>
   <label>Dimensions / size<input name="dimensions" placeholder="e.g. 8ft × 4ft"/></label>
   <label>Needed by<input name="dueDate" type="date"/></label>
  </div>
  <label>Tell us about the job<textarea name="details" rows={6} required placeholder="Materials, finish, installation, colours, locations, vehicle count, garment type — anything that affects production."/></label>
  <label>Artwork / file link<input name="artworkUrl" type="url" placeholder="Dropbox, Google Drive, WeTransfer or other share link"/></label>
  <label>Budget range<select name="budget" defaultValue=""><option value="">Not sure yet</option><option>Under J$25,000</option><option>J$25,000–J$75,000</option><option>J$75,000–J$200,000</option><option>J$200,000+</option></select></label>
  {status==="error"&&<div className="quote-error">We couldn't submit that request. Please check the fields and try again.</div>}
  <button className="sf-primary quote-submit" disabled={status==="sending"}>{status==="sending"?"Submitting…":"Submit Quote Request"}<ArrowRight/></button>
 </form>
}
