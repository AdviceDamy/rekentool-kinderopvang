import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Voeg standaard inkomensklasse veld toe aan organisaties
  await knex.schema.alterTable('organisaties', (table) => {
    table.text('standaard_inkomensklasse').nullable(); // JSON string met min/max/percentage info
    table.boolean('toeslag_automatisch_berekenen').defaultTo(true); // Of toeslag automatisch berekend moet worden
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('organisaties', (table) => {
    table.dropColumn('standaard_inkomensklasse');
    table.dropColumn('toeslag_automatisch_berekenen');
  });
} 