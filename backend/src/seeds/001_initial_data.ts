import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing entries
  await knex('users').del();
  await knex('organisaties').del();

  // Insert test organisaties één voor één voor SQLite compatibiliteit
  const org1Id = await knex('organisaties').insert({
    naam: 'Kinderopvang De Zonnebloem',
    email: 'info@zonnebloem.nl',
    telefoon: '020-1234567',
    adres: 'Hoofdstraat 123',
    postcode: '1234 AB',
    plaats: 'Amsterdam',
    website: 'https://www.zonnebloem.nl',
    slug: 'zonnebloem',
    actief: true
  });

  const org2Id = await knex('organisaties').insert({
    naam: 'BSO De Regenboog',
    email: 'info@regenboog.nl',
    telefoon: '030-7654321',
    adres: 'Schoolstraat 45',
    postcode: '3456 CD',
    plaats: 'Utrecht',
    website: 'https://www.regenboog.nl',
    slug: 'regenboog',
    actief: true
  });

  const org3Id = await knex('organisaties').insert({
    naam: 'Kinderopvang Zonnetje',
    email: 'contact@zonnetje.nl',
    telefoon: '040-9876543',
    adres: 'Parkweg 78',
    postcode: '5678 EF',
    plaats: 'Eindhoven',
    website: 'https://www.zonnetje.nl',
    slug: 'zonnetje',
    actief: true
  });

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 12);
  const hashedSuperPassword = await bcrypt.hash('superadmin123', 12);

  // Insert test users
  await knex('users').insert([
    {
      email: 'admin@zonnebloem.nl',
      password: hashedPassword,
      role: 'organisatie_beheerder',
      organisatie_id: org1Id[0]
    },
    {
      email: 'admin@regenboog.nl',
      password: hashedPassword,
      role: 'organisatie_beheerder',
      organisatie_id: org2Id[0]
    },
    {
      email: 'admin@zonnetje.nl',
      password: hashedPassword,
      role: 'organisatie_beheerder',
      organisatie_id: org3Id[0]
    },
    {
      email: 'superuser@admin.nl',
      password: hashedSuperPassword,
      role: 'superuser',
      organisatie_id: null
    }
  ]);
} 