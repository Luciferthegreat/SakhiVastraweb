import { parseCsv } from "./csv-parse";

// Column indices matching your Google Sheet.
const COL = {
  PRODUCT_NAME: 0, // A
  IMAGEKIT_LINK: 1, // B
  MEESHO_LINK: 2, // C
  RAW_IMAGE: 3, // D
  GPT_IMAGE: 4, // E
  SKU: 5, // F
  WEIGHT_GM: 6, // G
  CHEST: 7, // H
  SHOULDER: 8, // I
  WAIST: 9, // J
  LENGTH: 10, // K
  HIP: 11, // L
  SIZE_LABEL: 12, // M
  QTY: 13, // N
  WEBSITE_PRICE: 14, // O
  ORIGINAL_PRICE: 15, // P
  RATE: 16, // Q
  AMOUNT: 17, // R
  MEESHO_AMOUNT: 18, // S
  EXPECTED_INCOME: 19, // T
  REMARKS: 20, // U
  WEBSITE_LIVE: 21, // V
  STATUS: 22, // W
  TOTAL_QUANTITY: 23, // X
};

export interface SheetVariant {
  size: string;
  sku: string;
  stock: number;
  color?: string;
  chest?: string;
  shoulder?: string;
  waist?: string;
  length?: string;
  hip?: string;
}

export interface SheetProduct {
  name: string;
  baseSku: string;
  meeshoLink?: string;

  // All images belonging to this product.
  imageUrls: string[];

  // First image for backward compatibility.
  imageUrl?: string;

  weightGm?: number;
  websiteLive: boolean;
  websitePriceRupees?: number;
  originalPriceRupees?: number;
  variants: SheetVariant[];
}

function cell(row: string[], idx: number): string {
  return (row[idx] ?? "").trim();
}

/**
 * Check whether a value looks like an ImageKit folder URL.
 *
 * Example:
 * https://ik.imagekit.io/sakhivastra/Product/DKNJ-0000046
 */
function isImageKitFolderUrl(value: string): boolean {
  return (
    value.includes("ik.imagekit.io/") &&
    !/\.(jpg|jpeg|png|webp|gif|avif|svg)(\?.*)?$/i.test(value)
  );
}

/**
 * Convert an ImageKit folder URL into an ImageKit folder path.
 *
 * Example:
 *
 * https://ik.imagekit.io/sakhivastra/Product/DKNJ-0000046
 *
 * becomes:
 *
 * /Product/DKNJ-0000046/
 */
function imageKitFolderPath(folderUrl: string): string {
  const url = new URL(folderUrl);

  let path = decodeURIComponent(url.pathname);

  // Remove leading slash.
  path = path.replace(/^\/+/, "");

  // Remove ImageKit ID if it appears in the URL path.
  //
  // https://ik.imagekit.io/sakhivastra/Product/DKNJ-0000046
  //
  // pathname = /sakhivastra/Product/DKNJ-0000046
  //
  const parts = path.split("/").filter(Boolean);

  if (parts.length > 0) {
    parts.shift();
  }

  const folderPath = "/" + parts.join("/");

  return folderPath.endsWith("/")
    ? folderPath
    : folderPath + "/";
}

/**
 * Fetch all images from an ImageKit folder.
 *
 * Files are sorted naturally:
 *
 * 1
 * 2
 * 3
 * 4
 *
 * and also:
 *
 * 1.png
 * 2.png
 * 3.png
 * 4.png
 */
