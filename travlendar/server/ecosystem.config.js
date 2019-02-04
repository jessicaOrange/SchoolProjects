module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  "apps": [
    {
      "name"        : "trs",
      "script"      : "./bin/www",
      "watch"       : true,
      "env" : {
        "NODE_ENV": "dev",
        "PORT": 3000
      },
      "env_prod" : {
        "NODE_ENV": "prod",
        "PORT": 10300
      }
    }
  ]
};
