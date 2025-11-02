import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // 指定输出文件追踪的根目录，避免 Next.js 误把上级目录的其他 lockfile 当作工作区根目录
  // 参考：https://nextjs.org/docs/app/api-reference/config/next-config-js/output#caveats
  outputFileTracingRoot: path.join(__dirname),
  output: "standalone",
};

export default nextConfig;
