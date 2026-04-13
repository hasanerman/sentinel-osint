const express = require('express');
const cors = require('cors');
const axios = require('axios');
const morgan = require('morgan');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

const getEnglishName = async (inputName) => {
    try {
        const res = await axios.get(`https://restcountries.com/v3.1/translation/${encodeURIComponent(inputName)}`);
        if (res.data && res.data.length > 0) { return res.data[0].name.common; }
    } catch (err) { return inputName; }
    return inputName;
}

app.get('/api/bases', async (req, res) => {
    try {
        const { country } = req.query;
        if (!country) return res.status(400).json({ error: "Country parameter is required" });

        const searchCountry = await getEnglishName(country);

        // search için yeni havaalanı üs vesaire eklenecek olursa asagıya query ye ekle | if new airport base etc. add to query below

        const query = `
            [out:json][timeout:60];
            area["name:en"="${searchCountry}"]->.searchArea;
            (
              node["landuse"="military"](area.searchArea);
              way["landuse"="military"](area.searchArea);
              relation["landuse"="military"](area.searchArea);
              node["military"](area.searchArea);
              way["military"](area.searchArea);
              relation["military"](area.searchArea);
            );
            out center;
        `;

        const response = await axios.post(OVERPASS_API, `data=${encodeURIComponent(query)}`);

        // alanlardan gelen veriyi kontrol et lat----lon yok kontrol et  | check data from area lat----lon not found check

        let features = response.data.elements.map(el => {
            const lat = el.lat || (el.center && el.center.lat);
            const lon = el.lon || (el.center && el.center.lon);
            const bestName = el.tags['name:en'] || el.tags['int_name'] || el.tags.name || null;

            return { id: el.id, type: el.type, lat, lon, name: bestName, tags: el.tags || {} };
        }).filter(el => el.lat && el.lon);

        res.json({ searchCountry, originalCount: features.length, bases: features });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Overpass API Error during fetching coordinates.' });
    }
});

const PORT = 5000;
app.listen(PORT, () => { console.log(`Server listening on port ${PORT}`); });
