const dotenv = require("dotenv");
dotenv.config();

const knex = require("./knex");
const { schemaStatements } = require("./schema");

async function initSchema() {
  try {
    for (const sql of schemaStatements) {
      await knex.raw(sql);
    }
    console.log("Database schema initialized successfully");
  } catch (err) {
    console.error("Failed to initialize database schema");
    console.error(err.message || err);
    process.exitCode = 1;
  } finally {
    await knex.destroy();
  }
}

initSchema();

