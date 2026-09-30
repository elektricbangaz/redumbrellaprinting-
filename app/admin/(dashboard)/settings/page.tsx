import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";

export const dynamic="force-dynamic";

type BusinessSettings={
  businessName:string;
  businessEmail:string;
  businessPhone:string;
  businessAddress:string;
  quoteValidityDays:number;
  invoiceDueDays:number;
  taxPercent:number;
  notificationEmail:string;
};

const defaults:BusinessSettings={
  businessName:"Red Umbrella Printing",
  businessEmail:"orders@redumbrellaprinting.com",
  businessPhone:"",
  businessAddress:"Kingston, Jamaica",
  quoteValidityDays:14,
  invoiceDueDays:14,
  taxPercent:0,
  notificationEmail:"orders@redumbrellaprinting.com",
};

export default async function AdminSettingsPage(){
  const [session,stored]=await Promise.all([
    auth(),
    prisma.adminSetting.findUnique({where:{key:"business"}}).catch(()=>null),
  ]);

  const value=stored?.value && typeof stored.value==="object" && !Array.isArray(stored.value)
    ? stored.value as Record<string,unknown>
    : {};
  const initial:BusinessSettings={
    businessName:typeof value.businessName==="string"?value.businessName:defaults.businessName,
    businessEmail:typeof value.businessEmail==="string"?value.businessEmail:defaults.businessEmail,
    businessPhone:typeof value.businessPhone==="string"?value.businessPhone:defaults.businessPhone,
    businessAddress:typeof value.businessAddress==="string"?value.businessAddress:defaults.businessAddress,
    quoteValidityDays:typeof value.quoteValidityDays==="number"?value.quoteValidityDays:defaults.quoteValidityDays,
    invoiceDueDays:typeof value.invoiceDueDays==="number"?value.invoiceDueDays:defaults.invoiceDueDays,
    taxPercent:typeof value.taxPercent==="number"?value.taxPercent:defaults.taxPercent,
    notificationEmail:typeof value.notificationEmail==="string"?value.notificationEmail:defaults.notificationEmail,
  };

  const checks=[
    ["Production database",Boolean(process.env.DATABASE_URL)],
    ["Outbound email",Boolean(process.env.RESEND_API_KEY)],
    ["WiPay",Boolean(process.env.WIPAY_ACCOUNT_NUMBER&&process.env.WIPAY_API_KEY)],
    ["Fygaro",Boolean(process.env.FYGARO_MERCHANT_ID&&process.env.FYGARO_API_KEY)],
    ["Admin origin",Boolean(process.env.ADMIN_APP_URL||process.env.AUTH_URL||process.env.NEXTAUTH_URL)],
  ] as const;

  return <div className="ru-page">
    <div className="admin-header"><div><h1>Settings</h1><p>Business defaults and service configuration.</p></div></div>
    <div className="admin-grid-2">
      <section className="admin-card"><h2>Signed-in account</h2><p><strong>{session?.user?.name??"Admin"}</strong></p><p>{session?.user?.email??"—"}</p><p>Role: {(session?.user as {role?:string}|undefined)?.role??"Staff"}</p></section>
      <section className="admin-card"><h2>Connected services</h2><div className="admin-settings-list">{checks.map(([label,ready])=><div key={label}><span>{label}</span><strong className={ready?"ready":"not-ready"}>{ready?"Configured":"Needs configuration"}</strong></div>)}</div><small>Secret values are never displayed here.</small></section>
    </div>
    <SettingsForm initial={initial}/>
  </div>;
}
