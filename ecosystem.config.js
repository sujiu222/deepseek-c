module.exports = {
  apps: [
    {
      name: "deepseek-c",
      cwd: __dirname,
      script: "./node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
      env_file: ".env.production",
      out_file: "./logs/pm2/out.log",
      error_file: "./logs/pm2/error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
