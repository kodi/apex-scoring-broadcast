/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.raw(`
        SET timezone = 'UTC';
        ALTER TABLE drops ADD COLUMN "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE drops ADD COLUMN "deletedBy" character varying(36);
        ALTER TABLE drops ALTER "deletedAt" TYPE timestamptz;
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};
