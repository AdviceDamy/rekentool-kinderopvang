import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('opvangvormen', (table) => {
    table.increments('id').primary();
    table.string('naam').notNullable();
    table.text('omschrijving');
    table.integer('organisatie_id').unsigned().notNullable().references('id').inTable('organisaties');
    table.boolean('actief').defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('opvangvormen');
} 