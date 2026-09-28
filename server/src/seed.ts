/**
 * Populates Firestore with the same demo content the frontend's mock data
 * used to show, so a fresh clone behaves identically out of the box.
 * Run with: npm run seed
 */
import { db } from './firebase.js'
import { hashDeviceKey } from './middleware/deviceAuth.js'
import { generateDeviceKey } from './lib/ids.js'
import type { AlertRoute, DiseaseDiagnosis, Farm, Farmer, GrainLot, MandiRow, PestDiagnosis } from './types.js'

async function seed() {
  const batch = db.batch()

  const farmer: Farmer = {
    id: 'farmer-01',
    name: 'Rameshbhai Patel',
    phone: '+91 98250 00042',
    village: 'Kotda Sangani',
    district: 'Rajkot',
    initials: 'RP',
  }
  batch.set(db.collection('farmers').doc(farmer.id), farmer)

  const farms: Farm[] = [
    { id: 'farm-main', name: 'Main farm', village: 'Kotda Sangani', acres: 4, stationId: 'AS-01', crop: 'Groundnut', cropStage: 'Flowering', soilType: 'Medium black' },
    { id: 'farm-river', name: 'River plot', village: 'Jasdan', acres: 2.5, stationId: 'AS-02', crop: 'Cotton', cropStage: 'Boll formation', soilType: 'Sandy loam' },
  ]
  for (const farm of farms) batch.set(db.collection('farms').doc(farm.id), farm)

  const routing: AlertRoute[] = [
    { type: 'soilDry', sms: true, call: false },
    { type: 'animal', sms: true, call: true },
    { type: 'pest', sms: true, call: false },
    { type: 'disease', sms: true, call: false },
    { type: 'pumpOn', sms: true, call: false },
    { type: 'powerOn', sms: true, call: false },
    { type: 'grainReady', sms: true, call: false },
    { type: 'heat', sms: false, call: true },
    { type: 'batteryLow', sms: true, call: false },
    { type: 'nodeOffline', sms: false, call: false },
  ]
  batch.set(db.collection('alertRouting').doc('default'), { routes: routing })

  const diseases: DiseaseDiagnosis[] = [
    {
      id: 'early-blight',
      crop: 'Tomato',
      disease: { en: 'Early blight (Alternaria solani)', hi: 'अगेती झुलसा (अल्टरनेरिया सोलानी)', gu: 'વહેલો સુકારો (અલ્ટરનેરિયા સોલાની)' },
      confidence: 0.92,
      severity: 'warn',
      treatment: {
        en: [
          'Remove and destroy the lower infected leaves today.',
          'Spray Mancozeb 75% WP at 2.5 g per litre of water (≈ 500 g per acre).',
          'Repeat after 10 days if new spots appear.',
          'Avoid overhead irrigation; water at the base in the morning.',
        ],
        hi: [
          'आज ही नीचे की संक्रमित पत्तियाँ तोड़कर नष्ट करें।',
          'मैनकोज़ेब 75% WP, 2.5 ग्राम प्रति लीटर पानी में छिड़कें (≈ 500 ग्राम प्रति एकड़)।',
          'नए धब्बे दिखें तो 10 दिन बाद दोबारा छिड़कें।',
          'ऊपर से पानी न दें; सुबह जड़ के पास सिंचाई करें।',
        ],
        gu: [
          'આજે જ નીચેનાં રોગવાળાં પાન તોડીને નાશ કરો.',
          'મેન્કોઝેબ 75% WP, 2.5 ગ્રામ પ્રતિ લિટર પાણીમાં છાંટો (≈ 500 ગ્રામ એકર દીઠ).',
          'નવા ડાઘ દેખાય તો 10 દિવસ પછી ફરી છાંટો.',
          'ઉપરથી પાણી ન આપો; સવારે છોડના થડ પાસે પિયત કરો.',
        ],
      },
      voice: {
        en: 'Early blight found on tomato. Remove lower infected leaves and spray Mancozeb, two and a half grams per litre. Repeat after ten days.',
        hi: 'टमाटर में अगेती झुलसा रोग मिला है। नीचे की संक्रमित पत्तियाँ हटाएँ और मैनकोज़ेब ढाई ग्राम प्रति लीटर पानी में छिड़कें। दस दिन बाद दोबारा छिड़कें।',
        gu: 'ટામેટામાં વહેલો સુકારો જોવા મળ્યો છે. નીચેનાં રોગવાળાં પાન કાઢી નાખો અને મેન્કોઝેબ અઢી ગ્રામ પ્રતિ લિટર પાણીમાં છાંટો. દસ દિવસ પછી ફરી છાંટો.',
      },
    },
    {
      id: 'leaf-spot',
      crop: 'Groundnut',
      disease: { en: 'Tikka leaf spot (Cercospora)', hi: 'टिक्का पत्ती धब्बा (सर्कोस्पोरा)', gu: 'ટિક્કા પાનનાં ટપકાં (સર્કોસ્પોરા)' },
      confidence: 0.87,
      severity: 'warn',
      treatment: {
        en: ['Spray Carbendazim 12% + Mancozeb 63% WP at 2 g per litre.', 'Use 200 litres of spray solution per acre.', 'Repeat after 15 days; stop 3 weeks before harvest.'],
        hi: ['कार्बेन्डाज़िम 12% + मैनकोज़ेब 63% WP, 2 ग्राम प्रति लीटर छिड़कें।', 'प्रति एकड़ 200 लीटर घोल का उपयोग करें।', '15 दिन बाद दोबारा छिड़कें; कटाई से 3 हफ़्ते पहले बंद करें।'],
        gu: ['કાર્બેન્ડાઝીમ 12% + મેન્કોઝેબ 63% WP, 2 ગ્રામ પ્રતિ લિટર છાંટો.', 'એકર દીઠ 200 લિટર દ્રાવણ વાપરો.', '15 દિવસ પછી ફરી છાંટો; કાપણીના 3 અઠવાડિયાં પહેલાં બંધ કરો.'],
      },
      voice: {
        en: 'Tikka leaf spot found on groundnut. Spray Carbendazim plus Mancozeb, two grams per litre. Repeat after fifteen days.',
        hi: 'मूँगफली में टिक्का पत्ती धब्बा रोग मिला है। कार्बेन्डाज़िम और मैनकोज़ेब दो ग्राम प्रति लीटर छिड़कें। पंद्रह दिन बाद दोबारा छिड़कें।',
        gu: 'મગફળીમાં ટિક્કા પાનનાં ટપકાંનો રોગ જોવા મળ્યો છે. કાર્બેન્ડાઝીમ અને મેન્કોઝેબ બે ગ્રામ પ્રતિ લિટર છાંટો. પંદર દિવસ પછી ફરી છાંટો.',
      },
    },
    {
      id: 'healthy',
      crop: 'Cotton',
      disease: { en: 'Healthy leaf', hi: 'स्वस्थ पत्ती', gu: 'તંદુરસ્ત પાન' },
      confidence: 0.95,
      severity: 'ok',
      treatment: {
        en: ['No disease found. Keep monitoring every 3–4 days.'],
        hi: ['कोई रोग नहीं मिला। हर 3–4 दिन में जाँच करते रहें।'],
        gu: ['કોઈ રોગ જોવા મળ્યો નથી. દર 3–4 દિવસે તપાસ ચાલુ રાખો.'],
      },
      voice: {
        en: 'The leaf looks healthy. No spray is needed.',
        hi: 'पत्ती स्वस्थ है। किसी छिड़काव की ज़रूरत नहीं है।',
        gu: 'પાન તંદુરસ્ત છે. કોઈ છંટકાવની જરૂર નથી.',
      },
    },
  ]
  for (const d of diseases) batch.set(db.collection('diseaseReference').doc(d.id), d)

  const pests: PestDiagnosis[] = [
    {
      id: 'aphid',
      pest: { en: 'Aphids (Aphis craccivora)', hi: 'माहू (एफ़िस क्रैसिवोरा)', gu: 'મોલો-મશી (એફિસ ક્રેસીવોરા)' },
      crop: 'Groundnut',
      confidence: 0.9,
      severity: 'warn',
      dose: { product: 'Imidacloprid 17.8% SL', perAcre: { en: '40 ml', hi: '40 मिली', gu: '40 મિલિ' }, water: { en: '200 L', hi: '200 लीटर', gu: '200 લિટર' } },
      threshold: { en: 'Economic threshold: 10–15 aphids per shoot tip', hi: 'आर्थिक सीमा: प्रति टहनी सिरे पर 10–15 माहू', gu: 'આર્થિક મર્યાદા: ડૂંખ દીઠ 10–15 મોલો' },
      voice: {
        en: 'Aphids found. Spray Imidacloprid, forty millilitres in two hundred litres of water per acre.',
        hi: 'माहू कीट मिला है। इमिडाक्लोप्रिड चालीस मिलीलीटर, दो सौ लीटर पानी में प्रति एकड़ छिड़कें।',
        gu: 'મોલોમશી જીવાત જોવા મળી છે. ઇમિડાક્લોપ્રિડ ચાલીસ મિલિ, બસો લિટર પાણીમાં એકર દીઠ છાંટો.',
      },
    },
    {
      id: 'pink-bollworm',
      pest: { en: 'Pink bollworm', hi: 'गुलाबी सुंडी', gu: 'ગુલાબી ઈયળ' },
      crop: 'Cotton',
      confidence: 0.86,
      severity: 'crit',
      dose: { product: 'Emamectin benzoate 5% SG', perAcre: { en: '80 g', hi: '80 ग्राम', gu: '80 ગ્રામ' }, water: { en: '200 L', hi: '200 लीटर', gu: '200 લિટર' } },
      threshold: { en: 'Economic threshold: 8 moths per trap per night for 3 nights', hi: 'आर्थिक सीमा: लगातार 3 रात, प्रति ट्रैप प्रति रात 8 पतंगे', gu: 'આર્થિક મર્યાદા: સતત 3 રાત, ટ્રેપ દીઠ રાત્રે 8 ફૂદાં' },
      voice: {
        en: 'Pink bollworm found. Spray Emamectin benzoate, eighty grams in two hundred litres of water per acre, and install five pheromone traps.',
        hi: 'गुलाबी सुंडी मिली है। इमामेक्टिन बेंजोएट अस्सी ग्राम, दो सौ लीटर पानी में प्रति एकड़ छिड़कें और पाँच फेरोमोन ट्रैप लगाएँ।',
        gu: 'ગુલાબી ઇયળ જોવા મળી છે. એમામેક્ટિન બેન્ઝોએટ એંસી ગ્રામ, બસો લિટર પાણીમાં એકર દીઠ છાંટો અને પાંચ ફેરોમોન ટ્રેપ લગાવો.',
      },
    },
  ]
  for (const p of pests) batch.set(db.collection('pestReference').doc(p.id), p)

  const mandi: MandiRow[] = [
    { crop: 'Groundnut', mandi: 'Gondal APMC', distanceKm: 34, price: 6820, change: 3.1 },
    { crop: 'Groundnut', mandi: 'Rajkot APMC', distanceKm: 18, price: 6740, change: 1.2 },
    { crop: 'Cotton', mandi: 'Rajkot APMC', distanceKm: 18, price: 7350, change: -0.6 },
    { crop: 'Wheat', mandi: 'Rajkot APMC', distanceKm: 18, price: 2560, change: 2.4 },
    { crop: 'Wheat', mandi: 'Gondal APMC', distanceKm: 34, price: 2510, change: 0.8 },
  ]
  for (const [i, row] of mandi.entries()) batch.set(db.collection('mandiPrices').doc(`m${i}`), row)

  const grains: GrainLot[] = [
    { crop: 'Wheat', moisture: 11.6, safeMax: 12, quantityQ: 38, dryingPerDay: 0.8 },
    { crop: 'Groundnut', moisture: 10.4, safeMax: 8, quantityQ: 22, dryingPerDay: 1.2 },
  ]
  for (const [i, g] of grains.entries()) batch.set(db.collection('grainLots').doc(`g${i}`), g)

  const DAY = 24 * 60 * 60 * 1000
  const trendSeeds: { crop: string; base: number; msp: number }[] = [
    { crop: 'Groundnut', base: 6700, msp: 6377 },
    { crop: 'Cotton', base: 7300, msp: 7121 },
    { crop: 'Wheat', base: 2440, msp: 2425 },
  ]
  for (const { crop, base, msp } of trendSeeds) {
    for (let i = 0; i < 14; i++) {
      const date = new Date(Date.now() - (13 - i) * DAY).toISOString().slice(0, 10)
      const price = Math.round(base + i * (base * 0.004) + (Math.sin(i) * base) / 100)
      batch.set(db.collection('marketTrend').doc(`${crop}-${date}`), { crop, date, price, msp })
    }
  }

  await batch.commit()

  // Stations + device keys go in a second pass so we can print the raw keys once.
  const stationSeeds = [
    { id: 'AS-01', farmId: 'farm-main' },
    { id: 'AS-02', farmId: 'farm-river' },
  ]
  console.log('\nDevice keys (save these – shown only once, flash to the matching ESP32):')
  for (const s of stationSeeds) {
    const rawKey = generateDeviceKey()
    await db
      .collection('stations')
      .doc(s.id)
      .set({ farmId: s.farmId, apiKeyHash: hashDeviceKey(rawKey), batteryPct: 80, solarCharging: true, signalBars: 3, online: false, lastSeenAt: null })
    console.log(`  ${s.id} (farm ${s.farmId}): ${rawKey}`)
  }

  console.log('\nSeeded farmer, 2 farms, alert routing, 3 disease refs, 2 pest refs, mandi/trend/grain data.')
  console.log('Post a reading with: X-Device-Key: <one of the keys above>, to POST /api/stations/AS-01/readings')
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
