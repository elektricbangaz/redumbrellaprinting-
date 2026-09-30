import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { QuoteForm } from "./QuoteForm";
import { CORE_CATALOG } from "@/lib/catalog";

export default async function QuotePage({searchParams}:{searchParams:Promise<{product?:string}>}) {
  const sp=await searchParams;
  const product=CORE_CATALOG.find((item)=>item.slug===sp.product);
  const jobType=product?.name || "";
  return <main className="sf">
    <SiteHeader/>
    <section className="content-hero">
      <span>CUSTOM QUOTE</span>
      <h1>{product ? `Quote ${product.name}.` : "Complex job? Give us the production brief."}</h1>
      <p>{product ? "Tell us the quantity, dimensions, artwork and timing. Production will review the job and issue a formal quote." : "Use this for signage, vehicle graphics, bulk work, fabrication and anything that needs dimensions, materials or production review before pricing."}</p>
    </section>
    <section className="quote-page-wrap">
      <aside><b>WHAT HAPPENS NEXT</b><h2>We review the job, not just the form.</h2><p>Your request gives the production team enough information to scope materials, finishing, labour and timing before a price is issued.</p><ol><li>Brief received</li><li>Production review</li><li>Quote issued</li><li>Approve & pay</li><li>Job enters production</li></ol></aside>
      <QuoteForm initialJobType={jobType}/>
    </section>
    <SiteFooter/>
  </main>;
}
