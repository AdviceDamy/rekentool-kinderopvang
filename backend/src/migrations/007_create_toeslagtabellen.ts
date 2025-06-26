import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Maak de toeslagtabellen tabel
  await knex.schema.createTable('toeslagtabellen', (table) => {
    table.increments('id').primary();
    table.integer('jaar').unique().notNullable();
    table.text('data').notNullable(); // JSON string met toeslaggegevens
    table.boolean('actief').defaultTo(true);
    table.timestamps(true, true);
  });

  // Voeg toeslag-gerelateerde velden toe aan organisaties
  await knex.schema.alterTable('organisaties', (table) => {
    table.integer('actief_toeslagjaar').nullable();
    table.decimal('gemeente_toeslag_percentage', 5, 2).defaultTo(0.00);
    table.boolean('gemeente_toeslag_actief').defaultTo(false);
    
    // Foreign key constraint naar toeslagtabellen
    table.foreign('actief_toeslagjaar').references('jaar').inTable('toeslagtabellen');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Verwijder foreign key en nieuwe kolommen uit organisaties
  await knex.schema.alterTable('organisaties', (table) => {
    table.dropForeign(['actief_toeslagjaar']);
    table.dropColumn('actief_toeslagjaar');
    table.dropColumn('gemeente_toeslag_percentage');
    table.dropColumn('gemeente_toeslag_actief');
  });

  // Verwijder toeslagtabellen tabel
  await knex.schema.dropTable('toeslagtabellen');
} 