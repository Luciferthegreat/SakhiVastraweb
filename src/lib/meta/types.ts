export type AutomationMode = "monitor" | "simulation" | "live";

export interface MetaConfigSettings {
  id?: string;
  adAccountId?: string | null;
  pixelId?: string | null;
  accessToken?: string | null;
  capiToken?: string | null;
  appId?: string | null;
  appSecret?: string | null;
  automationMode: AutomationMode;
  automationEnabled: boolean;
  dailySpendCap: number; // in paise (e.g. 500000 = ₹5,000)
  maxBudgetIncreasePct: number; // default 10.0
  budgetIncreaseCooldownHours: number; // default 24
  minDataPurchases: number; // default 3
  minDataSpendPaise: number; // default 100000 (₹1,000)
  maxLossPerAdPaise: number; // default 80000 (₹800)
  targetRoas: number; // default 2.5
  emergencyStop: boolean;
  autoSyncSchedule?: string;
}

export type CreativeAngleType =
  | "PRODUCT_SHOWCASE"
  | "BENEFIT_FOCUS"
  | "STYLING_OUTFIT"
  | "PRICE_OFFER"
  | "REEL_CONCEPT"
  | "CAROUSEL";

export interface GeneratedCreative {
  angle: CreativeAngleType;
  title: string;
  headline: string;
  primaryText: string;
  description: string;
  callToAction: string;
  imageUrl: string;
  destinationUrl: string;
  hookConcept?: string;
  carouselItems?: Array<{
    name: string;
    imageUrl: string;
    price: number;
    url: string;
  }>;
}

export interface MetaInsightSummary {
  spendPaise: number;
  purchases: number;
  revenuePaise: number;
  roas: number;
  cpaPaise: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpcPaise: number;
  estimatedProfitPaise: number;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  triggered: boolean;
  entityType: "CAMPAIGN" | "ADSET" | "AD" | "SYSTEM";
  entityId: string;
  entityName: string;
  action: "PAUSE" | "SCALE_BUDGET" | "ALERT" | "NONE";
  previousValue?: string;
  newValue?: string;
  reason: string;
  safetyPassed: boolean;
  safetyReason?: string;
  executed: boolean;
  mode: AutomationMode;
}

export interface CapiEventPayload {
  eventName: "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase";
  eventId: string;
  eventTime?: number; // unix timestamp
  eventSourceUrl?: string;
  userData?: {
    email?: string;
    phone?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbp?: string;
    fbc?: string;
  };
  customData?: {
    currency?: string;
    value?: number;
    contentName?: string;
    contentCategory?: string;
    contentIds?: string[];
    contentType?: string;
    contents?: Array<{
      id: string;
      quantity: number;
      item_price?: number;
    }>;
    numItems?: number;
    orderId?: string;
  };
}
