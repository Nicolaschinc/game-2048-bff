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
    nickname: row.nickname || null,
    bestScore:
      typeof row.best_score === "number"
        ? row.best_score
        : row.best_score
        ? Number(row.best_score)
        : 0,
    countryCode: row.country_code || null,
    locale: row.locale || null,
    timeZone: row.time_zone || null,
    isEmailVerified:
      typeof row.is_email_verified === "number"
        ? row.is_email_verified === 1
        : !!row.is_email_verified,
    passwordHash: row.password_hash,
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : row.created_at && row.created_at.toISOString
        ? row.created_at.toISOString()
        : null,
    updatedAt:
      typeof row.updated_at === "string"
        ? row.updated_at
        : row.updated_at && row.updated_at.toISOString
        ? row.updated_at.toISOString()
        : null,
    lastLoginAt:
      typeof row.last_login_at === "string"
        ? row.last_login_at
        : row.last_login_at && row.last_login_at.toISOString
        ? row.last_login_at.toISOString()
        : null,
  };
}

async function createUser({ email, passwordHash, nickname }) {
  const now = new Date();
  const ids = await knex("users").insert({
    email,
    password_hash: passwordHash,
    nickname,
    created_at: now,
  });

  const id = Array.isArray(ids) ? ids[0] : ids;

  const rows = await knex("users").where({ id }).limit(1);
  const row = rows[0];

  return {
    id: String(row.id),
    email: row.email,
    nickname: row.nickname || null,
    bestScore:
      typeof row.best_score === "number"
        ? row.best_score
        : row.best_score
        ? Number(row.best_score)
        : 0,
    countryCode: row.country_code || null,
    locale: row.locale || null,
    timeZone: row.time_zone || null,
    isEmailVerified:
      typeof row.is_email_verified === "number"
        ? row.is_email_verified === 1
        : !!row.is_email_verified,
    passwordHash: row.password_hash,
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : row.created_at && row.created_at.toISOString
        ? row.created_at.toISOString()
        : null,
    updatedAt:
      typeof row.updated_at === "string"
        ? row.updated_at
        : row.updated_at && row.updated_at.toISOString
        ? row.updated_at.toISOString()
        : null,
    lastLoginAt:
      typeof row.last_login_at === "string"
        ? row.last_login_at
        : row.last_login_at && row.last_login_at.toISOString
        ? row.last_login_at.toISOString()
        : null,
  };
}

async function countTodayRegistrations() {
  const row = await knex("users")
    .whereRaw("DATE(created_at) = CURRENT_DATE")
    .count({ count: "*" })
    .first();

  const value =
    row && (row.count !== undefined ? row.count : row["count(*)"]);

  return typeof value === "string" ? Number(value) : Number(value || 0);
}

module.exports = {
  findByEmail,
  createUser,
  countTodayRegistrations,
};
