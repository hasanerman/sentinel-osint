import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, WMSTileLayer } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import WarRuler from './WarRuler';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const targetIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const planeIcon = (heading, isMil) => L.divIcon({
    html: `
    <div style="transform: rotate(${heading || 0}deg); color: ${isMil ? '#ef4444' : '#3b82f6'};">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
    </div>`,
    className: 'plane-marker-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const shipIcon = (isMil) => L.divIcon({
    html: `
    <div style="color: ${isMil ? '#ef4444' : '#10b981'};">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4H2v16z"/>
        </svg>
    </div>`,
    className: 'ship-marker-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

const createBaseClusterIcon = (cluster) => {
    return new L.DivIcon({
        html: `<div class="radar-cluster base-cluster"><span>${cluster.getChildCount()}</span></div>`,
        className: 'custom-marker-cluster',
        iconSize: L.point(40, 40, true),
    });
};

const createAircraftClusterIcon = (cluster) => {
    return new L.DivIcon({
        html: `<div class="radar-cluster aircraft-cluster"><span>${cluster.getChildCount()}</span></div>`,
        className: 'custom-marker-cluster',
        iconSize: L.point(40, 40, true),
    });
};

const satelliteIcon = new L.DivIcon({
    html: `<div style="color: #a855f7; display: flex; align-items: center; justify-content: center; background: #000; border-radius: 50%; padding: 4px; box-shadow: 0 0 10px #a855f7;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><path d="M13 2v7h7"></path></svg>
           </div>`,
    className: 'custom-sat-marker', iconSize: [24,24], iconAnchor: [12,12]
});

const seismicIcon = (mag) => new L.DivIcon({
    html: `<div style="width: ${10 + mag*3}px; height: ${10 + mag*3}px; background: rgba(239, 68, 68, 0.4); border-radius: 50%; border: 2px solid #dc2626;"></div>`,
    className: 'custom-seismic-marker', iconSize: [20,20], iconAnchor: [10,10]
});

const wikiIcon = new L.DivIcon({
    html: `<div style="color: #fcd34d; background: #1f2937; border: 1px solid #fcd34d; border-radius: 50%; padding: 4px; box-shadow: 0 0 8px #fcd34d;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
           </div>`,
    className: 'custom-wiki-marker', iconSize: [24,24], iconAnchor: [12,12]
});

const infraIcon = new L.DivIcon({
    html: `<div style="color: #06b6d4; background: #000; border: 1px solid #06b6d4; border-radius: 4px; padding: 3px; box-shadow: 0 0 10px #06b6d4;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
           </div>`,
    className: 'custom-infra-marker', iconSize: [24,24], iconAnchor: [12,12]
});

const cableIcon = new L.DivIcon({
    html: `<div style="color: #10b981; background: #1f2937; border-radius: 50%; padding: 4px; box-shadow: 0 0 10px #10b981; border: 1px solid #059669;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4"></path><path d="M20 12v8"></path><path d="M4 12v8"></path><circle cx="6" cy="18" r="2"></circle><circle cx="18" cy="18" r="2"></circle></svg>
           </div>`,
    className: 'custom-cable-marker', iconSize: [26,26], iconAnchor: [13,13]
});


const MapEvents = ({ onBoundsChange }) => {
    const map = useMap();
    useEffect(() => {
        const handleMove = () => {
            const b = map.getBounds();
            onBoundsChange({
                lamin: b.getSouth(),
                lomin: b.getWest(),
                lamax: b.getNorth(),
                lomax: b.getEast()
            });
        };
        map.on('moveend', handleMove);
        // Initial report
        handleMove();
        return () => map.off('moveend', handleMove);
    }, [map, onBoundsChange]);
    return null;
};

const MapBounds = ({ bases }) => {
    const map = useMap();
    useEffect(() => {
        if (bases && bases.length > 0) {
            const latsAndLons = bases.map(b => [b.lat, b.lon]);
            const bounds = L.latLngBounds(latsAndLons);
            map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
        }
    }, [bases, map]);
    return null;
};

const AircraftPopup = ({ plane }) => {
    const [meta, setMeta] = useState({ photo: null, model: 'Scanning...', airline: '...' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/aircraft-photo/${plane.icao24}`);
                setMeta(res.data);
            } catch (e) {
                setMeta({ photo: null, model: 'Not Found', airline: 'Unknown' });
            } finally {
                setLoading(false);
            }
        };
        fetchMeta();
    }, [plane.icao24]);

    return (
        <div className="radar-card">
            <div className="aircraft-photo-container">
                {loading ? (
                    <div className="photo-placeholder"><Loader2 className="spinning" size={16} /> Fetching Intel...</div>
                ) : meta.photo ? (
                    <img src={meta.photo} alt={plane.callsign} className="aircraft-photo" />
                ) : (
                    <div className="photo-placeholder">No Visual Available</div>
                )}
            </div>
            <h4 style={{ color: plane.is_mil ? '#ef4444' : '#3b82f6' }}>{plane.callsign}</h4>
            <div className="meta-grid">
                <span>Model: {meta.model}</span>
                <span>Owner: {meta.airline}</span>
                <span>ICAO: {plane.icao24.toUpperCase()}</span>
                <span>Alt: {Math.round(plane.altitude)}m</span>
                <span>Vel: {Math.round(plane.velocity)}m/s</span>
                <span>Origin: {plane.origin_country}</span>
            </div>
            {plane.is_mil && <span className="mil-badge">ACTUAL MILITARY ASSET</span>}
        </div>
    );
};

const RadarMap = ({ bases = [], aircraft = [], vessels = [], satellites = [], seismic = [], wiki = [], infra = [], cables = [], militaryOnly = false, showThermal = false, showWeather = false, measureMode = false, machSpeed = 1, onBoundsChange }) => {
    const filteredAircraft = militaryOnly ? aircraft.filter(a => a.is_mil) : aircraft;
    const filteredVessels = militaryOnly ? vessels.filter(v => v.is_mil) : vessels;

    const [rainTime, setRainTime] = useState(null);
    useEffect(() => {
        if (showWeather) {
            axios.get('https://api.rainviewer.com/public/weather-maps.json').then(res => {
                const past = res.data?.radar?.past;
                if (past && past.length > 0) setRainTime(past[past.length - 1].path);
            }).catch(() => {});
        }
    }, [showWeather]);

    return (
        <MapContainer center={[39.0, 35.0]} zoom={5} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <MapEvents onBoundsChange={onBoundsChange} />
            <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Carto Dark (Default)">
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' maxZoom={19} />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Esri Satellite">
                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='Tiles &copy; Esri' maxZoom={19} />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="OSM Standard">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' maxZoom={19} />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Carto Light">
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' maxZoom={19} />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Esri Topo">
                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}" attribution='Tiles &copy; Esri' maxZoom={19} />
                </LayersControl.BaseLayer>
            </LayersControl>

            <MarkerClusterGroup
                chunkedLoading
                maxClusterRadius={60}
                spiderfyOnMaxZoom={true}
                showCoverageOnHover={true}
                iconCreateFunction={createBaseClusterIcon}
            >
                {bases.map((base, idx) => (
                    <Marker key={base.id || idx} position={[base.lat, base.lon]} icon={targetIcon}>
                        <Popup className="clean-popup">
                            <div className="facility-card">
                                <h4>{base.name}</h4>
                                <p><strong>Type:</strong> {base.tags?.military || base.tags?.landuse || 'Restricted area'}</p>
                                <p><strong>Coord:</strong> {base.lat.toFixed(4)}, {base.lon.toFixed(4)}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MarkerClusterGroup>

            <MarkerClusterGroup
                chunkedLoading
                maxClusterRadius={40}
                iconCreateFunction={createAircraftClusterIcon}
            >
                {filteredAircraft.map((plane) => (
                    <Marker key={plane.icao24} position={[plane.lat, plane.lng]} icon={planeIcon(plane.heading, plane.is_mil)}>
                        <Popup className="radar-popup aircraft-popup">
                            <AircraftPopup plane={plane} />
                        </Popup>
                    </Marker>
                ))}
            </MarkerClusterGroup>

            {filteredVessels.map((vessel) => (
                <Marker key={vessel.id} position={[vessel.lat, vessel.lng]} icon={shipIcon(vessel.is_mil)}>
                    <Popup className="radar-popup">
                        <div className="radar-card">
                            <h4 style={{ color: vessel.is_mil ? '#ef4444' : '#10b981' }}>{vessel.name}</h4>
                            <p><strong>Status:</strong> STRATEGIC FACILITY</p>
                            <p><strong>Type:</strong> {vessel.type}</p>
                            {vessel.is_mil && <span className="mil-badge">MILITARY INSTALLATION</span>}
                        </div>
                    </Popup>
                </Marker>
            ))}

            {showThermal && (
                <WMSTileLayer
                    url="https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi"
                    layers="MODIS_Terra_Thermal_Anomalies_All"
                    format="image/png"
                    transparent={true}
                    opacity={0.8}
                    zIndex={10}
                    attribution="NASA Earthdata GIBS"
                />
            )}



            {showWeather && rainTime && (
                <TileLayer
                    url={`https://tilecache.rainviewer.com${rainTime}/256/{z}/{x}/{y}/2/1_1.png`}
                    opacity={0.65}
                    zIndex={8}
                    attribution="RainViewer"
                />
            )}

            {satellites.map((sat, idx) => (
                <Marker key={`sat-${idx}`} position={[sat.lat, sat.lng]} icon={satelliteIcon}>
                    <Popup className="radar-popup">
                        <div className="radar-card">
                            <h4 style={{ color: '#a855f7' }}>SPY SATELLITE TLE</h4>
                            <p><strong>Designation:</strong> {sat.name}</p>
                            <p><strong>Altitude:</strong> {Math.round(sat.alt)} km Orbit</p>
                            <span className="mil-badge" style={{ background: '#a855f7' }}>AEROSPACE ASSET</span>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {seismic.map((eq, idx) => (
                <Marker key={`eq-${idx}`} position={[eq.lat, eq.lng]} icon={seismicIcon(eq.mag)}>
                    <Popup className="radar-popup">
                        <div className="radar-card">
                            <h4 style={{ color: '#ef4444' }}>SEISMIC ANOMALY</h4>
                            <p><strong>Magnitude:</strong> {eq.mag}</p>
                            <p><strong>Location:</strong> {eq.place}</p>
                            <span className="mil-badge">GROUND SHOCK DETECTED</span>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {wiki.map((w, idx) => (
                <Marker key={w.id} position={[w.lat, w.lng]} icon={wikiIcon}>
                    <Popup className="radar-popup">
                        <div className="radar-card">
                            <h4 style={{ color: '#fcd34d' }}>LOCAL INTEL (WIKI LEAK)</h4>
                            <p><strong>Data:</strong> {w.title}</p>
                            <a href={w.url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>View Intel File ↗</a>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {infra.map((inf, idx) => (
                <Marker key={inf.id} position={[inf.lat, inf.lng]} icon={infraIcon}>
                    <Popup className="radar-popup">
                        <div className="radar-card">
                            <h4 style={{ color: '#06b6d4' }}>STRATEGIC INFRASTRUCTURE</h4>
                            <p><strong>Type:</strong> {inf.infraType}</p>
                            <p><strong>Name:</strong> {inf.name}</p>
                            <span className="mil-badge" style={{ background: '#0891b2' }}>HIGH VALUE TARGET</span>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {cables.map((cab, idx) => (
                <Marker key={cab.id} position={[cab.lat, cab.lng]} icon={cableIcon}>
                    <Popup className="radar-popup">
                        <div className="radar-card">
                            <h4 style={{ color: '#10b981' }}>GLOBAL SUBMARINE CABLE</h4>
                            <p><strong>Type:</strong> {cab.cableType}</p>
                            <p><strong>Telecom Hub:</strong> {cab.name}</p>
                            <span className="mil-badge" style={{ background: '#10b981' }}>STRATEGIC DATA LINK</span>
                        </div>
                    </Popup>
                </Marker>
            ))}

            <WarRuler active={measureMode} machSpeed={machSpeed} />
            
            <MapBounds bases={bases} />
        </MapContainer>
    );
};

export default RadarMap;
