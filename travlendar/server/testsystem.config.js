module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  "apps": [
    {
      name: "commit",
      script: "./bin/www",
      env_commit: {
        "PORT": 3000,
        "NODE_ENV": "dev"
      }
    },
    {
      name: "dev",
      script: "./bin/www",
      env_dev: {
        "PORT": 3000,
        "NODE_ENV": "dev"
      }
    },
    {
      name: "master",
      script: "./bin/www",
      env_master: {
        "PORT": 3000,
        "NODE_ENV": "dev"
      }
    }
  ]
};
