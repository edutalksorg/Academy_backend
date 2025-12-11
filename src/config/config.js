require("dotenv").config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 4000,
  seed: process.env.SEED === "true",

  // Database configuration: supports MySQL (default) and SQLite for local development.
  db: (function () {
    const useSqlite = process.env.DB_USE_SQLITE === 'true';
    if (useSqlite) {
      return {
        dialect: 'sqlite',
        storage: process.env.DB_STORAGE || './database.sqlite'
      };
    }

    return {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      dialect: process.env.DB_DIALECT || 'mysql',
      storage: process.env.DB_STORAGE || null,
      connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '60000', 10),
      acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000', 10),
    };
  })(),

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  },
};
