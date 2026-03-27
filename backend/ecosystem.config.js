module.exports = {
  apps: [{
    name: "school-crm-api",
    script: "./server.js",
    instances: "max",       // Scale across all CPU cores
    exec_mode: "cluster",   // Enable Node.js clustering
    max_memory_restart: "512M", // Auto-restart if memory exceeds 512MB

    // Log file locations
    out_file: "./logs/pm2-out.log",
    error_file: "./logs/pm2-error.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss",

    // Development environment
    env: {
      NODE_ENV: "development",
      PORT: 3001,
      HOST: "localhost"
    },

    // Production environment (used with: pm2 start ecosystem.config.js --env production)
    env_production: {
      NODE_ENV: "production",
      PORT: 3001,
      HOST: "0.0.0.0",
      instances: "max",
      exec_mode: "cluster"
    }
  }]
};