async function fetchImageKitFolderImages(
  folderUrl: string
): Promise<string[]> {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error(
      "IMAGEKIT_PRIVATE_KEY is missing in .env. Add your ImageKit private API key."
    );
  }

  let folderPath: string;

  try {
    folderPath = imageKitFolderPath(folderUrl);
  } catch {
    console.warn(
      `⚠️ Invalid ImageKit folder URL: ${folderUrl}`
    );

    return [];
  }

  const apiUrl = new URL(
    "https://api.imagekit.io/v1/files"
  );

  apiUrl.searchParams.set("path", folderPath);
  apiUrl.searchParams.set("type", "file");
  apiUrl.searchParams.set("fileType", "image");
  apiUrl.searchParams.set("limit", "1000");
  apiUrl.searchParams.set("sort", "ASC_NAME");

  console.log(
    `   📁 Reading ImageKit folder: ${folderPath}`
  );

  const auth = Buffer.from(`${privateKey}:`).toString("base64");

  const response = await fetch(apiUrl.toString(), {
    method: "GET",

    headers: {
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `ImageKit API failed (${response.status}): ${errorText}`
    );
  }

  const files = (await response.json()) as Array<{
    name?: string;
    url?: string;
    filePath?: string;
    fileType?: string;
  }>;

  const imageFiles = files
    .filter(
      (file) =>
        file.fileType === "image" &&
        typeof file.url === "string" &&
        file.url.length > 0
    )
    .sort((a, b) =>
      naturalImageSort(
        a.name ?? "",
        b.name ?? ""
      )
    );

  const imageUrls = imageFiles.map(
    (file) => file.url!
  );

  console.log(
    `   🖼️ Found ${imageUrls.length} image(s)`
  );

  if (imageUrls.length > 0) {
    console.log(
      `   ${imageUrls
        .map((url, index) => `${index + 1}. ${url}`)
        .join("\n   ")}`
    );
  } else {
    console.warn(
      `   ⚠️ No images found in ${folderPath}`
    );
  }

  return imageUrls;
}

/**
 * Natural sorting.
 *
 * This makes:
 *
 * 1
 * 2
 * 3
 * 4
 *
 * come before:
 *
 * 10
 * 11
 */
function naturalImageSort(
  a: string,
  b: string
): number {
  const aName = a.toLowerCase();
  const bName = b.toLowerCase();

  const aNumbers = aName.match(/\d+/g);
  const bNumbers = bName.match(/\d+/g);

  if (aNumbers && bNumbers) {
    const max = Math.max(
      aNumbers.length,
      bNumbers.length
    );

    for (let i = 0; i < max; i++) {
      const aNumber = Number(aNumbers[i] ?? 0);
      const bNumber = Number(bNumbers[i] ?? 0);

      if (aNumber !== bNumber) {
        return aNumber - bNumber;
      }
    }
  }

  return aName.localeCompare(
    bName,
    undefined,
    {
      numeric: true,
      sensitivity: "base",
    }
  );
}

/**
 * Parse ImageKit values from a Google Sheet cell.
 *
 * Supported:
 *
 * 1. Folder URL:
 *
 * https://ik.imagekit.io/sakhivastra/Product/DKNJ-0000046
 *
 * The script automatically finds:
 *
 * 1.png
 * 2.png
 * 3.png
 * 4.png
 *
 * 2. Multiple direct image URLs:
 *
 * https://.../1.png
 * https://.../2.png
 *
 * 3. Comma-separated URLs.
 *
 * 4. Semicolon-separated URLs.
 */
