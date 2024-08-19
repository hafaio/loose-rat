/** @type {import('next').NextConfig} */

const nextConfig = {
  basePath: process.env.NODE_ENV === "production" ? "/loose-rat" : undefined,
};

export default nextConfig;
