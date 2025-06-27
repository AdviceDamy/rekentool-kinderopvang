import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('organisaties', (table) => {
    table.json('wizard_configuratie').defaultTo(JSON.stringify({
      welkom: true,
      kinderen: true,
      opvangvorm: true,
      tarief: true,
      planning: true,
      resultaat: true,
      jaarplanning: true,
      vergelijking: true
    }));
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('organisaties', (table) => {
    table.dropColumn('wizard_configuratie');
  });
} 