async function parseImageUrls(
  value: string
): Promise<string[]> {
  if (!value) {
    return [];
  }

  const trimmedValue = value.trim();

  // ---------------------------------------------------------
  // IMAGEKIT FOLDER
  // ---------------------------------------------------------

  if (isImageKitFolderUrl(trimmedValue)) {
    try {
      return await fetchImageKitFolderImages(
        trimmedValue
      );
    } catch (error) {
      console.error(
        `❌ Could not read ImageKit folder: ${trimmedValue}`
      );

      console.error(error);

      return [];
    }
  }

  // ---------------------------------------------------------
  // DIRECT IMAGE URLS
  // ---------------------------------------------------------

  return trimmedValue
    .split(/[\n,;]+/)
    .map((url) => url.trim())
    .filter(
      (url) =>
        url.startsWith("http") &&
        /\.(jpg|jpeg|png|webp|gif|avif|svg)(\?.*)?$/i.test(
          url
        )
    );
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Groups Google Sheet rows into products.
 */
export async function parseSheetProducts(
  csvText: string
): Promise<SheetProduct[]> {
  const rows = parseCsv(csvText);

  // Skip the 3 header rows.
  const dataRows = rows
    .slice(3)
    .filter((r) =>
      r.some((c) => c.trim() !== "")
    );

  const products: SheetProduct[] = [];

  let current: SheetProduct | null = null;

  for (const row of dataRows) {
    const sku = cell(row, COL.SKU);
    const name = cell(row, COL.PRODUCT_NAME);

    // ---------------------------------------------------------
    // NEW PRODUCT
    // ---------------------------------------------------------

    if (sku) {
      if (current) {
        products.push(current);
      }

      const priceStr = cell(
        row,
        COL.WEBSITE_PRICE
      ).replace(/[₹,]/g, "");

      const originalPriceStr = cell(
        row,
        COL.ORIGINAL_PRICE
      ).replace(/[₹,]/g, "");

      const websiteLiveStr = cell(
        row,
        COL.WEBSITE_LIVE
      ).toUpperCase();

      // -------------------------------------------------------
      // IMAGEKIT FOLDER / IMAGE URLs
      // -------------------------------------------------------

      const imageSource = cell(
        row,
        COL.IMAGEKIT_LINK
      );

      const imageUrls =
        await parseImageUrls(imageSource);

      current = {
        name: name || sku,

        baseSku: sku,

        meeshoLink:
          cell(row, COL.MEESHO_LINK) ||
          undefined,

        imageUrls,

        imageUrl:
          imageUrls[0] ||
          undefined,

        weightGm:
          Number(
            cell(row, COL.WEIGHT_GM)
          ) || undefined,

        websiteLive:
          websiteLiveStr === "TRUE",

        websitePriceRupees:
          priceStr
            ? Number(priceStr)
            : undefined,
        originalPriceRupees:
          originalPriceStr
            ? Number(originalPriceStr)
            : undefined,

        variants: [],
      };

      console.log(
        `\n📦 Product: ${current.name}`
      );

      console.log(
        `   SKU: ${current.baseSku}`
      );

      console.log(
        `   Images: ${imageUrls.length}`
      );

      // -------------------------------------------------------
      // FIRST VARIANT
      // -------------------------------------------------------

      const size = cell(
        row,
        COL.SIZE_LABEL
      );

      const qty =
        Number(
          cell(row, COL.QTY)
        ) || 0;

      if (size) {
        current.variants.push({
          size,

          sku: `${sku}-${size}`,

          stock: qty,

          chest:
            cell(row, COL.CHEST) ||
            undefined,

          shoulder:
            cell(row, COL.SHOULDER) ||
            undefined,

          waist:
            cell(row, COL.WAIST) ||
            undefined,

          length:
            cell(row, COL.LENGTH) ||
            undefined,

          hip:
            cell(row, COL.HIP) ||
            undefined,
        });
      }

      continue;
    }

    // ---------------------------------------------------------
    // CONTINUATION / VARIANT ROW
    // ---------------------------------------------------------

    if (current) {
      const size = cell(
        row,
        COL.SIZE_LABEL
      );

      const qty =
        Number(
          cell(row, COL.QTY)
        ) || 0;

      if (!size) {
        continue;
      }

      current.variants.push({
        size,

        sku: `${current.baseSku}-${size}`,

        stock: qty,

        chest:
          cell(row, COL.CHEST) ||
          undefined,

        shoulder:
          cell(row, COL.SHOULDER) ||
          undefined,

        waist:
          cell(row, COL.WAIST) ||
          undefined,

        length:
          cell(row, COL.LENGTH) ||
          undefined,

        hip:
          cell(row, COL.HIP) ||
          undefined,
      });
    }
  }

  // ---------------------------------------------------------
  // FINAL PRODUCT
  // ---------------------------------------------------------

  if (current) {
    products.push(current);
  }

  return products;
}

export { slugify };