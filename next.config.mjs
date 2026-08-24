/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Add your CDN/image host here, e.g. Cloudinary or S3
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
