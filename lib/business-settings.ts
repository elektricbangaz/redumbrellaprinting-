import { prisma } from "@/lib/prisma";

export type BusinessSettings={
  businessName:string;
  businessEmail:string;
  businessPhone:string;
  businessAddress:string;
  quoteValidityDays:number;
  invoiceDueDays:number;
  taxPercent:number;
  notificationEmail:string;
};

export const DEFAULT_BUSINESS_SETTINGS:BusinessSettings={
  businessName:"Red Umbrella Printing",
  businessEmail:"orders@redumbrellaprinting.com",
  businessPhone:"",
  businessAddress:"Kingston, Jamaica",
  quoteValidityDays:14,
  invoiceDueDays:14,
  taxPercent:0,
  notificationEmail:"orders@redumbrellaprinting.com",
};

export async function getBusinessSettings():Promise<BusinessSettings>{
  const row=await prisma.adminSetting.findUnique({where:{key:"business"}}).catch(()=>null);
  const value=row?.value && typeof row.value==="object" && !Array.isArray(row.value)
    ? row.value as Record<string,unknown>
    : {};
  const d=DEFAULT_BUSINESS_SETTINGS;
  return {
    businessName:typeof value.businessName==="string"?value.businessName:d.businessName,
    businessEmail:typeof value.businessEmail==="string"?value.businessEmail:d.businessEmail,
    businessPhone:typeof value.businessPhone==="string"?value.businessPhone:d.businessPhone,
    businessAddress:typeof value.businessAddress==="string"?value.businessAddress:d.businessAddress,
    quoteValidityDays:typeof value.quoteValidityDays==="number"?value.quoteValidityDays:d.quoteValidityDays,
    invoiceDueDays:typeof value.invoiceDueDays==="number"?value.invoiceDueDays:d.invoiceDueDays,
    taxPercent:typeof value.taxPercent==="number"?value.taxPercent:d.taxPercent,
    notificationEmail:typeof value.notificationEmail==="string"?value.notificationEmail:d.notificationEmail,
  };
}
