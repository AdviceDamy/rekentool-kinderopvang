import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Verwijder bestaande data (in omgekeerde volgorde vanwege foreign keys)
  await knex('tarieven').del();
  await knex('opvangvormen').del();

  // Haal organisatie IDs op
  const organisaties = await knex('organisaties').select('id', 'naam');
  
  if (organisaties.length === 0) {
    console.log('⚠️ Geen organisaties gevonden, opvangvormen/tarieven niet toegevoegd');
    return;
  }

  // Voeg opvangvormen toe voor elke organisatie
  for (const org of organisaties) {
    // Opvangvormen per organisatie
    const opvangvormenData = [
      {
        naam: 'Kinderdagverblijf (KDV)',
        omschrijving: 'Volledige dagopvang voor kinderen van 0-4 jaar',
        organisatie_id: org.id,
        actief: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        naam: 'Buitenschoolse Opvang (BSO)',
        omschrijving: 'Opvang voor schoolgaande kinderen voor/na schooltijd',
        organisatie_id: org.id,
        actief: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        naam: 'Gastouderopvang',
        omschrijving: 'Kleinschalige opvang bij een gastouder thuis',
        organisatie_id: org.id,
        actief: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Insert opvangvormen en haal IDs op
    const opvangvormIds = await knex('opvangvormen').insert(opvangvormenData).returning('id');
    
    // Voor SQLite compatibility - haal de opvangvormen op
    const opvangvormen = await knex('opvangvormen')
      .where({ organisatie_id: org.id })
      .orderBy('id', 'desc')
      .limit(3);

    // KDV tarieven
    const kdvId = opvangvormen.find(o => o.naam.includes('KDV'))?.id;
    if (kdvId) {
      await knex('tarieven').insert([
        {
          naam: 'Hele dag',
          type: 'dag',
          tarief: 68.00,
          omschrijving: 'Volledige dag KDV (7:30-18:30)',
          opvangvorm_id: kdvId,
          organisatie_id: org.id,
          actief: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          naam: 'Halve dag',
          type: 'dag',
          tarief: 38.00,
          omschrijving: 'Halve dag KDV (4-5 uur)',
          opvangvorm_id: kdvId,
          organisatie_id: org.id,
          actief: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          naam: 'Flexibel uurtarief',
          type: 'uur',
          tarief: 9.25,
          omschrijving: 'Uurtarief voor flexibele opvang',
          opvangvorm_id: kdvId,
          organisatie_id: org.id,
          actief: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }

    // BSO tarieven
    const bsoId = opvangvormen.find(o => o.naam.includes('BSO'))?.id;
    if (bsoId) {
      await knex('tarieven').insert([
        {
          naam: 'Voor/na school',
          type: 'dag',
          tarief: 28.00,
          omschrijving: 'Voor- en naschoolse opvang per dag',
          opvangvorm_id: bsoId,
          organisatie_id: org.id,
          actief: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          naam: 'Alleen naschools',
          type: 'dag',
          tarief: 18.00,
          omschrijving: 'Alleen naschoolse opvang',
          opvangvorm_id: bsoId,
          organisatie_id: org.id,
          actief: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          naam: 'Uurtarief BSO',
          type: 'uur',
          tarief: 7.50,
          omschrijving: 'Flexibel uurtarief BSO',
          opvangvorm_id: bsoId,
          organisatie_id: org.id,
          actief: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }

    // Gastouder tarieven
    const gastouderId = opvangvormen.find(o => o.naam.includes('Gastouder'))?.id;
    if (gastouderId) {
      await knex('tarieven').insert([
        {
          naam: 'Hele dag gastouder',
          type: 'dag',
          tarief: 45.00,
          omschrijving: 'Volledige dag bij gastouder',
          opvangvorm_id: gastouderId,
          organisatie_id: org.id,
          actief: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          naam: 'Uurtarief gastouder',
          type: 'uur',
          tarief: 6.75,
          omschrijving: 'Uurtarief bij gastouder',
          opvangvorm_id: gastouderId,
          organisatie_id: org.id,
          actief: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }

    console.log(`✅ Opvangvormen en tarieven toegevoegd voor ${org.naam}`);
  }

  console.log('✅ Alle opvangvormen en tarieven seeded');
} 