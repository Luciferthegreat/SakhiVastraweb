import axios, { AxiosRequestConfig } from "axios";

const SHIPROCKET_BASE =
  "https://apiv2.shiprocket.in/v1/external";

let cachedToken: {
  token: string;
  expiresAt: number;
} | null = null;

/* =========================================================
   TYPES
========================================================= */

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number; // INR, NOT paise
}

export interface CreateShiprocketOrderInput {
  orderId: string;
  orderDate: string;

  billingCustomerName: string;
  billingLastName?: string;

  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingPincode: string;

  billingPhone: string;
  billingEmail: string;

  items: ShiprocketOrderItem[];

  subTotal: number; // INR

  weightKg?: number;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
}

export interface ShiprocketPickupLocation {
  id?: number | string;
  pickup_location: string;
  address?: string;
  address_2?: string;
  city?: string;
  state?: string;
  pin_code?: string | number;
  phone?: string;
  email?: string;
  name?: string;
}

/* =========================================================
   AUTH
========================================================= */

async function getShiprocketToken(): Promise<string> {
  /*
   * Token is valid for approximately 10 days.
   * We refresh it slightly early.
   */

  if (
    cachedToken &&
    cachedToken.expiresAt > Date.now()
  ) {
    return cachedToken.token;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD is missing in .env"
    );
  }

  console.log("======================================");
  console.log("SHIPROCKET LOGIN");
  console.log("======================================");

  const response = await axios.post(
    `${SHIPROCKET_BASE}/auth/login`,
    {
      email,
      password,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.data?.token) {
    throw new Error(
      "Shiprocket login succeeded but no token was returned."
    );
  }

  cachedToken = {
    token: response.data.token,

    // Refresh after 9 days
    expiresAt:
      Date.now() +
      9 * 24 * 60 * 60 * 1000,
  };

  console.log("Shiprocket login successful.");

  return cachedToken.token;
}

/* =========================================================
   GENERIC REQUEST
========================================================= */

