import request from 'supertest';
import { Express } from 'express';
import express from 'express';
import cors from 'cors';
import database from '../../utils/database';
import { berekenToeslag } from '../../controllers/toeslagController';

describe('ToeslagController API', () => {
  let app: Express;

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(cors());
    app.use(express.json());
    
    // Add route
    app.post('/api/toeslag/bereken', berekenToeslag);
  });

  beforeEach(async () => {
    // Insert test organisatie with proper structure
    await database('organisaties').insert({
      id: 1,
      naam: 'Test Organisatie',
      email: 'test@example.com',
      slug: 'test-organisatie',
      actief: true,
      actief_toeslagjaar: 2024,
      gemeente_toeslag_percentage: 10,
      gemeente_toeslag_actief: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Insert test toeslagtabel data
    const testToeslagtabelData = {
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
      data: JSON.stringify(testToeslagtabelData),
      actief: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  });

  describe('POST /api/toeslag/bereken', () => {
    it('should calculate toeslag correctly', async () => {
      const requestBody = {
        organisatieId: 1,
        actief_toeslagjaar: 2024,
        gemeente_toeslag_percentage: 10,
        gemeente_toeslag_actief: true,
        gezinsinkomen: 20000,
        kinderen: [{
          opvangvorm: 'dagopvang' as 'dagopvang',
          uren_per_maand: 160,
          uurtarief: 8.50
        }]
      };

      const response = await request(app)
        .post('/api/toeslag/bereken')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totaal_brutokosten).toBe(1360);
      expect(response.body.data.totaal_toeslag_landelijk).toBe(1305.60);
      expect(response.body.data.totaal_toeslag_gemeente).toBe(136.00);
      expect(response.body.data.totaal_nettokosten).toBe(0); // Capped at 0
      expect(response.body.data.kinderen).toHaveLength(1);
    });

    it('should return 400 for missing required fields', async () => {
      const requestBody = {
        organisatieId: 1,
        // Missing required fields
        gezinsinkomen: 20000
      };

      const response = await request(app)
        .post('/api/toeslag/bereken')
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ontbrekende verplichte velden');
    });

    it('should return 404 for non-existent organisatie', async () => {
      const requestBody = {
        organisatieId: 999, // Non-existent
        actief_toeslagjaar: 2024,
        gemeente_toeslag_percentage: 0,
        gemeente_toeslag_actief: false,
        gezinsinkomen: 20000,
        kinderen: [{
          opvangvorm: 'dagopvang' as 'dagopvang',
          uren_per_maand: 160,
          uurtarief: 8.50
        }]
      };

      const response = await request(app)
        .post('/api/toeslag/bereken')
        .send(requestBody)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Organisatie niet gevonden');
    });

    it('should return 500 for non-existent toeslagjaar', async () => {
      const requestBody = {
        organisatieId: 1,
        actief_toeslagjaar: 2030, // Non-existent
        gemeente_toeslag_percentage: 0,
        gemeente_toeslag_actief: false,
        gezinsinkomen: 20000,
        kinderen: [{
          opvangvorm: 'dagopvang' as 'dagopvang',
          uren_per_maand: 160,
          uurtarief: 8.50
        }]
      };

      const response = await request(app)
        .post('/api/toeslag/bereken')
        .send(requestBody)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Geen toeslagtabel gevonden voor jaar 2030');
    });

    it('should handle multiple children correctly', async () => {
      const requestBody = {
        organisatieId: 1,
        actief_toeslagjaar: 2024,
        gemeente_toeslag_percentage: 10,
        gemeente_toeslag_actief: true,
        gezinsinkomen: 40000, // Middle income bracket
        kinderen: [
          {
            opvangvorm: 'dagopvang' as 'dagopvang',
            uren_per_maand: 160,
            uurtarief: 8.50
          },
          {
            opvangvorm: 'bso' as 'bso',
            uren_per_maand: 80,
            uurtarief: 7.00
          }
        ]
      };

      const response = await request(app)
        .post('/api/toeslag/bereken')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totaal_brutokosten).toBe(1920);
      expect(response.body.data.kinderen).toHaveLength(2);
      
      // Check that one child is marked as eerste_kind
      const eersteKind = response.body.data.kinderen.find((k: any) => k.is_eerste_kind);
      const volgendeKind = response.body.data.kinderen.find((k: any) => !k.is_eerste_kind);
      
      expect(eersteKind).toBeDefined();
      expect(volgendeKind).toBeDefined();
    });
  });
}); 