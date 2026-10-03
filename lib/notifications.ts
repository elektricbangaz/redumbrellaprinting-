import { prisma } from "@/lib/prisma";
import { FROM_EMAIL, getResendClient } from "@/lib/resend";

type BaseNotification = {
  event: string;
  entityType?: string;
  entityId?: string;
  message: string;
};

type EmailNotification = BaseNotification & {
  to: string;
  subject: string;
  html?: string;
};

type WhatsAppNotification = BaseNotification & {
  to: string;
  templateName?: string;
  templateParams?: string[];
};

async function createLog(input: {
  channel: "EMAIL" | "WHATSAPP";
  event: string;
  recipient: string;
  subject?: string;
  message: string;
  entityType?: string;
  entityId?: string;
}) {
  return prisma.notification.create({
    data: {
      channel: input.channel,
      event: input.event,
      recipient: input.recipient,
      subject: input.subject,
      message: input.message,
      entityType: input.entityType,
      entityId: input.entityId,
    },
  });
}

export async function sendEmailNotification(input: EmailNotification) {
  const log = await createLog({
    channel: "EMAIL", event: input.event, recipient: input.to, subject: input.subject, message: input.message,
    entityType: input.entityType, entityId: input.entityId,
  });
  const resend = getResendClient();
  if (!resend) {
    return prisma.notification.update({
      where: { id: log.id },
      data: { status: "SKIPPED", error: "RESEND_API_KEY is not configured." },
    });
  }
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: input.to,
      subject: input.subject,
      text: input.message,
      html: input.html ?? `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937"><p>${input.message.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\n", "<br/>")}</p></div>`,
    });
    if (result.error) throw new Error(result.error.message);
    return prisma.notification.update({
      where: { id: log.id },
      data: { status: "SENT", externalId: result.data?.id, sentAt: new Date() },
    });
  } catch (error) {
    return prisma.notification.update({
      where: { id: log.id },
      data: { status: "FAILED", error: error instanceof Error ? error.message : "Email delivery failed." },
    });
  }
}

function normalizeWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10 && digits.startsWith("876")) return `1${digits}`;
  if (digits.length === 7) return `1876${digits}`;
  return digits;
}

export async function sendWhatsAppNotification(input: WhatsAppNotification) {
  const recipient = normalizeWhatsAppNumber(input.to);
  const log = await createLog({ channel: "WHATSAPP", ...input, recipient });
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_API_VERSION;
  if (!recipient || !token || !phoneNumberId || !version) {
    return prisma.notification.update({
      where: { id: log.id },
      data: { status: "SKIPPED", error: "WhatsApp Cloud API is not fully configured." },
    });
  }

  const payload = input.templateName
    ? {
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
          name: input.templateName,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US" },
          ...(input.templateParams?.length
            ? { components: [{ type: "body", parameters: input.templateParams.map((text) => ({ type: "text", text })) }] }
            : {}),
        },
      }
    : { messaging_product: "whatsapp", to: recipient, type: "text", text: { body: input.message } };

  try {
    const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({})) as { messages?: Array<{ id?: string }>; error?: { message?: string } };
    if (!response.ok) throw new Error(data.error?.message || `WhatsApp returned ${response.status}.`);
    return prisma.notification.update({
      where: { id: log.id },
      data: { status: "SENT", externalId: data.messages?.[0]?.id, sentAt: new Date() },
    });
  } catch (error) {
    return prisma.notification.update({
      where: { id: log.id },
      data: { status: "FAILED", error: error instanceof Error ? error.message : "WhatsApp delivery failed." },
    });
  }
}

export async function sendCustomerEvent(input: BaseNotification & {
  email?: string | null;
  phone?: string | null;
  emailSubject: string;
  whatsappTemplate?: string;
  whatsappParams?: string[];
}) {
  const tasks: Promise<unknown>[] = [];
  if (input.email) tasks.push(sendEmailNotification({
    event: input.event,
    entityType: input.entityType,
    entityId: input.entityId,
    message: input.message,
    to: input.email,
    subject: input.emailSubject,
  }));
  if (input.phone) tasks.push(sendWhatsAppNotification({
    event: input.event,
    entityType: input.entityType,
    entityId: input.entityId,
    message: input.message,
    to: input.phone,
    templateName: input.whatsappTemplate,
    templateParams: input.whatsappParams,
  }));
  return Promise.allSettled(tasks);
}
