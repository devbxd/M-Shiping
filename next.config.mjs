/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/dashboard", destination: "/admin", permanent: false },
      { source: "/dashboard/:path*", destination: "/admin/:path*", permanent: false },
    ];
  },
};
export default nextConfig;
