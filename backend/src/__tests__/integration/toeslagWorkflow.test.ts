import request from 'supertest';
import { Express } from 'express';
import express from 'express';
import cors from 'cors';
import database from '../../utils/database';
import { berekenToeslag } from '../../controllers/toeslagController';
import { getBeschikbareJaren, getInkomensklassen } from '../../controllers/toeslagtabelController';

describe('Toeslag Workflow Integration Test', () => {
  let app: Express;

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(cors());
    app.use(express.json());
    
    // Add routes
    app.post('/api/toeslag/bereken', berekenToeslag);
    app.get('/api/toeslag/:jaar/jaren', getBeschikbareJaren);
    app.get('/api/toeslag/:jaar/inkomensklassen', getInkomensklassen);
  });

  beforeEach(async () => {
    // Insert complete test dataset
    
    // 1. Organisatie
    await database('organisaties').insert({
      id: 1,
      naam: 'KinderCentrum De Regenboog',
      email: 'info@regenboog.nl',
      actief: true
    });

    // 2. Toeslagtabel 2024
    const toeslagtabelData = {
      year: 2024,
      income_brackets: [
        { min: 0, max: 23000, perc_first_child: 96, perc_other_children: 96 },
        { min: 23001, max: 53000, perc_first_child: 83, perc_other_children: 83 },
        { min: 53001, max: 75000, perc_first_child: 50, perc_other_children: 50 },
        { min: 75001, max: null, perc_first_child: 0, perc_other_children: 0 }
      ],
      max_hourly_rates: {
        dagopvang: 10.25,
        bso: 9.12,
        gastouder: 7.53
      }
    };

    await database('toeslagtabellen').insert({
      jaar: 2024,
      data: JSON.stringify(toeslagtabelData),
      actief: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  });

  describe('Complete workflow van organisatie tot berekening', () => {
    
         it('should calculate correct toeslag for realistic daycare scenario', async () => {
       // Scenario: Familie met 1 kind, middel inkomen, 4 dagen KDV
       const requestBody = {
         organisatieId: 1,
         actief_toeslagjaar: 2024,
         gemeente_toeslag_percentage: 5, // 5% gemeentelijke toeslag
         gemeente_toeslag_actief: true,
         gezinsinkomen: 45000, // Middel inkomen bracket (83% toeslag)
         kinderen: [{
           opvangvorm: 'dagopvang',
           uren_per_maand: 160, // 4 dagen x 10 uur x 4 weken
           uurtarief: 9.50 // Onder maximum tarief
         }]
       };

       const response = await request(app)
         .post('/api/toeslag/bereken')
         .send(requestBody)
         .expect(200);

      expect(response.body.success).toBe(true);
      
      const result = response.body.data;
      
      // Verwachte berekening:
      // Brutokosten: 160 * 9.50 = 1520
      // Landelijke toeslag: 1520 * 0.83 = 1261.60
      // Gemeente toeslag: 1520 * 0.05 = 76.00
      // Totaal toeslag: 1261.60 + 76.00 = 1337.60
      // Netto kosten: 1520 - 1337.60 = 182.40

      expect(result.totaal_brutokosten).toBe(1520);
      expect(result.totaal_toeslag_landelijk).toBe(1261.60);
      expect(result.totaal_toeslag_gemeente).toBe(76.00);
      expect(result.totaal_toeslag).toBe(1337.60);
      expect(result.totaal_nettokosten).toBe(182.40);
    });

    it('should cap hourly rate at maximum for high-end daycare', async () => {
      // Scenario: Dure KDV die boven maximumtarief zit
      const request = {
        organisatieId: 1,
        actief_toeslagjaar: 2024,
        gemeente_toeslag_percentage: 0,
        gemeente_toeslag_actief: false,
        gezinsinkomen: 30000, // Lage inkomen bracket (83% toeslag)
        kinderen: [{
          opvangvorm: 'dagopvang',
          uren_per_maand: 160,
          uurtarief: 12.50 // Boven maximum van 10.25
        }]
      };

      const response = await app
        .request()
        .post('/api/toeslag/bereken')
        .send(request)
        .expect(200);

      const result = response.body.data;
      
      // Verwachte berekening:
      // Brutokosten: 160 * 12.50 = 2000 (volledig tarief)
      // Toeslag basis: 160 * 10.25 = 1640 (capped tarief)
      // Landelijke toeslag: 1640 * 0.83 = 1361.20
      // Netto kosten: 2000 - 1361.20 = 638.80

      expect(result.totaal_brutokosten).toBe(2000);
      expect(result.totaal_toeslag_landelijk).toBe(1361.20);
      expect(result.totaal_nettokosten).toBe(638.80);
      
      // Check dat vergoed uurtarief correct is gecapped
      expect(result.kinderen[0].vergoed_uurtarief).toBe(10.25);
    });

    it('should handle BSO correctly with different max rate', async () => {
      // Scenario: BSO met eigen maximumtarief
      const request = {
        organisatieId: 1,
        actief_toeslagjaar: 2024,
        gemeente_toeslag_percentage: 0,
        gemeente_toeslag_actief: false,
        gezinsinkomen: 25000, // Lage inkomen bracket (83% toeslag)
        kinderen: [{
          opvangvorm: 'bso',
          uren_per_maand: 80, // 2 dagen x 10 uur x 4 weken
          uurtarief: 8.50
        }]
      };

      const response = await app
        .request()
        .post('/api/toeslag/bereken')
        .send(request)
        .expect(200);

      const result = response.body.data;
      
      // Verwachte berekening (BSO max = 9.12):
      // Brutokosten: 80 * 8.50 = 680
      // Toeslag basis: 80 * 8.50 = 680 (onder BSO max van 9.12)
      // Landelijke toeslag: 680 * 0.83 = 564.40
      // Netto kosten: 680 - 564.40 = 115.60

      expect(result.totaal_brutokosten).toBe(680);
      expect(result.totaal_toeslag_landelijk).toBe(564.40);
      expect(result.totaal_nettokosten).toBe(115.60);
      expect(result.kinderen[0].vergoed_uurtarief).toBe(8.50);
    });

    it('should handle multiple children with different opvangvormen', async () => {
      // Scenario: 2 kinderen, verschillende opvangvormen
      const request = {
        organisatieId: 1,
        actief_toeslagjaar: 2024,
        gemeente_toeslag_percentage: 10,
        gemeente_toeslag_actief: true,
        gezinsinkomen: 60000, // Midden-hoog inkomen (50% toeslag)
        kinderen: [
          {
            opvangvorm: 'dagopvang',
            uren_per_maand: 180, // Eerste kind (meeste uren)
            uurtarief: 9.00
          },
          {
            opvangvorm: 'bso',
            uren_per_maand: 60, // Tweede kind
            uurtarief: 7.50
          }
        ]
      };

      const response = await app
        .request()
        .post('/api/toeslag/bereken')
        .send(request)
        .expect(200);

      const result = response.body.data;
      
      // Kind met meeste uren krijgt eerste kind percentage
      const eersteKind = result.kinderen.find((k: any) => k.is_eerste_kind);
      const tweedeKind = result.kinderen.find((k: any) => !k.is_eerste_kind);
      
      expect(eersteKind).toBeDefined();
      expect(tweedeKind).toBeDefined();
      
      // Eerste kind: 180 * 9.00 = 1620, toeslag 50% = 810 + gemeente 162 = 972
      // Tweede kind: 60 * 7.50 = 450, toeslag 50% = 225 + gemeente 45 = 270
      // Totaal bruto: 1620 + 450 = 2070
      // Totaal toeslag: 810 + 225 + 162 + 45 = 1242
      // Netto: 2070 - 1242 = 828

      expect(result.totaal_brutokosten).toBe(2070);
      expect(result.totaal_toeslag_landelijk).toBe(1035); // 810 + 225
      expect(result.totaal_toeslag_gemeente).toBe(207); // 162 + 45
      expect(result.totaal_nettokosten).toBe(828);
      expect(result.kinderen).toHaveLength(2);
    });

    it('should handle high income with zero toeslag', async () => {
      // Scenario: Hoog inkomen, geen toeslag
      const request = {
        organisatieId: 1,
        actief_toeslagjaar: 2024,
        gemeente_toeslag_percentage: 0,
        gemeente_toeslag_actief: false,
        gezinsinkomen: 85000, // Hoog inkomen (0% toeslag)
        kinderen: [{
          opvangvorm: 'dagopvang',
          uren_per_maand: 160,
          uurtarief: 10.00
        }]
      };

      const response = await app
        .request()
        .post('/api/toeslag/bereken')
        .send(request)
        .expect(200);

      const result = response.body.data;
      
      expect(result.totaal_brutokosten).toBe(1600);
      expect(result.totaal_toeslag_landelijk).toBe(0);
      expect(result.totaal_toeslag_gemeente).toBe(0);
      expect(result.totaal_nettokosten).toBe(1600); // Geen toeslag
    });

    it('should cap hours at 230 per month', async () => {
      // Scenario: Meer dan 230 uur per maand
      const request = {
        organisatieId: 1,
        actief_toeslagjaar: 2024,
        gemeente_toeslag_percentage: 0,
        gemeente_toeslag_actief: false,
        gezinsinkomen: 20000, // Lage inkomen (96% toeslag)
        kinderen: [{
          opvangvorm: 'dagopvang',
          uren_per_maand: 280, // Meer dan 230 limit
          uurtarief: 8.00
        }]
      };

      const response = await app
        .request()
        .post('/api/toeslag/bereken')
        .send(request)
        .expect(200);

      const result = response.body.data;
      
      // Verwachte berekening:
      // Brutokosten: 280 * 8.00 = 2240 (alle uren)
      // Toeslag basis: 230 * 8.00 = 1840 (max 230 uur)
      // Landelijke toeslag: 1840 * 0.96 = 1766.40
      // Netto kosten: 2240 - 1766.40 = 473.60

      expect(result.totaal_brutokosten).toBe(2240);
      expect(result.totaal_toeslag_landelijk).toBe(1766.40);
      expect(result.totaal_nettokosten).toBe(473.60);
      expect(result.kinderen[0].vergoed_uren).toBe(230); // Capped
    });
  });
}); 