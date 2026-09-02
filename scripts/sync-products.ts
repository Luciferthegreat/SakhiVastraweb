/**
 * Run with:
 *
 *   npm run sync:sheet
 *
 * Google Sheet -> Prisma Product Sync
 *
 * Rules:
 * - New product -> CREATE
 * - Existing product -> UPDATE
 * - New variant -> CREATE
 * - Existing variant -> UPDATE
 * - Old products are NEVER deleted
 * - Old variants are NEVER deleted
 * - Product identity is based on its variant SKU
 * - Sheet Website Live + Website Price controls Product.active
 */

import { PrismaClient } from "@prisma/client";

import {
  parseSheetProducts,
  slugify,
} from "../src/lib/sheet-sync";

const prisma = new PrismaClient();

// ------------------------------------------------------------
// ENV
// ------------------------------------------------------------

const SHEET_CSV_URL =
  process.env.GOOGLE_SHEET_CSV_URL;

const IMAGEKIT_PRIVATE_KEY =
  process.env.IMAGEKIT_PRIVATE_KEY;

const IMAGEKIT_URL_ENDPOINT =
  process.env.IMAGEKIT_URL_ENDPOINT ||
  "https://ik.imagekit.io/sakhivastra";

// ------------------------------------------------------------
// IMAGEKIT TYPES
// ------------------------------------------------------------

interface ImageKitFile {
  fileId?: string;
  name?: string;
  filePath?: string;
  url?: string;
  type?: string;
}

// ------------------------------------------------------------
// VALIDATION
// ------------------------------------------------------------

function validateEnvironment() {
  if (!SHEET_CSV_URL) {
    throw new Error(
      "Missing GOOGLE_SHEET_CSV_URL in .env"
    );
  }

  if (!IMAGEKIT_PRIVATE_KEY) {
    throw new Error(
      "Missing IMAGEKIT_PRIVATE_KEY in .env"
    );
  }

  if (!IMAGEKIT_URL_ENDPOINT) {
    throw new Error(
      "Missing IMAGEKIT_URL_ENDPOINT in .env"
    );
  }
}

// ------------------------------------------------------------
// IMAGEKIT AUTH
// ------------------------------------------------------------

function getImageKitAuthHeader(): string {
  if (!IMAGEKIT_PRIVATE_KEY) {
    throw new Error(
      "IMAGEKIT_PRIVATE_KEY is not configured."
    );
  }

  const credentials =
    `${IMAGEKIT_PRIVATE_KEY}:`;

  return (
    "Basic " +
    Buffer.from(credentials).toString(
      "base64"
    )
  );
}

// ------------------------------------------------------------
// IMAGEKIT URL CHECK
// ------------------------------------------------------------

function isImageKitUrl(
  value: string
): boolean {
  return (
    value.startsWith(
      IMAGEKIT_URL_ENDPOINT
    ) ||
    value.startsWith(
      "https://ik.imagekit.io/"
    )
  );
}

// ------------------------------------------------------------
// IMAGE FILE CHECK
// ------------------------------------------------------------

function looksLikeImageFile(
  value: string
): boolean {
  const cleanUrl =
    value
      .split("?")[0]
      .toLowerCase();

  return /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(
    cleanUrl
  );
}

// ------------------------------------------------------------
// IMAGEKIT FOLDER PATH
// ------------------------------------------------------------

