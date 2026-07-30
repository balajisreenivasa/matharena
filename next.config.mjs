/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'artofproblemsolving.com' },
      { protocol: 'https', hostname: 'latex.artofproblemsolving.com' }
    ]
  }
};
export default nextConfig;
