import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('tarieven', (table) => {
    table.increments('id').primary();
    table.string('naam').notNullable(); // bijv. "Hele dag", "Halve dag", "Flexibel"
    table.enum('type', ['uur', 'dag', 'vast_maand']).notNullable(); 
    table.decimal('tarief', 8, 2).notNullable(); // prijs
    table.text('omschrijving');
    table.integer('opvangvorm_id').unsigned().notNullable().references('id').inTable('opvangvormen');
    table.integer('organisatie_id').unsigned().notNullable().references('id').inTable('organisaties');
    table.boolean('actief').defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('tarieven');
} 