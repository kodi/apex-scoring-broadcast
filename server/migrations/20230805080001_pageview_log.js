/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.raw(`
        CREATE TABLE IF NOT EXISTS "pageview" (
            "id" serial,
            "to" character varying(300),
            "from" character varying(300),
            "ip" character varying(20),
            "time" timestamptz DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id)
        );
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};