async function shiprocketRequest<T = any>(
  method: "get" | "post" | "patch",
  path: string,
  payload?: Record<string, unknown>
): Promise<T> {
  const token = await getShiprocketToken();

  const config: AxiosRequestConfig = {
    method,
    url: `${SHIPROCKET_BASE}${path}`,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  if (method === "get") {
    config.params = payload;
  } else {
    config.data = payload;
  }

  try {
    const response = await axios(config);

    return response.data;
  } catch (error: any) {
    console.error(
      "======================================"
    );
    console.error(
      "SHIPROCKET API ERROR"
    );
    console.error(
      "======================================"
    );

    console.error(
      "Status:",
      error?.response?.status
    );

    console.error(
      "Response:",
      JSON.stringify(
        error?.response?.data,
        null,
        2
      )
    );

    console.error(
      "Message:",
      error?.message
    );

    throw error;
  }
}

/* =========================================================
   PICKUP LOCATIONS
========================================================= */

/**
 * Fetch all pickup locations configured
 * in the Shiprocket account.
 *
 * Useful for finding the EXACT pickup_location
 * name Shiprocket expects.
 */
export async function getShiprocketPickupLocations() {
  const response =
    await shiprocketRequest(
      "get",
      "/settings/company/pickup"
    );

  console.log(
    "======================================"
  );

  console.log(
    "SHIPROCKET PICKUP LOCATIONS"
  );

  console.log(
    "======================================"
  );

  console.log(
    JSON.stringify(
      response,
      null,
      2
    )
  );

  return response;
}

/**
 * Get the pickup location configured
 * in .env and verify that it exists.
 */
export async function getConfiguredPickupLocation() {
  const configuredName =
    process.env
      .SHIPROCKET_PICKUP_LOCATION_NAME
      ?.trim();

  if (!configuredName) {
    throw new Error(
      "SHIPROCKET_PICKUP_LOCATION_NAME is missing in .env"
    );
  }

  const response =
    await getShiprocketPickupLocations();

  /*
   * Shiprocket can return the pickup locations
   * in different response structures.
   */

  const locations =
    response?.data?.shipping_address ||
    response?.data ||
    response?.shipping_address ||
    [];

  if (!Array.isArray(locations)) {
    console.error(
      "Unexpected pickup location response:",
      response
    );

    throw new Error(
      "Could not read Shiprocket pickup locations."
    );
  }

  const location =
    locations.find(
      (item: any) =>
        String(
          item.pickup_location ||
          item.pickup_location_name ||
          item.name ||
          ""
        )
          .trim()
          .toLowerCase() ===
        configuredName.toLowerCase()
    );

  if (!location) {
    const availableNames =
      locations
        .map(
          (item: any) =>
            item.pickup_location ||
            item.pickup_location_name ||
            item.name
        )
        .filter(Boolean);

    throw new Error(
      `Invalid Shiprocket pickup location "${configuredName}". ` +
        `Available locations: ${
          availableNames.length
            ? availableNames.join(", ")
            : "None found"
        }`
    );
  }

  return location;
}

/* =========================================================
   CREATE SHIPROCKET ORDER
========================================================= */

/**
 * Creates an order in Shiprocket.
 *
 * IMPORTANT:
 * This should be called only AFTER
 * Razorpay payment is successfully verified.
 */
export async function createShiprocketOrder(
  input: CreateShiprocketOrderInput
) {
  /*
   * Validate pickup location first.
   *
   * This prevents the generic:
   * "Wrong Pickup location entered"
   * error from Shiprocket.
   */

  const pickupLocation =
    await getConfiguredPickupLocation();

  const pickupLocationName =
    pickupLocation.pickup_location ||
    pickupLocation.pickup_location_name ||
    pickupLocation.name;

  if (!pickupLocationName) {
    throw new Error(
      "Shiprocket pickup location name could not be determined."
    );
  }

  const payload = {
    order_id: input.orderId,

    order_date: input.orderDate,

    /*
     * IMPORTANT:
     * Must exactly match an existing
     * Shiprocket pickup location.
     */
    pickup_location:
      pickupLocationName,

    billing_customer_name:
      input.billingCustomerName,

    billing_last_name:
      input.billingLastName || "",

    billing_address:
      input.billingAddress,

    billing_city:
      input.billingCity,

    billing_pincode:
      input.billingPincode,

    billing_state:
      input.billingState,

    billing_country:
      "India",

    billing_email:
      input.billingEmail,

    billing_phone:
      input.billingPhone,

    shipping_is_billing:
      true,

    order_items:
      input.items,

    /*
     * Razorpay payment already succeeded,
     * therefore Shiprocket order is prepaid.
     */
    payment_method:
      "Prepaid",

    sub_total:
      input.subTotal,

    /*
     * Default packaging dimensions.
     * Change these according to actual package.
     */
    length:
      input.lengthCm ?? 25,

    breadth:
      input.breadthCm ?? 20,

    height:
      input.heightCm ?? 3,

    weight:
      input.weightKg ?? 0.35,
  };

  console.log(
    "======================================"
  );

  console.log(
    "SHIPROCKET CREATE ORDER REQUEST"
  );

  console.log(
    "======================================"
  );

  console.log(
    JSON.stringify(
      payload,
      null,
      2
    )
  );

  const response =
    await shiprocketRequest(
      "post",
      "/orders/create/adhoc",
      payload
    );

  console.log(
    "======================================"
  );

  console.log(
    "SHIPROCKET CREATE ORDER RESPONSE"
  );

  console.log(
    "======================================"
  );

  console.log(
    JSON.stringify(
      response,
      null,
      2
    )
  );

  return response;
}

/* =========================================================
   SERVICEABILITY
========================================================= */

/**
 * Check available couriers and shipping rates
 * between pickup and delivery pincodes.
 */
export async function checkShiprocketServiceability(
  params: {
    pickupPincode: string;
    deliveryPincode: string;
    weightKg: number;
    codAvailable?: boolean;
  }
) {
  const query =
    new URLSearchParams({
      pickup_postcode:
        params.pickupPincode,

      delivery_postcode:
        params.deliveryPincode,

      weight:
        String(params.weightKg),

      cod:
        params.codAvailable
          ? "1"
          : "0",
    });

  return shiprocketRequest(
    "get",
    `/courier/serviceability/?${query.toString()}`
  );
}

/* =========================================================
   TRACKING
========================================================= */

/**
 * Track shipment using AWB number.
 */
export async function trackShiprocketShipment(
  awbCode: string
) {
  if (!awbCode?.trim()) {
    throw new Error(
      "AWB code is required."
    );
  }

  return shiprocketRequest(
    "get",
    `/courier/track/awb/${encodeURIComponent(
      awbCode.trim()
    )}`
  );
}

/* =========================================================
   ORDER DETAILS
========================================================= */

/**
 * Get complete Shiprocket order details.
 */
export async function getShiprocketOrder(
  shiprocketOrderId: string | number
) {
  return shiprocketRequest(
    "get",
    `/orders/show/${shiprocketOrderId}`
  );
}

/* =========================================================
   ASSIGN AWB
========================================================= */

/**
 * Assign a courier/AWB to a shipment.
 *
 * IMPORTANT:
 * shipmentId should be Shiprocket's shipment_id,
 * NOT your internal order ID.
 */
export async function assignShiprocketAWB(
  shipmentId: string | number
) {
  return shiprocketRequest(
    "post",
    "/courier/assign/awb",
    {
      shipment_id: shipmentId,
    }
  );
}

/* =========================================================
   REQUEST PICKUP
========================================================= */

/**
 * Request pickup after AWB has been generated.
 */
export async function requestShiprocketPickup(
  shipmentId: string | number
) {
  return shiprocketRequest(
    "post",
    "/courier/generate/pickup",
    {
      shipment_id: [
        Number(shipmentId),
      ],
    }
  );
}

/* =========================================================
   GENERATE LABEL
========================================================= */

/**
 * Generate shipping label.
 */
export async function generateShiprocketLabel(
  shipmentId: string | number
) {
  return shiprocketRequest(
    "post",
    "/courier/generate/label",
    {
      shipment_id: [
        Number(shipmentId),
      ],
    }
  );
}

/* =========================================================
   GENERATE MANIFEST
========================================================= */

/**
 * Generate manifest after pickup request.
 */
export async function generateShiprocketManifest(
  shipmentId: string | number
) {
  return shiprocketRequest(
    "post",
    "/manifests/generate",
    {
      shipment_id: [
        Number(shipmentId),
      ],
    }
  );
}