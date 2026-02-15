const schemaStatements = [
  `
  CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) DEFAULT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) DEFAULT NULL,
    best_score INT UNSIGNED NOT NULL DEFAULT 0,
    country_code CHAR(2) DEFAULT NULL,
    locale VARCHAR(10) DEFAULT NULL,
    time_zone VARCHAR(50) DEFAULT NULL,
    is_email_verified TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_users_email (email)
  );
  `,
];

module.exports = {
  schemaStatements,
};
