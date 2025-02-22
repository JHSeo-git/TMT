import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["next-mdx-remote"],

  /* config options here */
  async redirects() {
    return [
      {
        source: "/",
        destination: "/p",
        permanent: true,
      },
      {
        source: "/i",
        destination: "/i/1",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
