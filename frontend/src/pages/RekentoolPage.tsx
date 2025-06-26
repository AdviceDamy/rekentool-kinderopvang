import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Text, Button, Input, VStack, HStack } from '@chakra-ui/react';

interface Organisatie {
  id: number;
  naam: string;
  slug: string;
  actief_toeslagjaar?: number;
  gemeente_toeslag_percentage?: number;
  gemeente_toeslag_actief?: boolean;
}

interface Opvangvorm {
  id: number;
  naam: string;
  omschrijving?: string;
}

interface Tarief {
  id: number;
  naam: string;
  type: string;
  tarief: number;
  opvangvorm_id: number;
  configuratie?: any;
}

interface Inkomensklasse {
  id: number;
  min: number;
  max: number | null;
  label: string;
  perc_first_child: number;
  perc_other_children: number;
}

interface Kind {
  opvangvorm_id: string;
  tariefId: string;
  uren_per_week: number;
  dagen_per_week: number;
}

interface ToeslagResultaat {
  totaal_brutokosten: number;
  totaal_toeslag_landelijk: number;
  totaal_toeslag_gemeente: number;
  totaal_toeslag: number;
  totaal_nettokosten: number;
  kinderen: Array<{
    brutokosten: number;
    toeslag_landelijk: number;
    toeslag_gemeente: number;
    toeslag_totaal: number;
    nettokosten: number;
    vergoed_uurtarief: number;
    vergoed_uren: number;
    is_eerste_kind: boolean;
  }>;
  gebruikte_toeslagtabel: {
    jaar: number;
    max_hourly_rates: {
      dagopvang: number;
      bso: number;
      gastouder: number;
    };
  };
}

