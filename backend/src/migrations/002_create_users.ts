import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email').notNullable().unique();
    table.string('password').notNullable();
    table.enum('role', ['organisatie_beheerder', 'superuser']).notNullable();
    table.integer('organisatie_id').unsigned().references('id').inTable('organisaties');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
} 