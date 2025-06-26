import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('organisaties', (table) => {
    table.string('slug').unique().notNullable().defaultTo('');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('organisaties', (table) => {
    table.dropColumn('slug');
  });
} 