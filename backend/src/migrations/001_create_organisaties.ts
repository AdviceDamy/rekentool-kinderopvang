import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('organisaties', (table) => {
    table.increments('id').primary();
    table.string('naam').notNullable();
    table.string('email');
    table.string('telefoon');
    table.text('adres');
    table.string('postcode');
    table.string('plaats');
    table.string('website');
    table.boolean('actief').defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('organisaties');
} 