function getImageKitFolderPath(
  folderUrl: string
): string | null {
  try {
    const url =
      new URL(folderUrl);

    if (
      !url.hostname.includes(
        "ik.imagekit.io"
      )
    ) {
      return null;
    }

    let path =
      decodeURIComponent(
        url.pathname
      );

    path =
      path.replace(/^\/+/, "");

    const accountId =
      new URL(
        IMAGEKIT_URL_ENDPOINT
      ).pathname.replace(
        /^\/+/,
        ""
      );

    if (
      accountId &&
      path.startsWith(
        accountId + "/"
      )
    ) {
      path =
        path.slice(
          accountId.length + 1
        );
    }

    return path || null;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------
// NATURAL IMAGE SORT
// ------------------------------------------------------------

function naturalImageSort(
  a: ImageKitFile,
  b: ImageKitFile
): number {
  const aName =
    a.name ||
    a.filePath ||
    "";

  const bName =
    b.name ||
    b.filePath ||
    "";

  const aBase =
    aName
      .split("/")
      .pop()
      ?.replace(
        /\.[^/.]+$/,
        ""
      ) || "";

  const bBase =
    bName
      .split("/")
      .pop()
      ?.replace(
        /\.[^/.]+$/,
        ""
      ) || "";

  const aNumber =
    Number(aBase);

  const bNumber =
    Number(bBase);

  if (
    Number.isFinite(aNumber) &&
    Number.isFinite(bNumber)
  ) {
    return aNumber - bNumber;
  }

  if (
    Number.isFinite(aNumber) &&
    !Number.isFinite(bNumber)
  ) {
    return -1;
  }

  if (
    !Number.isFinite(aNumber) &&
    Number.isFinite(bNumber)
  ) {
    return 1;
  }

  return aBase.localeCompare(
    bBase,
    undefined,
    {
      numeric: true,
      sensitivity: "base",
    }
  );
}

// ------------------------------------------------------------
// FETCH IMAGEKIT FOLDER
// ------------------------------------------------------------

async function fetchImageKitFolderImages(
  folderUrl: string
): Promise<string[]> {
  const folderPath =
    getImageKitFolderPath(
      folderUrl
    );

  if (!folderPath) {
    console.warn(
      `⚠️ Could not determine ImageKit folder path from: ${folderUrl}`
    );

    return [];
  }

  console.log(
    `   📁 ImageKit folder: /${folderPath}`
  );

  const allFiles: ImageKitFile[] =
    [];

  let skip = 0;

  const limit = 1000;

  while (true) {
    const params =
      new URLSearchParams();

    params.set(
      "path",
      folderPath
    );

    params.set(
      "type",
      "file"
    );

    params.set(
      "fileType",
      "image"
    );

    params.set(
      "limit",
      String(limit)
    );

    params.set(
      "skip",
      String(skip)
    );

    params.set(
      "sort",
      "ASC_NAME"
    );

    const apiUrl =
      `https://api.imagekit.io/v1/files?${params.toString()}`;

    const response =
      await fetch(
        apiUrl,
        {
          method: "GET",
          headers: {
            Accept:
              "application/json",

            Authorization:
              getImageKitAuthHeader(),
          },
        }
      );

    if (!response.ok) {
      const errorText =
        await response.text();

      throw new Error(
        `ImageKit API failed (${response.status}) for folder /${folderPath}: ${errorText}`
      );
    }

    const files =
      (await response.json()) as ImageKitFile[];

    if (
      !Array.isArray(files) ||
      files.length === 0
    ) {
      break;
    }

    allFiles.push(
      ...files
    );

    if (
      files.length < limit
    ) {
      break;
    }

    skip += limit;
  }

  const imageFiles =
    allFiles.filter(
      (file) => {
        if (
          file.type &&
          file.type !== "file"
        ) {
          return false;
        }

        if (file.url) {
          return true;
        }

        if (file.filePath) {
          return looksLikeImageFile(
            file.filePath
          );
        }

        if (file.name) {
          return looksLikeImageFile(
            file.name
          );
        }

        return false;
      }
    );

  imageFiles.sort(
    naturalImageSort
  );

  const imageUrls =
    imageFiles
      .map(
        (file) => {
          if (file.url) {
            return file.url;
          }

          if (file.filePath) {
            return (
              IMAGEKIT_URL_ENDPOINT.replace(
                /\/$/,
                ""
              ) +
              "/" +
              file.filePath
                .replace(
                  /^\/+/,
                  ""
                )
                .split("/")
                .map(
                  (part) =>
                    encodeURIComponent(
                      part
                    )
                )
                .join("/")
            );
          }

          return null;
        }
      )
      .filter(
        (
          url
        ): url is string =>
          Boolean(url)
      );

  return imageUrls;
}

// ------------------------------------------------------------
// RESOLVE PRODUCT IMAGES
// ------------------------------------------------------------

async function resolveProductImages(
  imageSources: string[]
): Promise<string[]> {
  const result: string[] =
    [];

  for (
    const source of imageSources
  ) {
    const cleanSource =
      source.trim();

    if (!cleanSource) {
      continue;
    }

    if (
      isImageKitUrl(
        cleanSource
      )
    ) {
      if (
        looksLikeImageFile(
          cleanSource
        )
      ) {
        result.push(
          cleanSource
        );

        continue;
      }

      console.log(
        `   🔍 Reading ImageKit folder...`
      );

      const folderImages =
        await fetchImageKitFolderImages(
          cleanSource
        );

      result.push(
        ...folderImages
      );

      continue;
    }

    if (
      cleanSource.startsWith(
        "http"
      )
    ) {
      result.push(
        cleanSource
      );
    }
  }

  return [
    ...new Set(result),
  ];
}

// ------------------------------------------------------------
// FIND EXISTING PRODUCT BY VARIANT SKU
// ------------------------------------------------------------
//
// We do NOT have baseSku on Product.
//
// Therefore:
//
// Sheet:
// DKNJ-000046
//
// variants:
// DKNJ-000046-M
// DKNJ-000046-L
//
// We use any existing variant SKU to find
// the parent Product.
//
// ------------------------------------------------------------

async function findExistingProduct(
  variantSkus: string[]
) {
  if (
    variantSkus.length === 0
  ) {
    return null;
  }

  const existingVariant =
    await prisma.productVariant.findFirst(
      {
        where: {
          sku: {
            in: variantSkus,
          },
        },
        include: {
          product: true,
        },
      }
    );

  return (
    existingVariant?.product ??
    null
  );
}

// ------------------------------------------------------------
// MAIN
// ------------------------------------------------------------

export async function syncProducts() {
  validateEnvironment();

  console.log(
    "\n================================="
  );

  console.log(
    "      SAKHIVASTRA SHEET SYNC"
  );

  console.log(
    "=================================\n"
  );

  // ----------------------------------------------------------
  // FETCH GOOGLE SHEET
  // ----------------------------------------------------------

  console.log(
    "📊 Fetching Google Sheet..."
  );

  const res =
    await fetch(
      SHEET_CSV_URL!
    );

  if (!res.ok) {
    throw new Error(
      `Could not fetch Google Sheet (status ${res.status}). Make sure the sheet is shared as "Anyone with the link can view".`
    );
  }

  const csvText =
    await res.text();

  // ----------------------------------------------------------
  // PARSE SHEET
  // ----------------------------------------------------------

  const sheetProducts =
    await parseSheetProducts(
      csvText
    );

  console.log(
    `📦 Parsed ${sheetProducts.length} product block(s).\n`
  );

  // ----------------------------------------------------------
  // REMOVE INVALID VARIANTS
  // ----------------------------------------------------------

  for (
    const product of sheetProducts
  ) {
    product.variants =
      product.variants.filter(
        (variant) => {
          const sku =
            variant.sku.trim();

          const size =
            variant.size.trim();

          if (
            !sku ||
            !size
          ) {
            return false;
          }

          if (
            sku.includes("-?") ||
            size === "?"
          ) {
            return false;
          }

          return true;
        }
      );
  }

  // ----------------------------------------------------------
  // CHECK DUPLICATE SKUS
  // ----------------------------------------------------------

  const allSkus =
    sheetProducts.flatMap(
      (product) =>
        product.variants.map(
          (variant) =>
            variant.sku
        )
    );

  const skuCounts =
    new Map<
      string,
      number
    >();

  for (
    const sku of allSkus
  ) {
    skuCounts.set(
      sku,
      (
        skuCounts.get(
          sku
        ) ?? 0
      ) + 1
    );
  }

  const duplicateSkus =
    [
      ...skuCounts.entries(),
    ]
      .filter(
        ([, count]) =>
          count > 1
      )
      .map(
        ([sku]) =>
          sku
      );

  console.log(
    `🔢 Total variant SKUs: ${allSkus.length}`
  );

  console.log(
    `🔁 Duplicate SKUs: ${duplicateSkus.length}`
  );

  if (
    duplicateSkus.length > 0
  ) {
    console.log(
      "\n❌ Duplicate SKU detected."
    );

    for (
      const duplicateSku of duplicateSkus
    ) {
      console.log(
        `\n🔴 ${duplicateSku}`
      );

      for (
        const product of sheetProducts
      ) {
        const matchingVariants =
          product.variants.filter(
            (variant) =>
              variant.sku ===
              duplicateSku
          );

        if (
          matchingVariants.length >
          0
        ) {
          console.log(
            `   Product: ${product.name}`
          );

          console.log(
            `   Base SKU: ${product.baseSku}`
          );

          console.log(
            `   Size(s): ${matchingVariants
              .map(
                (variant) =>
                  variant.size
              )
              .join(", ")}`
          );
        }
      }
    }

    console.log(
      "\n⚠️ Sync stopped safely."
    );

    return;
  }

  console.log(
    "✅ No duplicate SKUs found.\n"
  );

  // ----------------------------------------------------------
  // COUNTERS
  // ----------------------------------------------------------

  let created = 0;

  let updated = 0;

  const skippedNoPrice: string[] =
    [];

  const skippedNoImages: string[] =
    [];

  // ----------------------------------------------------------
  // SYNC PRODUCTS
  // ----------------------------------------------------------

  for (
    const product of sheetProducts
  ) {
    console.log(
      "\n---------------------------------"
    );

    console.log(
      `🛍️ ${product.name}`
    );

    console.log(
      `SKU: ${product.baseSku}`
    );

    // --------------------------------------------------------
    // VALID VARIANTS
    // --------------------------------------------------------

    if (
      product.variants.length ===
      0
    ) {
      console.log(
        `⚠️ Skipping ${product.baseSku}: no valid size variants.`
      );

      continue;
    }

    // --------------------------------------------------------
    // PRICE
    // --------------------------------------------------------

    const hasPrice =
      typeof product.websitePriceRupees ===
        "number" &&
      product.websitePriceRupees >
        0;

    if (!hasPrice) {
      skippedNoPrice.push(
        product.baseSku
      );
    }

    const basePricePaise =
      hasPrice
        ? Math.round(
            product.websitePriceRupees! *
              100
          )
        : 0;

    // --------------------------------------------------------
    // SLUG
    // --------------------------------------------------------

    const slug =
      `${slugify(
        product.name
      )}-${product.baseSku.toLowerCase()}`;

    // --------------------------------------------------------
    // IMAGEKIT
    // --------------------------------------------------------

    console.log(
      `📁 Image source(s): ${product.imageUrls.length}`
    );

    const images =
      await resolveProductImages(
        product.imageUrls
      );

    console.log(
      `📸 ${product.baseSku}: ${images.length} image(s) found`
    );

    if (
      images.length === 0
    ) {
      console.log(
        `⚠️ No images found for ${product.baseSku}`
      );

      skippedNoImages.push(
        product.baseSku
      );
    }

    // --------------------------------------------------------
    // SHOW IMAGE ORDER
    // --------------------------------------------------------

    if (
      images.length > 0
    ) {
      images.forEach(
        (
          image,
          index
        ) => {
          console.log(
            `   ${index + 1}. ${image}`
          );
        }
      );
    }

    // --------------------------------------------------------
    // FIND EXISTING PRODUCT
    // --------------------------------------------------------

    const variantSkus =
      product.variants.map(
        (variant) =>
          variant.sku
      );

      let existing =
        await findExistingProduct(
          variantSkus
        );

      if (!existing) {
        existing = await prisma.product.findUnique({
          where: {
            slug,
          },
        });
      }

    // --------------------------------------------------------
    // PRODUCT DATA
    // --------------------------------------------------------

    const productData = {
      name: product.name,

      slug,

      description:
        product.name,

      images,

      basePrice:
        basePricePaise,

      originalPrice:
        typeof product.originalPriceRupees === "number"
          ? Math.round(product.originalPriceRupees * 100)
          : null,

      active:
        product.websiteLive &&
        hasPrice,
    };

    // --------------------------------------------------------
    // UPDATE EXISTING PRODUCT
    // --------------------------------------------------------

    if (existing) {
      await prisma.product.update(
        {
          where: {
            id: existing.id,
          },

          data:
            productData,
        }
      );

      updated++;

      // ------------------------------------------------------
      // UPDATE / CREATE VARIANTS
      // ------------------------------------------------------

      for (
        const variant of product.variants
      ) {
        const existingVariant =
          await prisma.productVariant.findUnique(
            {
              where: {
                sku: variant.sku,
              },
            }
          );

        if (
          existingVariant
        ) {
          // ----------------------------------------------
          // EXISTING VARIANT
          // ----------------------------------------------

          await prisma.productVariant.update(
            {
              where: {
                id: existingVariant.id,
              },

              data: {
                stock:
                  variant.stock,

                size:
                  variant.size,

                color:
                  variant.color ||
                  undefined,

                productId:
                  existing.id,
              },
            }
          );

          console.log(
            `   🔄 Variant updated: ${variant.sku}`
          );
        } else {
          // ----------------------------------------------
          // NEW VARIANT
          // ----------------------------------------------

          await prisma.productVariant.create(
            {
              data: {
                sku:
                  variant.sku,

                size:
                  variant.size,

                stock:
                  variant.stock,

                color:
                  variant.color ||
                  undefined,

                productId:
                  existing.id,
              },
            }
          );

          console.log(
            `   🆕 Variant created: ${variant.sku}`
          );
        }
      }

      console.log(
        `✅ Updated ${product.baseSku}`
      );

      continue;
    }

    // --------------------------------------------------------
    // CREATE NEW PRODUCT
    // --------------------------------------------------------

    await prisma.product.create(
      {
        data: {
          ...productData,

          variants: {
            create:
              product.variants.map(
                (
                  variant
                ) => ({
                  size:
                    variant.size,

                  sku:
                    variant.sku,

                  stock:
                    variant.stock,

                  color:
                    variant.color ||
                    undefined,
                })
              ),
          },
        },
      }
    );

    created++;

    console.log(
      `🆕 Created ${product.baseSku}`
    );
  }

  // ----------------------------------------------------------
  // FINAL SUMMARY
  // ----------------------------------------------------------

  console.log(
    "\n================================="
  );

  console.log(
    "          SYNC COMPLETE"
  );

  console.log(
    "================================="
  );

  console.log(
    `🆕 Created: ${created}`
  );

  console.log(
    `🔄 Updated: ${updated}`
  );

  console.log(
    `📦 Total products: ${sheetProducts.length}`
  );

  console.log(
    `🔢 Total variants: ${allSkus.length}`
  );

  console.log(
    `📸 Products without images: ${skippedNoImages.length}`
  );

  // ----------------------------------------------------------
  // NO PRICE
  // ----------------------------------------------------------

  if (
    skippedNoPrice.length >
    0
  ) {
    console.log(
      `\n⚠️ ${skippedNoPrice.length} product(s) inactive because Website Price is missing:`
    );

    console.log(
      skippedNoPrice.join(
        ", "
      )
    );
  }

  // ----------------------------------------------------------
  // NO IMAGES
  // ----------------------------------------------------------

  if (
    skippedNoImages.length >
    0
  ) {
    console.log(
      `\n⚠️ Products with no images:`
    );

    console.log(
      skippedNoImages.join(
        ", "
      )
    );
  }

  console.log(
    "\n=================================\n"
  );
}

// --------------------------------------------------------------
// ERROR HANDLING
// --------------------------------------------------------------
syncProducts()
  .catch((err) => {
    console.error("\n❌ Sync failed:");
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });