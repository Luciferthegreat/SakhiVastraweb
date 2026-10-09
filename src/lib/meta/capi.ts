import { prisma } from "@/lib/db";
import { getMetaConfig } from "./config";
import { sha256, normalizePhone } from "./crypto";
import { CapiEventPayload } from "./types";

const GRAPH_API_VERSION = "v21.0";

export async function sendCapiEvent(payload: CapiEventPayload, testEventCode?: string): Promise<{
  success: boolean;
  eventId: string;
  response?: any;
  error?: string;
}> {
  const config = await getMetaConfig();
  const pixelId = config.pixelId;
  const token = config.capiToken || config.accessToken;

  // 1. Save or update event record in database
  const eventTime = payload.eventTime ? new Date(payload.eventTime * 1000) : new Date();

  let eventRecord = await prisma.metaConversionEvent.findUnique({
    where: { eventId: payload.eventId },
  });

  if (!eventRecord) {
    eventRecord = await prisma.metaConversionEvent.create({
      data: {
        eventId: payload.eventId,
        eventName: payload.eventName,
        eventTime,
        sourceUrl: payload.eventSourceUrl,
        orderId: payload.customData?.orderId,
        userEmail: payload.userData?.email,
        userPhone: payload.userData?.phone,
        value: payload.customData?.value,
        currency: payload.customData?.currency || "INR",
        serverSent: false,
      },
    });
  }

  // 2. If credentials are not yet configured or mode is monitor, record status and exit safely
  if (!pixelId || !token) {
    await prisma.metaConversionEvent.update({
      where: { eventId: payload.eventId },
      data: {
        serverSent: false,
        serverStatus: "SKIPPED",
        serverError: "Meta Pixel ID or CAPI Access Token not configured yet.",
      },
    });
    return {
      success: false,
      eventId: payload.eventId,
      error: "CAPI not configured: Missing Pixel ID or Token.",
    };
  }

  // 3. Format user data with proper hashing
  const userData: Record<string, any> = {};
  if (payload.userData?.email) {
    const hashedEmail = sha256(payload.userData.email);
    if (hashedEmail) userData.em = [hashedEmail];
  }
  if (payload.userData?.phone) {
    const hashedPhone = normalizePhone(payload.userData.phone);
    if (hashedPhone) userData.ph = [hashedPhone];
  }
  if (payload.userData?.clientIpAddress) {
    userData.client_ip_address = payload.userData.clientIpAddress;
  }
  if (payload.userData?.clientUserAgent) {
    userData.client_user_agent = payload.userData.clientUserAgent;
  }
  if (payload.userData?.fbp) {
    userData.fbp = payload.userData.fbp;
  }
  if (payload.userData?.fbc) {
    userData.fbc = payload.userData.fbc;
  }

  // 4. Format custom data
  const customData: Record<string, any> = {
    currency: payload.customData?.currency || "INR",
  };
  if (payload.customData?.value !== undefined) {
    customData.value = payload.customData.value / 100; // Convert paise to rupees
  }
  if (payload.customData?.contentName) {
    customData.content_name = payload.customData.contentName;
  }
  if (payload.customData?.contentCategory) {
    customData.content_category = payload.customData.contentCategory;
  }
  if (payload.customData?.contentIds) {
    customData.content_ids = payload.customData.contentIds;
  }
  if (payload.customData?.contentType) {
    customData.content_type = payload.customData.contentType;
  }
  if (payload.customData?.contents) {
    customData.contents = payload.customData.contents.map((c) => ({
      id: c.id,
      quantity: c.quantity,
      item_price: c.item_price ? c.item_price / 100 : undefined,
    }));
  }
  if (payload.customData?.numItems) {
    customData.num_items = payload.customData.numItems;
  }
  if (payload.customData?.orderId) {
    customData.order_id = payload.customData.orderId;
  }

  const eventBody: Record<string, any> = {
    data: [
      {
        event_name: payload.eventName,
        event_time: Math.floor(eventTime.getTime() / 1000),
        event_id: payload.eventId,
        event_source_url: payload.eventSourceUrl || "https://www.sakhivastra.in",
        action_source: "website",
        user_data: userData,
        custom_data: customData,
      },
    ],
  };

  if (testEventCode) {
    eventBody.test_event_code = testEventCode;
  }

  const endpoint = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${token}`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventBody),
    });

    const json = await res.json();

    if (!res.ok || json.error) {
      const errMsg = json.error?.message || `HTTP ${res.status}: ${JSON.stringify(json)}`;
      await prisma.metaConversionEvent.update({
        where: { eventId: payload.eventId },
        data: {
          serverSent: false,
          serverStatus: "FAILED",
          serverError: errMsg,
        },
      });
      return {
        success: false,
        eventId: payload.eventId,
        error: errMsg,
        response: json,
      };
    }

    await prisma.metaConversionEvent.update({
      where: { eventId: payload.eventId },
      data: {
        serverSent: true,
        serverStatus: "SENT",
        serverError: null,
      },
    });

    return {
      success: true,
      eventId: payload.eventId,
      response: json,
    };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    await prisma.metaConversionEvent.update({
      where: { eventId: payload.eventId },
      data: {
        serverSent: false,
        serverStatus: "FAILED",
        serverError: errMsg,
      },
    });
    return {
      success: false,
      eventId: payload.eventId,
      error: errMsg,
    };
  }
}
