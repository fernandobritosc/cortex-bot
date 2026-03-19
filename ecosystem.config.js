module.exports = {
  apps: [
    {
      name: 'cortex-bot',
      script: 'npx',
      args: 'tsx src/index.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './error.log',
      out_file: './bot.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
