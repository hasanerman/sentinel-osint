const express = require('express');
const cors = require('cors');
const axios = require('axios');
const morgan = require('morgan');
const satellite = require('satellite.js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const OVERPASS_APIS = [
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
    'https://overpass-api.de/api/interpreter'
];
let opIndex = 0;
const getOverpassApi = () => OVERPASS_APIS[(opIndex++) % OVERPASS_APIS.length];

const fetchOverpass = async (query) => {
    let retries = 3;
    while(retries > 0) {
        try {
            const api = getOverpassApi();
            const res = await axios.post(api, `data=${encodeURIComponent(query)}`, { timeout: 45000 });
            return res.data;
        } catch (error) {
            retries--;
            if(retries === 0) throw error;
        }
    }
};
const OPENSKY_API = 'https://opensky-network.org/api/states/all';

const vesselsCache = {};
const basesCache = {};
const infraCache = {};
const cablesCache = {};
const globalCablesCache = {};

const getEnglishName = async (inputName) => {
    try {
        const res = await axios.get(`https://restcountries.com/v3.1/translation/${encodeURIComponent(inputName)}`);
        if (res.data && res.data.length > 0) { return res.data[0].name.common; }
    } catch (err) { return inputName; }
    return inputName;
}

const isMilitaryAircraft = (state) => {
    if (state[17] === 20) return true;

    const callsign = (state[1] || '').trim().toUpperCase();
    

    const milPrefixes = [
        'RCH', 'SAM', 'CFC', 'ASY', 'AME', 'REACH', 'DUKE', 'BOLO', 
        'NAVY', 'TUAF', 'SHG', 'DZK', 'JND', 'SOLOTURK', 'NATO', 'AF'
    ];
    
    if (callsign && milPrefixes.some(p => callsign.startsWith(p))) {
        return true;
    }
    
    return false;
};

app.get('/api/bases', async (req, res) => {
    try {
        const { country } = req.query;
        if (!country) return res.status(400).json({ error: "Country parameter is required" });
        
        if (basesCache[country.toLowerCase()]) {
            console.log(`Bases Cache Hit: ${country}`);
            return res.json(basesCache[country.toLowerCase()]);
        }

        const searchCountry = await getEnglishName(country);
        const query = `
            [out:json][timeout:120];
            area["name:en"="${searchCountry}"]->.searchArea;
            (
              way["landuse"="military"](area.searchArea);
              node["military"](area.searchArea);
              way["military"](area.searchArea);
              node["man_made"="radome"](area.searchArea);
              way["man_made"="radome"](area.searchArea);
              way["plant:source"="nuclear"](area.searchArea);
            );
            out center;
        `;
        const data = await fetchOverpass(query);
        let features = data.elements.map(el => {
            const lat = el.lat || (el.center && el.center.lat);
            const lon = el.lon || (el.center && el.center.lon);
            
            let bestName = el.tags['name:en'] || el.tags['int_name'] || el.tags.name || '';
            let type = el.tags.military || el.tags.landuse || 'Restricted Area';
            
            if (el.tags.man_made === 'radome') {
                bestName = bestName || 'Early Warning Radar / Radome';
                type = 'Strategic Radar';
            } else if (el.tags['plant:source'] === 'nuclear') {
                bestName = bestName || 'Nuclear Reactor / Power Plant';
                type = 'Nuclear Facility';
            } else {
                bestName = bestName || 'Classified Military Site';
            }

            return { id: el.id, type, lat, lon, name: bestName, tags: el.tags || {} };
        }).filter(el => el.lat && el.lon);
        
        const result = { searchCountry, originalCount: features.length, bases: features };
        basesCache[country.toLowerCase()] = result;
        basesCache[searchCountry.toLowerCase()] = result;
        res.json(result);
    } catch (error) {
        console.error("Bases Error:", error.message);
        res.status(502).json({ error: 'Overpass server busy or territory too large.' });
    }
});

