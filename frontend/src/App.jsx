import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Loader2, ChevronDown, ChevronUp, Crosshair } from 'lucide-react';
import RadarMap from './components/RadarMap';

function App() {
  const [country, setCountry] = useState('Israel');
  const [data, setData] = useState({ bases: [], searchCountry: '', originalCount: 0 });
  const [radar, setRadar] = useState({ aircraft: [], vessels: [] });
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let intv;
    if (loading) intv = setInterval(() => setElapsed(prev => prev + 1), 1000);
    else setElapsed(0);
    return () => clearInterval(intv);
  }, [loading]);

  const [showPlanes, setShowPlanes] = useState(false);
  const [showShips, setShowShips] = useState(false);
  const [militaryOnly, setMilitaryOnly] = useState(false);

  const [bounds, setBounds] = useState(null);
  const [lastRadarFetch, setLastRadarFetch] = useState(0);

  const [osint, setOsint] = useState({ satellites: [], seismic: [], wiki: [], infra: [] });
  const [showThermal, setShowThermal] = useState(false);
  const [showSatellites, setShowSatellites] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showSeismic, setShowSeismic] = useState(false);
  const [showWiki, setShowWiki] = useState(false);
  const [showInfra, setShowInfra] = useState(false);
  const [showCables, setShowCables] = useState(false);
  const [showGlobalCables, setShowGlobalCables] = useState(false);
  const [showBases, setShowBases] = useState(true);

  const [measureMode, setMeasureMode] = useState(false);
  const [machSpeed, setMachSpeed] = useState(1);

  const [radarExpanded, setRadarExpanded] = useState(true);
  const [osintExpanded, setOsintExpanded] = useState(false);

  useEffect(() => {
    let interval;
    if (showPlanes || showShips || showSatellites || showSeismic || showInfra || showCables || showGlobalCables) {
      const activeCountry = data.searchCountry || country || 'Global';
      fetchRadar(activeCountry);
      interval = setInterval(() => fetchRadar(activeCountry), 30000);
    }
    return () => clearInterval(interval);
  }, [showPlanes, showShips, showSatellites, showSeismic, showInfra, showCables, showGlobalCables, data.searchCountry]);

  useEffect(() => {
    const fetchWiki = async () => {
      if (showWiki && data.searchCountry) {
        try {
          const res = await axios.get(`http://localhost:5000/api/radar/wiki?country=${encodeURIComponent(data.searchCountry)}`);
          setOsint(prev => ({ ...prev, wiki: res.data.intel || [] }));
        } catch (err) { }
      } else {
        setOsint(prev => ({ ...prev, wiki: [] }));
      }
    };
    fetchWiki();
  }, [showWiki, data.searchCountry]);


  const scanArea = async () => {
    if (!country) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`http://localhost:5000/api/bases?country=${encodeURIComponent(country)}`);
      setData({
          bases: res.data.bases,
          searchCountry: res.data.searchCountry,
          originalCount: res.data.originalCount
      });
      
      await fetchRadar(res.data.searchCountry, true);
    } catch (err) {
        if(err.response) {
            setError(err.response.data.error || 'Data Not Found.');
        } else {
            setError('Server connection error.');
        }
    } finally {
      setLoading(false);
    }
  };

  const fetchRadar = async (searchCountry, forced = false) => {
    const now = Date.now();
    if (!forced && now - lastRadarFetch < 10000) return;
    setLastRadarFetch(now);

    const targetCountry = searchCountry || data.searchCountry || 'Global';
    
    if (showPlanes) {
      try {
        const res = await axios.get('http://localhost:5000/api/radar/aircraft');
        setRadar(prev => ({ ...prev, aircraft: res.data.aircraft || [] }));
      } catch (err) {
        console.warn("Aircraft Intel Unavailable");
      }
    } else {
      setRadar(prev => ({ ...prev, aircraft: [] }));
    }

    if (showShips) {
      try {
        const res = await axios.get(`http://localhost:5000/api/radar/vessels?country=${encodeURIComponent(targetCountry)}`);
        setRadar(prev => ({ ...prev, vessels: res.data.vessels || [] }));
      } catch (err) {
        console.warn("Maritime Intel Unavailable");
      }
    } else {
      setRadar(prev => ({ ...prev, vessels: [] }));
    }

    if (showSatellites) {
      try {
        const res = await axios.get('http://localhost:5000/api/radar/satellites');
        setOsint(prev => ({ ...prev, satellites: res.data.satellites || [] }));
      } catch (err) { }
    } else {
      setOsint(prev => ({ ...prev, satellites: [] }));
    }

    if (showSeismic) {
      try {
        const res = await axios.get('http://localhost:5000/api/radar/seismic');
        setOsint(prev => ({ ...prev, seismic: res.data.seismic || [] }));
      } catch (err) { }
    } else {
      setOsint(prev => ({ ...prev, seismic: [] }));
    }

    if (showInfra) {
      try {
        const res = await axios.get(`http://localhost:5000/api/radar/infra?country=${encodeURIComponent(targetCountry)}`);
        setOsint(prev => ({ ...prev, infra: res.data.infra || [] }));
      } catch (err) { }
    } else {
      setOsint(prev => ({ ...prev, infra: [] }));
    }

    if (showCables) {
      try {
        const res = await axios.get(`http://localhost:5000/api/radar/cables?country=${encodeURIComponent(targetCountry)}`);
        setOsint(prev => ({ ...prev, cables: res.data.cables || [] }));
      } catch (err) { }
    } else {
      setOsint(prev => ({ ...prev, cables: [] }));
    }

    if (showGlobalCables) {
      try {
        const res = await axios.get('http://localhost:5000/api/radar/global-cables');
        setOsint(prev => ({ ...prev, globalCables: res.data.globalCables || [] }));
      } catch (err) { }
    } else {
      setOsint(prev => ({ ...prev, globalCables: [] }));
    }
  };

  return (
    <div className="layout-container">
      <div className="map-layer">
        <RadarMap 
          bases={showBases ? data.bases : []} 
          aircraft={showPlanes ? radar.aircraft : []} 
          vessels={showShips ? radar.vessels : []}
          satellites={showSatellites ? osint.satellites : []}
          seismic={showSeismic ? osint.seismic : []}
          wiki={showWiki ? osint.wiki : []}
          infra={showInfra ? osint.infra : []}
          cables={showCables ? osint.cables : []}
          globalCables={showGlobalCables ? osint.globalCables : []}
          militaryOnly={militaryOnly}
          showThermal={showThermal}
          showWeather={showWeather}
          measureMode={measureMode}
          machSpeed={machSpeed}
          onBoundsChange={setBounds}
        />
      </div>

      <div className="control-panel">
        <div className="header-brand">
          <h1>SENTINEL <span>OSINT</span></h1>
          <p className="subtitle">Global Military Intelligence & Asset Tracking</p>
        </div>

        <div className="form-group">
          <label>Target Country / Region</label>
          <div className="flex-input">
            <input 
              type="text" 
              value={country} 
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Russia, Israel"
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && scanArea()}
            />
            <button onClick={scanArea} disabled={loading} className="btn-search">
              {loading ? <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Loader2 className="spinning" size={16} /> {elapsed}s</span> : <Search size={18} />}
            </button>
          </div>
        </div>

        <div className="filter-section">
          <div className="section-header" onClick={() => setRadarExpanded(!radarExpanded)}>
            <h3>RADAR CONTROLS</h3>
            {radarExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {radarExpanded && (
            <>
              <div className="toggle-grid">
                <div className={`tag ${showBases ? 'active' : ''}`} onClick={() => setShowBases(!showBases)}>
                  {showBases ? 'MILITARY BASES' : 'BASES OFF'}
                </div>
                <div className={`tag ${showPlanes ? 'active' : ''}`} onClick={() => setShowPlanes(!showPlanes)}>
                  {showPlanes ? 'TRACKING PLANES' : 'PLANES OFF'}
                </div>
                <div className={`tag ${showShips ? 'active' : ''}`} onClick={() => setShowShips(!showShips)}>
                  {showShips ? 'PORTS & SHIPYARDS' : 'PORTS OFF'}
                </div>
                <div className={`tag mil-tag ${militaryOnly ? 'active' : ''}`} onClick={() => setMilitaryOnly(!militaryOnly)}>
                  {militaryOnly ? 'MILITARY ONLY' : 'ALL ASSETS'}
                </div>
              </div>
              
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div 
                  className={`tag ${measureMode ? 'mil-tag active' : ''}`} 
                  onClick={() => setMeasureMode(!measureMode)}
                  style={{ flex: 1, display: 'flex', gap: '6px' }}
                >
                  <Crosshair size={14} /> {measureMode ? 'MEASURE ON' : 'TACTICAL RULER'}
                </div>
                {measureMode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f1f5f9', padding: '6px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>MACH {machSpeed}</span>
                    <input type="range" min="1" max="5" value={machSpeed} onChange={(e) => setMachSpeed(Number(e.target.value))} style={{ width: '60px' }} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="filter-section">
          <div className="section-header" onClick={() => setOsintExpanded(!osintExpanded)}>
            <h3>OSINT INTELLIGENCE</h3>
            {osintExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {osintExpanded && (
            <div className="toggle-grid">
              <div className={`tag ${showThermal ? 'active' : ''}`} onClick={() => setShowThermal(!showThermal)}>
                {showThermal ? 'NASA THERMAL' : 'THERMAL OFF'}
              </div>
              <div className={`tag ${showWeather ? 'active' : ''}`} onClick={() => setShowWeather(!showWeather)}>
                {showWeather ? 'LIVE WEATHER' : 'WEATHER OFF'}
              </div>
              <div className={`tag ${showSatellites ? 'active' : ''}`} onClick={() => setShowSatellites(!showSatellites)}>
                {showSatellites ? 'SPY SATELLITES' : 'SATELLITES OFF'}
              </div>
              <div className={`tag ${showSeismic ? 'active' : ''}`} onClick={() => setShowSeismic(!showSeismic)}>
                {showSeismic ? 'SEISMIC RADAR' : 'SEISMIC OFF'}
              </div>
              <div className={`tag ${showWiki ? 'active' : ''}`} onClick={() => setShowWiki(!showWiki)}>
                {showWiki ? 'LOCAL INTEL (WIKI)' : 'WIKI OFF'}
              </div>
              <div className={`tag ${showInfra ? 'active' : ''}`} onClick={() => setShowInfra(!showInfra)}>
                {showInfra ? 'ENERGY/POWER GRID' : 'POWER INFRA OFF'}
              </div>
              <div className={`tag ${showCables ? 'active' : ''}`} onClick={() => setShowCables(!showCables)}>
                {showCables ? 'NATIONAL NETWORKS' : 'LOCAL NETWORKS OFF'}
              </div>
              <div className={`tag ${showGlobalCables ? 'active' : ''}`} onClick={() => setShowGlobalCables(!showGlobalCables)}>
                {showGlobalCables ? 'GLOBAL SUBMARINE CABLES' : 'GLOBAL CABLES OFF'}
              </div>
            </div>
          )}
        </div>

        {error && <div className="alert-error">{error}</div>}

        {data.searchCountry && (
          <div className="results-info">
            <div className="info-item">
              <span>Region Queried:</span>
              <strong>{data.searchCountry}</strong>
            </div>
            <div className="info-item">
              <span>Detected Complexes:</span>
              <strong>{data.bases.length} Bases</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
