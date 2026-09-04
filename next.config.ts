import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["next-mdx-remote"],

  /**
   * Next writes `AGENTS.md` and `CLAUDE.md` at the project root on every dev run and build so an
   * agent reads version-matched docs. They are generated output, and ADR 0001 keeps generated
   * output out of the directories this repository maintains by hand.
   */
  agentRules: false,
}

export default nextConfig
