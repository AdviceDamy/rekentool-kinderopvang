# Test Toeslagberekening API

## Test 1: Succesvolle berekening

```bash
curl -X POST http://localhost:5007/api/toeslag/bereken \
  -H "Content-Type: application/json" \
  -d '{
    "organisatieId": 1,
    "actief_toeslagjaar": 2024,
    "gemeente_toeslag_percentage": 0,
    "gemeente_toeslag_actief": false,
    "gezinsinkomen": 40000,
    "kinderen": [{
      "opvangvorm": "dagopvang",
      "uren_per_maand": 140,
      "uurtarief": 8.50
    }]
  }'
```

## Test 2: Validatie fout - ontbrekende velden

```bash
curl -X POST http://localhost:5007/api/toeslag/bereken \
  -H "Content-Type: application/json" \
  -d '{
    "organisatieId": 1,
    "gezinsinkomen": 40000
  }'
```

## Test 3: Meerdere kinderen

```bash
curl -X POST http://localhost:5007/api/toeslag/bereken \
  -H "Content-Type: application/json" \
  -d '{
    "organisatieId": 1,
    "actief_toeslagjaar": 2024,
    "gemeente_toeslag_percentage": 5,
    "gemeente_toeslag_actief": true,
    "gezinsinkomen": 50000,
    "kinderen": [
      {
        "opvangvorm": "dagopvang",
        "uren_per_maand": 160,
        "uurtarief": 9.00
      },
      {
        "opvangvorm": "bso",
        "uren_per_maand": 80,
        "uurtarief": 7.50
      }
    ]
  }'
```

## Test 4: Validatie fout - ongeldige waarden

```bash
curl -X POST http://localhost:5007/api/toeslag/bereken \
  -H "Content-Type: application/json" \
  -d '{
    "organisatieId": 1,
    "actief_toeslagjaar": 2024,
    "gemeente_toeslag_percentage": 150,
    "gemeente_toeslag_actief": true,
    "gezinsinkomen": -5000,
    "kinderen": [{
      "opvangvorm": "ongeldig",
      "uren_per_maand": 500,
      "uurtarief": 100
    }]
  }'
```

## Verwachte resultaten:

### Test 1: 
- Status: 200 OK
- Response bevat berekende toeslag met landelijke toeslag

### Test 2:
- Status: 400 Bad Request
- Response bevat validatie fouten voor ontbrekende velden

### Test 3:
- Status: 200 OK
- Response bevat berekening voor beide kinderen met gemeentelijke toeslag

### Test 4:
- Status: 400 Bad Request
- Response bevat gedetailleerde validatie fouten voor elk ongeldig veld