app.get('/api/radar/infra', async (req, res) => {
    try {
        const { country } = req.query;
        if (!country) return res.status(400).json({ error: "Country parameter is required" });
        
        if (infraCache[country.toLowerCase()]) {
            console.log(`Infra Cache Hit: ${country}`);
            return res.json(infraCache[country.toLowerCase()]);
        }

        const searchCountry = await getEnglishName(country);
        const query = `
            [out:json][timeout:180];
            area["name:en"="${searchCountry}"]->.searchArea;
            (
              way["power"="plant"](area.searchArea);
              node["power"="plant"](area.searchArea);
              way["industrial"="oil_refinery"](area.searchArea);
              node["telecom"="data_center"](area.searchArea);
              way["telecom"="data_center"](area.searchArea);
            );
            out center;
        `;
        const data = await fetchOverpass(query);
        let features = data.elements.map(el => {
            const lat = el.lat || (el.center && el.center.lat);
            const lng = el.lon || (el.center && el.center.lon);
            const tags = el.tags || {};
            
            let bestName = tags['name:en'] || tags['int_name'] || tags.name || '';
            let infraType = 'Strategic Infrastructure';
            
            if (tags.power === 'plant') infraType = (tags['plant:source'] ? `${tags['plant:source'].toUpperCase()} Power Plant` : 'Power Generation Plant');
            else if (tags.industrial === 'oil_refinery') infraType = 'Petrochemical Refinery';
            else if (tags.telecom === 'data_center') infraType = 'Strategic Data Center';
            
            bestName = bestName || `Unnamed ${infraType}`;
            
            return { id: `infra-${el.id}`, type: "infrastructure", infraType, lat, lng, name: bestName };
        }).filter(el => el.lat && el.lng);
        
        const result = { searchCountry, count: features.length, infra: features };
        infraCache[country.toLowerCase()] = result;
        infraCache[searchCountry.toLowerCase()] = result;
        res.json(result);
    } catch (error) {
        console.error("Infra Error:", error.message);
        res.json({ count: 0, infra: [] });
    }
});

app.get('/api/radar/cables', async (req, res) => {
    try {
        const { country } = req.query;
        if (!country) return res.status(400).json({ error: "Country parameter is required" });
        
        if (cablesCache[country.toLowerCase()]) {
            return res.json(cablesCache[country.toLowerCase()]);
        }

        const searchCountry = await getEnglishName(country);
        const query = `
            [out:json][timeout:180];
            area["name:en"="${searchCountry}"]->.searchArea;
            (
              way["telecom"="line"](area.searchArea);
              way["telecom"="cable"](area.searchArea);
              node["telecom"="exchange"](area.searchArea);
              way["communication"="line"](area.searchArea);
              way["man_made"="submarine_cable"](area.searchArea);
              node["telecom"="cable_landing"](area.searchArea);
            );
            out center;
        `;
        const data = await fetchOverpass(query);
        let features = data.elements.map(el => {
            const lat = el.lat || (el.center && el.center.lat);
            const lng = el.lon || (el.center && el.center.lon);
            const tags = el.tags || {};
            
            let bestName = tags['name:en'] || tags['name'] || 'Classified Fiber Link';
            let cableType = 'Strategic Data Cable';
            if (tags.man_made === 'submarine_cable' || tags.telecom === 'cable_landing') {
                cableType = 'Submarine Cable Hub';
            } else if (tags.telecom === 'exchange') {
                cableType = 'Telecom Exchange';
            }
            
            return { id: `cable-${el.id}`, type: "cable", cableType, lat, lng, name: bestName };
        }).filter(el => el.lat && el.lng);
        
        const result = { searchCountry, count: features.length, cables: features };
        cablesCache[country.toLowerCase()] = result;
        cablesCache[searchCountry.toLowerCase()] = result;
        res.json(result);
    } catch (error) {
        res.json({ count: 0, cables: [] });
    }
});

app.get('/api/radar/global-cables', async (req, res) => {
    try {
        if (globalCablesCache['global']) {
            return res.json(globalCablesCache['global']);
        }

        const query = `
            [out:json][timeout:180];
            (
              way["man_made"="submarine_cable"];
            );
            out center;
        `;
        const data = await fetchOverpass(query);
        let features = data.elements.map(el => {
            const lat = el.lat || (el.center && el.center.lat);
            const lng = el.lon || (el.center && el.center.lon);
            const tags = el.tags || {};
            
            let bestName = tags['name:en'] || tags['name'] || 'Classified Fiber Link';
            
            return { id: `gcable-${el.id}`, type: "gcable", cableType: 'Global Submarine Cable', lat, lng, name: bestName };
        }).filter(el => el.lat && el.lng);
        
        const result = { searchCountry: 'Global', count: features.length, globalCables: features };
        globalCablesCache['global'] = result;
        res.json(result);
    } catch (error) {
        res.json({ count: 0, globalCables: [] });
    }
});

