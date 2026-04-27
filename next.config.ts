/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "*",
        },
      ],
    },
    redirects: async () => {
      return [];
    },
  };
  
  export default nextConfig;
  