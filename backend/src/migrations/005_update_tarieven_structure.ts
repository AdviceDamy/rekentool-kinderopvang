import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('tarieven', (table) => {
    // Eerst configuratie kolom toevoegen
    table.json('configuratie').nullable();
  }).then(() => {
    // Dan bestaande type kolom hernoemen
    return knex.schema.raw('ALTER TABLE tarieven RENAME COLUMN type TO type_old');
  }).then(() => {
    // Nieuwe type kolom toevoegen met default waarde
    return knex.schema.alterTable('tarieven', (table) => {
      table.enum('type', ['uur', 'dag', 'vast_maand', 'dagen_week', 'vrij_uren_week', 'vrij_uren_maand']).defaultTo('uur').notNullable();
    });
  }).then(() => {
    // Data overzetten van oude naar nieuwe kolom
    return knex.raw('UPDATE tarieven SET type = type_old');
  }).then(() => {
    // Oude kolom verwijderen
    return knex.schema.alterTable('tarieven', (table) => {
      table.dropColumn('type_old');
    });
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('tarieven', (table) => {
    table.dropColumn('configuratie');
    table.dropColumn('type');
  }).then(() => {
    return knex.schema.alterTable('tarieven', (table) => {
      table.enum('type', ['uur', 'dag', 'vast_maand']).notNullable();
    });
  });
} 