const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseUrl.hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // The admin panel is developed at http://admin.localhost:3000 (ADR-007).
  allowedDevOrigins: ["admin.localhost"],
};

export default nextConfig;