app.get('/api/radar/aircraft', async (req, res) => {
    try {
        const response = await axios.get(OPENSKY_API);
        const states = (response.data.states || []);
        
        const aircraft = states.map(s => ({
            icao24: s[0],
            callsign: s[1]?.trim() || s[0].toUpperCase(),
            origin_country: s[2],
            lng: s[5],
            lat: s[6],
            altitude: s[7],
            velocity: s[9],
            heading: s[10],
            is_mil: isMilitaryAircraft(s)
        })).filter(a => a.lat && a.lng);
        
        res.json({ count: aircraft.length, aircraft });
    } catch (error) {
        console.error("OpenSky Error:", error.message);
        res.status(503).json({ error: 'OpenSky Unavailable' });
    }
});

app.get('/api/radar/vessels', async (req, res) => {
    const globalChokePoints = [
        { id: 's1', name: 'Strait of Hormuz', type: 'Strategic Choke Point', lat: 26.56, lng: 56.25, is_mil: true },
        { id: 's2', name: 'Suez Canal', type: 'Strategic Choke Point', lat: 30.58, lng: 32.33, is_mil: true },
        { id: 's3', name: 'Panama Canal', type: 'Strategic Choke Point', lat: 9.08, lng: -79.68, is_mil: false },
        { id: 's4', name: 'Strait of Malacca', type: 'Strategic Choke Point', lat: 1.43, lng: 102.89, is_mil: true },
        { id: 's5', name: 'Strait of Gibraltar', type: 'Strategic Choke Point', lat: 35.95, lng: -5.48, is_mil: true },
        { id: 's6', name: 'Bosphorus', type: 'Strategic Choke Point', lat: 41.13, lng: 29.07, is_mil: true },
        { id: 's7', name: 'Dardanelles', type: 'Strategic Choke Point', lat: 40.20, lng: 26.40, is_mil: true },
        { id: 's8', name: 'Bab-el-Mandeb', type: 'Strategic Choke Point', lat: 12.58, lng: 43.33, is_mil: true },
    ];

    try {
        const { country } = req.query;
        if (country && vesselsCache[country.toLowerCase()]) {
            console.log(`Vessels Cache Hit: ${country}`);
            return res.json(vesselsCache[country.toLowerCase()]);
        }

        let infra = [];
        if (country && country !== 'Global') {
            const searchCountry = await getEnglishName(country);
            const query = `
                [out:json][timeout:120];
                area["name:en"="${searchCountry}"]->.searchArea;
                (
                  nwr["industrial"="shipyard"](area.searchArea);
                  nwr["harbour"="seaport"](area.searchArea);
                  nwr["military"="naval_base"](area.searchArea);
                );
                out center;
            `;
            const data = await fetchOverpass(query);
            infra = data.elements.map(el => {
                const tags = el.tags || {};
                let type = 'Maritime Facility';
                if (tags.industrial === 'shipyard') type = 'Shipyard';
                else if (tags.military === 'naval_base') type = 'Naval Base';
                else if (tags.harbour === 'seaport') type = 'Major Seaport';

                return {
                    id: el.id,
                    name: tags.name || `Unnamed ${type}`,
                    type: type,
                    lat: el.lat || (el.center && el.center.lat),
                    lng: el.lon || (el.center && el.center.lon),
                    is_mil: tags.military === 'yes' || tags.military?.includes('naval') || tags.name?.toLowerCase().includes('naval') || false,
                };
            }).filter(v => v.lat && v.lng);
        }
        
        const result = { count: globalChokePoints.length + infra.length, vessels: [...globalChokePoints, ...infra] };
        if (country) vesselsCache[country.toLowerCase()] = result;
        res.json(result);
    } catch (error) {
        console.warn("Vessels Error, falling back to global points:", error.message);
        res.json({ count: globalChokePoints.length, vessels: globalChokePoints, warn: 'Regional data unavailable' });
    }
});

