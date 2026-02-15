const knex = require("knex")({
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "game_2048",
  },
  pool: {
    min: 0,
    max: 10,
  },
});

async function findByEmail(email) {
  const rows = await knex("users").where({ email }).limit(1);
  if (!rows || rows.length === 0) {
    return null;
  }
  const row = rows[0];
  return {
    id: String(row.id),
    email: row.email,
    passwordHash: row.password_hash,
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : row.created_at && row.created_at.toISOString
        ? row.created_at.toISOString()
        : null,
  };
}

async function createUser({ email, passwordHash }) {
  const now = new Date();
  const ids = await knex("users").insert({
    email,
    password_hash: passwordHash,
    created_at: now,
  });

  const id = Array.isArray(ids) ? ids[0] : ids;

  const rows = await knex("users").where({ id }).limit(1);
  const row = rows[0];

  return {
    id: String(row.id),
    email: row.email,
    passwordHash: row.password_hash,
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : row.created_at && row.created_at.toISOString
        ? row.created_at.toISOString()
        : null,
  };
}

module.exports = {
  findByEmail,
  createUser,
};
