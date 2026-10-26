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
  // Paths are English (ADR-015); the Turkish ones they replaced redirect for
  // good. One list serves both hosts: the admin host's proxy rewrite runs after
  // these redirects.
  async redirects() {
    return [
      ["/kokteyller/yeni", "/cocktails/new"],
      ["/kokteyller/:id", "/cocktails/:id"],
      ["/kokteyller", "/cocktails"],
      ["/giris", "/login"],
      ["/hesap", "/account"],
      ["/hosgeldin", "/welcome"],
      ["/gizlilik", "/privacy"],
      ["/sozluk", "/glossary"],
      ["/iki-adim", "/setup-2fa"],
      ["/dogrula", "/verify"],
    ].map(([source, destination]) => ({ source, destination, permanent: true }));
  },
  // One root layout per tree (the site under [lang], the panel under admin), so unmatched addresses get
  // src/app/global-not-found.tsx (ADR-032).
  experimental: { globalNotFound: true },
  // The admin panel is developed at http://admin.localhost:3000 (ADR-007).
  allowedDevOrigins: ["admin.localhost"],
};

export default nextConfig;
