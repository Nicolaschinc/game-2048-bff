const knex = require("../db/knex");

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