const RekentoolPage: React.FC = () => {
  const { organisatieSlug } = useParams<{ organisatieSlug: string }>();
  
  // State
  const [organisatie, setOrganisatie] = useState<Organisatie | null>(null);
  const [opvangvormen, setOpvangvormen] = useState<Opvangvorm[]>([]);
  const [tarieven, setTarieven] = useState<Tarief[]>([]);
  const [inkomensklassen, setInkomensklassen] = useState<Inkomensklasse[]>([]);
  const [loading, setLoading] = useState(true);
  const [berekening, setBerekening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [kind, setKind] = useState<Kind>({
    opvangvorm_id: '',
    tariefId: '',
    uren_per_week: 32,
    dagen_per_week: 4
  });
  
  const [geselecteerdeInkomensklasse, setGeselecteerdeInkomensklasse] = useState<string>('');
  const [toeslagBerekening, setToeslagBerekening] = useState<boolean>(true);
  
  // Resultaat
  const [resultaat, setResultaat] = useState<{
    brutokosten: number;
    berekening_details: string;
    toeslag?: ToeslagResultaat;
  } | null>(null);

  useEffect(() => {
    loadOrganisatieData();
  }, [organisatieSlug]);

  const loadOrganisatieData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5007';
      
      // Haal organisatie op via de nieuwe publieke route
      const orgResponse = await fetch(`${apiUrl}/api/organisaties/public/${organisatieSlug}`);
      if (!orgResponse.ok) {
        throw new Error('Organisatie niet gevonden');
      }
      const orgResult = await orgResponse.json();
      
      if (!orgResult.success) {
        throw new Error(orgResult.error || 'Organisatie niet gevonden');
      }
      
      setOrganisatie(orgResult.data);

      // Haal opvangvormen op voor deze organisatie met org parameter
      const opvangvormenResponse = await fetch(`${apiUrl}/api/opvangvormen?org=${organisatieSlug}`);
      if (opvangvormenResponse.ok) {
        const opvangvormenResult = await opvangvormenResponse.json();
        if (opvangvormenResult.success) {
          setOpvangvormen(opvangvormenResult.data || []);
        }
      }

      // Haal tarieven op voor deze organisatie met org parameter
      const tarievenResponse = await fetch(`${apiUrl}/api/tarieven?org=${organisatieSlug}`);
      if (tarievenResponse.ok) {
        const tarievenResult = await tarievenResponse.json();
        if (tarievenResult.success) {
          setTarieven(tarievenResult.data || []);
        }
      }

      // Haal inkomensklassen op als organisatie een actief toeslagjaar heeft
      if (orgResult.data.actief_toeslagjaar) {
        const inkomensResponse = await fetch(`${apiUrl}/api/toeslag/${orgResult.data.actief_toeslagjaar}/inkomensklassen`);
        if (inkomensResponse.ok) {
          const inkomensResult = await inkomensResponse.json();
          if (inkomensResult.success) {
            setInkomensklassen(inkomensResult.data.inkomensklassen || []);
          }
        }
      }

    } catch (error) {
      console.error('Fout bij laden organisatiedata:', error);
      setError(error instanceof Error ? error.message : 'Kon organisatiegegevens niet laden');
    } finally {
      setLoading(false);
    }
  };

  const getGeschikteTarieven = () => {
    if (!kind.opvangvorm_id) return [];
    return tarieven.filter(t => t.opvangvorm_id === parseInt(kind.opvangvorm_id));
  };

  const mapOpvangvormNaarToeslagType = (opvangvormNaam: string): 'dagopvang' | 'bso' | 'gastouder' => {
    const naam = opvangvormNaam.toLowerCase();
    
    if (naam.includes('kdv') || naam.includes('kinderdagverblijf') || naam.includes('dagopvang')) {
      return 'dagopvang';
    } else if (naam.includes('bso') || naam.includes('buitenschoolse') || naam.includes('naschoolse')) {
      return 'bso';
    } else if (naam.includes('gastouder') || naam.includes('peuteropvang')) {
      return 'gastouder';
    } else {
      return 'dagopvang'; // Default
    }
  };

  const berekenKosten = async () => {
    if (!kind.opvangvorm_id || !kind.tariefId) {
      setError('Selecteer een opvangvorm en tarief');
      return;
    }

    if (toeslagBerekening && !geselecteerdeInkomensklasse) {
      setError('Selecteer uw inkomenscategorie voor toeslagberekening');
      return;
    }

    setBerekening(true);
    setError(null);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5007';
      const geselecteerdTarief = tarieven.find(t => t.id === parseInt(kind.tariefId));
      const geselecteerdeOpvangvorm = opvangvormen.find(o => o.id === parseInt(kind.opvangvorm_id));
      
      if (!geselecteerdTarief || !geselecteerdeOpvangvorm) {
        throw new Error('Tarief of opvangvorm niet gevonden');
      }

      let brutokosten = 0;
      let berekening_details = '';
      let uurtarief = 0;

      // Bereken brutokosten en bepaal uurtarief
      if (geselecteerdTarief.type === 'uur') {
        uurtarief = geselecteerdTarief.tarief;
        brutokosten = geselecteerdTarief.tarief * kind.uren_per_week * 4.33;
        berekening_details = `${kind.uren_per_week} uren/week × €${geselecteerdTarief.tarief}/uur × 4.33 weken/maand`;
      } else if (geselecteerdTarief.type === 'dag') {
        // Schat uurtarief op basis van 8 uur per dag
        uurtarief = geselecteerdTarief.tarief / 8;
        brutokosten = geselecteerdTarief.tarief * kind.dagen_per_week * 4.33;
        berekening_details = `${kind.dagen_per_week} dagen/week × €${geselecteerdTarief.tarief}/dag × 4.33 weken/maand`;
      } else if (geselecteerdTarief.type === 'vast_maand') {
        // Schat uurtarief op basis van totale uren per maand
        const uren_per_maand = kind.uren_per_week * 4.33;
        uurtarief = uren_per_maand > 0 ? geselecteerdTarief.tarief / uren_per_maand : 0;
        brutokosten = geselecteerdTarief.tarief;
        berekening_details = `Vast maandbedrag: €${geselecteerdTarief.tarief}`;
      } else if (geselecteerdTarief.type === 'dagen_week' && geselecteerdTarief.configuratie) {
        const config = geselecteerdTarief.configuratie;
        uurtarief = config.uurtarief;
        const uren_per_maand = kind.uren_per_week * 4.33;
        brutokosten = config.uurtarief * uren_per_maand;
        berekening_details = `${kind.uren_per_week} uren/week × €${config.uurtarief}/uur × 4.33 weken/maand`;
      } else if ((geselecteerdTarief.type === 'vrij_uren_week' || geselecteerdTarief.type === 'vrij_uren_maand') && geselecteerdTarief.configuratie) {
        const config = geselecteerdTarief.configuratie;
        uurtarief = config.uurtarief;
        const uren_per_maand = kind.uren_per_week * 4.33;
        const max_uren = geselecteerdTarief.type === 'vrij_uren_week' ? config.max_uren * 4.33 : config.max_uren;
        const gefactureerde_uren = Math.min(uren_per_maand, max_uren);
        brutokosten = config.uurtarief * gefactureerde_uren;
        berekening_details = `${Math.round(gefactureerde_uren)} uren × €${config.uurtarief}/uur (max ${Math.round(max_uren)} uren)`;
      }

      // Voor nu simuleren we de toeslag berekening
      let toeslagResultaat: ToeslagResultaat | undefined;

      if (toeslagBerekening && organisatie?.actief_toeslagjaar && geselecteerdeInkomensklasse) {
        try {
          const geselecteerdeKlasse = inkomensklassen.find(k => k.id.toString() === geselecteerdeInkomensklasse);
          if (geselecteerdeKlasse) {
            const opvangvormNaam = geselecteerdeOpvangvorm?.naam || '';
            const toeslagType = mapOpvangvormNaarToeslagType(opvangvormNaam);
            
            const toeslagInput = {
              organisatieId: organisatie.id,
              actief_toeslagjaar: organisatie.actief_toeslagjaar,
              gemeente_toeslag_percentage: organisatie.gemeente_toeslag_percentage || 0,
              gemeente_toeslag_actief: organisatie.gemeente_toeslag_actief || false,
              gezinsinkomen: (geselecteerdeKlasse.min + (geselecteerdeKlasse.max || geselecteerdeKlasse.min)) / 2, // Gebruik midden van bracket
              kinderen: [{
                opvangvorm: toeslagType,
                uren_per_maand: kind.uren_per_week * 4.33,
                uurtarief: uurtarief
              }]
            };

            const toeslagResponse = await fetch(`${apiUrl}/api/toeslag/bereken`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(toeslagInput)
            });

            if (toeslagResponse.ok) {
              const toeslagData = await toeslagResponse.json();
              if (toeslagData.success) {
                toeslagResultaat = toeslagData.data;
              }
            }
          }
        } catch (toeslagError) {
          console.error('Fout bij toeslagberekening:', toeslagError);
          // Fallback naar oude simulatie indien API faalt
          const geselecteerdeKlasse = inkomensklassen.find(k => k.id.toString() === geselecteerdeInkomensklasse);
          if (geselecteerdeKlasse) {
            const landelijkeToeslag = brutokosten * (geselecteerdeKlasse.perc_first_child / 100);
            const gemeentelijkeToeslag = organisatie.gemeente_toeslag_actief 
              ? brutokosten * ((organisatie.gemeente_toeslag_percentage || 0) / 100)
              : 0;
            const totaalToeslag = landelijkeToeslag + gemeentelijkeToeslag;
            const nettoKosten = Math.max(0, brutokosten - totaalToeslag);

            toeslagResultaat = {
              totaal_brutokosten: brutokosten,
              totaal_toeslag_landelijk: landelijkeToeslag,
              totaal_toeslag_gemeente: gemeentelijkeToeslag,
              totaal_toeslag: totaalToeslag,
              totaal_nettokosten: nettoKosten,
              kinderen: [{
                brutokosten,
                toeslag_landelijk: landelijkeToeslag,
                toeslag_gemeente: gemeentelijkeToeslag,
                toeslag_totaal: totaalToeslag,
                nettokosten: nettoKosten,
                vergoed_uurtarief: uurtarief,
                vergoed_uren: kind.uren_per_week * 4.33,
                is_eerste_kind: true
              }],
              gebruikte_toeslagtabel: {
                jaar: organisatie.actief_toeslagjaar,
                max_hourly_rates: {
                  dagopvang: 10.25,
                  bso: 9.12,
                  gastouder: 7.53
                }
              }
            };
          }
        }
      }

      setResultaat({
        brutokosten: Math.round(brutokosten * 100) / 100,
        berekening_details,
        toeslag: toeslagResultaat
      });

    } catch (error) {
      console.error('Fout bij berekening:', error);
      setError('Kon kosten niet berekenen');
    } finally {
      setBerekening(false);
    }
  };

  if (loading) {
    return (
      <Box 
        minHeight="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        bg="gray.50"
      >
        <Text>Laden...</Text>
      </Box>
    );
  }

  if (!organisatie) {
    return (
      <Box 
        minHeight="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        bg="gray.50"
      >
        <Box bg="red.50" p={4} borderRadius="md" border="1px solid" borderColor="red.200">
          <Text fontWeight="bold" color="red.800">Organisatie niet gevonden</Text>
          <Text color="red.700">De opgegeven organisatie-code is ongeldig.</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" bg="gray.50" py={8}>
      <Box maxW="4xl" mx="auto" px={4}>
        {/* Header */}
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" mb={6}>
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            💰 Kinderopvang Kostencalculator
          </Text>
          <Text color="gray.600" mb={4}>
            {organisatie.naam}
          </Text>
          <Text fontSize="sm" color="gray.500">
            Bereken uw maandelijkse kinderopvangkosten{organisatie.actief_toeslagjaar ? ' inclusief kinderopvangtoeslag' : ''}
          </Text>
        </Box>

        {error && (
          <Box bg="red.50" p={4} borderRadius="md" border="1px solid" borderColor="red.200" mb={6}>
            <Text color="red.800" fontWeight="medium">❌ {error}</Text>
          </Box>
        )}

        {/* Formulier */}
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" mb={6}>
          <VStack gap={6} align="stretch">
            <Box>
              <Text mb={2} fontWeight="medium">Opvangvorm *</Text>
              <select
                value={kind.opvangvorm_id}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setKind({ 
                    ...kind, 
                    opvangvorm_id: e.target.value,
                    tariefId: ''
                  });
                  setResultaat(null);
                  setError(null);
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Selecteer opvangvorm</option>
                {opvangvormen.map((opvangvorm) => (
                  <option key={opvangvorm.id} value={opvangvorm.id}>
                    {opvangvorm.naam}
                  </option>
                ))}
              </select>
            </Box>

            {kind.opvangvorm_id && (
              <Box>
                <Text mb={2} fontWeight="medium">Tarief *</Text>
                <select
                  value={kind.tariefId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setKind({ ...kind, tariefId: e.target.value });
                    setResultaat(null);
                    setError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Selecteer tarief</option>
                  {getGeschikteTarieven().map((tarief) => (
                    <option key={tarief.id} value={tarief.id}>
                      {tarief.naam}
                    </option>
                  ))}
                </select>
              </Box>
            )}

            <HStack gap={4}>
              <Box flex={1}>
                <Text mb={2} fontWeight="medium">Uren per week</Text>
                <Input
                  type="number"
                  value={kind.uren_per_week}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setKind({ ...kind, uren_per_week: parseInt(e.target.value) || 0 });
                    setResultaat(null);
                  }}
                  min={1}
                  max={50}
                  placeholder="32"
                />
              </Box>

              <Box flex={1}>
                <Text mb={2} fontWeight="medium">Dagen per week</Text>
                <Input
                  type="number"
                  value={kind.dagen_per_week}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setKind({ ...kind, dagen_per_week: parseInt(e.target.value) || 0 });
                    setResultaat(null);
                  }}
                  min={1}
                  max={5}
                  placeholder="4"
                />
              </Box>
            </HStack>

            {/* Kinderopvangtoeslag sectie */}
            {organisatie.actief_toeslagjaar && inkomensklassen.length > 0 && (
              <>
                <Box borderTop="1px solid" borderColor="gray.200" pt={6}>
                  <Text fontSize="lg" fontWeight="bold" mb={4}>
                    🏛️ Kinderopvangtoeslag ({organisatie.actief_toeslagjaar})
                  </Text>
                  
                  <VStack gap={4} align="stretch">
                    <Box>
                      <HStack mb={2}>
                        <input
                          type="checkbox"
                          checked={toeslagBerekening}
                          onChange={(e) => {
                            setToeslagBerekening(e.target.checked);
                            setResultaat(null);
                          }}
                        />
                        <Text fontWeight="medium">Kinderopvangtoeslag berekenen</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        Vink aan om uw netto kosten te berekenen inclusief kinderopvangtoeslag
                      </Text>
                    </Box>

                    {toeslagBerekening && (
                      <Box>
                        <Text mb={2} fontWeight="medium">Gezamenlijk bruto jaarinkomen *</Text>
                        <select
                          value={geselecteerdeInkomensklasse}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            setGeselecteerdeInkomensklasse(e.target.value);
                            setResultaat(null);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #E2E8F0',
                            borderRadius: '6px',
                            backgroundColor: 'white'
                          }}
                        >
                          <option value="">Selecteer uw inkomenscategorie</option>
                          {inkomensklassen.map((klasse) => (
                            <option key={klasse.id} value={klasse.id}>
                              {klasse.label} ({klasse.perc_first_child}% toeslag)
                            </option>
                          ))}
                        </select>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Dit is een schatting. Voor de definitieve toeslag dient u een aanvraag in bij de Belastingdienst.
                        </Text>
                      </Box>
                    )}

                    {organisatie.gemeente_toeslag_actief && (
                      <Box bg="blue.50" p={3} borderRadius="md">
                        <Text fontSize="sm" fontWeight="medium" color="blue.800">
                          💡 Gemeentelijke toeslag
                        </Text>
                        <Text fontSize="sm" color="blue.700">
                          Deze organisatie biedt een extra gemeentelijke toeslag van {organisatie.gemeente_toeslag_percentage}%
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </Box>
              </>
            )}

            <Button
              colorScheme="blue"
              onClick={berekenKosten}
              disabled={!kind.opvangvorm_id || !kind.tariefId || berekening}
              loading={berekening}
              size="lg"
              width="full"
            >
              {berekening ? 'Berekenen...' : 'Bereken kosten'}
            </Button>
          </VStack>
        </Box>

        {/* Resultaat */}
        {resultaat && (
          <Box bg="white" p={6} borderRadius="lg" shadow="sm">
            <Text fontSize="xl" fontWeight="bold" mb={4}>
              📊 Resultaat
            </Text>

            <VStack gap={4} align="stretch">
              {/* Brutokosten */}
              <Box bg="gray.50" p={4} borderRadius="md">
                <Text fontWeight="bold" fontSize="lg" color="gray.800">
                  Brutokosten per maand
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  €{resultaat.brutokosten.toFixed(2)}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {resultaat.berekening_details}
                </Text>
              </Box>

              {/* Toeslag resultaten */}
              {resultaat.toeslag && (
                <>
                  <Box borderTop="1px solid" borderColor="gray.200" pt={4} />
                  
                  {/* Landelijke toeslag */}
                  <Box bg="green.50" p={4} borderRadius="md">
                    <Text fontWeight="bold" fontSize="lg" color="green.800">
                      Kinderopvangtoeslag (landelijk)
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="green.600">
                      €{resultaat.toeslag.totaal_toeslag_landelijk.toFixed(2)}
                    </Text>
                    <Text fontSize="sm" color="green.700">
                      Gebaseerd op toeslagtabel {resultaat.toeslag.gebruikte_toeslagtabel.jaar}
                    </Text>
                  </Box>

                  {/* Gemeentelijke toeslag */}
                  {resultaat.toeslag.totaal_toeslag_gemeente > 0 && (
                    <Box bg="blue.50" p={4} borderRadius="md">
                      <Text fontWeight="bold" fontSize="lg" color="blue.800">
                        Gemeentelijke toeslag
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                        €{resultaat.toeslag.totaal_toeslag_gemeente.toFixed(2)}
                      </Text>
                      <Text fontSize="sm" color="blue.700">
                        Extra {organisatie.gemeente_toeslag_percentage}% gemeentelijke bijdrage
                      </Text>
                    </Box>
                  )}

                  {/* Netto kosten */}
                  <Box bg="purple.50" p={4} borderRadius="md" border="2px solid" borderColor="purple.200">
                    <Text fontWeight="bold" fontSize="lg" color="purple.800">
                      Uw netto kosten per maand
                    </Text>
                    <Text fontSize="3xl" fontWeight="bold" color="purple.600">
                      €{resultaat.toeslag.totaal_nettokosten.toFixed(2)}
                    </Text>
                    <Text fontSize="sm" color="purple.700">
                      Brutokosten minus kinderopvangtoeslag
                    </Text>
                  </Box>

                  {/* Overzicht */}
                  <Box bg="gray.50" p={4} borderRadius="md">
                    <Text fontWeight="bold" mb={2}>Overzicht berekening:</Text>
                    <VStack gap={1} align="stretch" fontSize="sm">
                      <HStack justifyContent="space-between">
                        <Text>Brutokosten:</Text>
                        <Text>€{resultaat.toeslag.totaal_brutokosten.toFixed(2)}</Text>
                      </HStack>
                      <HStack justifyContent="space-between">
                        <Text>Kinderopvangtoeslag:</Text>
                        <Text color="green.600">-€{resultaat.toeslag.totaal_toeslag_landelijk.toFixed(2)}</Text>
                      </HStack>
                      {resultaat.toeslag.totaal_toeslag_gemeente > 0 && (
                        <HStack justifyContent="space-between">
                          <Text>Gemeentelijke toeslag:</Text>
                          <Text color="blue.600">-€{resultaat.toeslag.totaal_toeslag_gemeente.toFixed(2)}</Text>
                        </HStack>
                      )}
                      <Box borderTop="1px solid" borderColor="gray.200" pt={1} />
                      <HStack justifyContent="space-between" fontWeight="bold">
                        <Text>Netto kosten:</Text>
                        <Text color="purple.600">€{resultaat.toeslag.totaal_nettokosten.toFixed(2)}</Text>
                      </HStack>
                    </VStack>
                  </Box>

                  <Box bg="yellow.50" p={3} borderRadius="md">
                    <Text fontSize="sm" color="yellow.800">
                      <strong>Let op:</strong> Dit is een indicatieve berekening. Voor de definitieve kinderopvangtoeslag 
                      dient u een aanvraag in bij de Belastingdienst. De werkelijke toeslag kan afwijken afhankelijk van 
                      uw specifieke situatie.
                    </Text>
                  </Box>
                </>
              )}
            </VStack>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RekentoolPage; 