let satelliteCache = { time: 0, data: [] };
app.get('/api/radar/satellites', async (req, res) => {
    try {
        const now = Date.now();
        if (now - satelliteCache.time > 600000 || satelliteCache.data.length === 0) {
            const milRes = await axios.get('https://celestrak.org/NORAD/elements/gp.php?GROUP=military&FORMAT=tle');
            const earthRes = await axios.get('https://celestrak.org/NORAD/elements/gp.php?GROUP=earth-resources&FORMAT=tle');
            
            const rawData = milRes.data + '\n' + earthRes.data;
            const lines = rawData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            
            let tles = [];
            for (let i = 0; i < lines.length; i += 3) {
                if (lines[i] && lines[i+1] && lines[i+2]) {
                    tles.push({ name: lines[i], dle1: lines[i+1], dle2: lines[i+2] });
                }
            }
            satelliteCache.data = tles;
            satelliteCache.time = now;
        }

        const date = new Date();
        const activeSats = satelliteCache.data.map(sat => {
            const satrec = satellite.twoline2satrec(sat.dle1, sat.dle2);
            const positionAndVelocity = satellite.propagate(satrec, date);
            if (!positionAndVelocity.position || isNaN(positionAndVelocity.position.x)) return null;

            const positionGd = satellite.eciToGeodetic(positionAndVelocity.position, satellite.gstime(date));
            const lng = satellite.degreesLong(positionGd.longitude);
            const lat = satellite.degreesLat(positionGd.latitude);
            const height = positionGd.height;

            return { id: sat.name, name: sat.name, lat, lng, alt: height };
        }).filter(s => s !== null && s.alt > 100);

        res.json({ count: activeSats.length, satellites: activeSats });
    } catch (e) {
        res.json({ count: 0, satellites: [] });
    }
});

app.get('/api/radar/seismic', async (req, res) => {
    try {
        const response = await axios.get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
        const eq = response.data.features.map(f => ({
            id: f.id,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            mag: f.properties.mag,
            place: f.properties.place,
            time: f.properties.time
        }));
        res.json({ count: eq.length, seismic: eq });
    } catch (e) {
        res.json({ count: 0, seismic: [] });
    }
});

app.get('/api/radar/wiki', async (req, res) => {
    const { country } = req.query;
    try {
        let intel = [];
        if (country) {
            const targetCountryLower = country.toLowerCase();
            let bases = basesCache[targetCountryLower]?.bases || [];
            
            if (bases.length > 0) {
                const topBases = bases.slice(0, 3);
                for (const b of topBases) {
                    const wikiRes = await axios.get(
                        `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${b.lat}|${b.lon}&gsradius=10000&gslimit=2&format=json`,
                        { headers: { 'User-Agent': 'HiddenBaseScannerBot/1.0' } }
                    );
                    const pages = wikiRes.data?.query?.geosearch || [];
                    for (const p of pages) {
                        intel.push({
                            id: `wiki-${p.pageid}`,
                            baseName: b.name,
                            title: p.title,
                            lat: p.lat,
                            lng: p.lon,
                            url: `https://en.wikipedia.org/?curid=${p.pageid}`
                        });
                    }
                }
            }
        }
        res.json({ count: intel.length, intel });
    } catch (e) {
        res.json({ count: 0, intel: [] });
    }
});

app.get('/api/aircraft-photo/:hex', async (req, res) => {
    try {
        const { hex } = req.params;
        const response = await axios.get(`https://api.planespotters.net/pub/photos/hex/${hex}`);
        if (response.data.photos && response.data.photos.length > 0) {
            const topPhoto = response.data.photos[0];
            res.json({ 
                photo: topPhoto.thumbnail_large.src,
                model: topPhoto.aircraft_type || 'Unknown Model',
                airline: topPhoto.airline || 'Private/Unknown'
            });
        } else {
            res.json({ photo: null, model: 'Classified/Unknown', airline: 'Unknown' });
        }
    } catch (error) {
        res.json({ photo: null, model: 'Fetch Error', airline: 'N/A' });
    }
});

const PORT = 5000;
app.listen(PORT, () => { console.log(`Server listening on port ${PORT}`); });
