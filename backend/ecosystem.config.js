module.exports = {
  apps: [{
    name: "school-crm-api",
    script: "./server.js",
    instances: "max", // Run as many instances as there are CPU cores
    exec_mode: "cluster", // Enables clustering
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
};
