import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';

// leaflet icon veremedim burayı silince markerlar gider silem | if you delete this markers will disappear

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

const createCustomClusterIcon = (cluster) => {
    return new L.DivIcon({
        html: `<div class="radar-cluster"><span>${cluster.getChildCount()}</span></div>`,
        className: 'custom-marker-cluster',
        iconSize: L.point(40, 40, true),
    });
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

const RadarMap = ({ bases }) => {
    return (
        <MapContainer center={[39.0, 35.0]} zoom={5} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 0 }}>
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
                <LayersControl.BaseLayer name="CyclOSM (Bicycle)">
                    <TileLayer url="https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png" attribution='&copy; CyclOSM' maxZoom={20} />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="OSM Transport">
                    <TileLayer url="https://{s}.tile.memomaps.de/tilegen/{z}/{x}/{y}.png" attribution='&copy; Memomaps' maxZoom={18} />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="OSM Humanitarian">
                    <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' maxZoom={19} />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Tracestrack Topo">
                    <TileLayer url="https://tile.tracestrack.com/topo__/{z}/{x}/{y}.png" attribution='&copy; Tracestrack' maxZoom={19} />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Carto Light">
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' maxZoom={19} />
                </LayersControl.BaseLayer>
            </LayersControl>

            <MarkerClusterGroup
                chunkedLoading
                maxClusterRadius={60}
                spiderfyOnMaxZoom={true}
                showCoverageOnHover={true}
                iconCreateFunction={createCustomClusterIcon}
            >
                {bases.map((base, idx) => {
                    const name = base.name || 'Classified Facility';
                    const type = base.tags?.military || base.tags?.landuse || 'Unknown Military Zone';
                    const tagsRaw = JSON.stringify(base.tags, null, 2);

                    return (
                        <Marker key={base.id || idx} position={[base.lat, base.lon]} icon={targetIcon}>
                            <Popup className="clean-popup">
                                <div className="facility-card">
                                    <h4 style={{ fontSize: '14px', marginBottom: '5px' }}>{name}</h4>
                                    <div className="meta" style={{ fontSize: '12px', color: '#475569', marginBottom: '10px' }}>
                                        <p><strong>Type:</strong> {type}</p>
                                        <p><strong>Coord:</strong> {base.lat.toFixed(4)}, {base.lon.toFixed(4)}</p>
                                    </div>
                                    <details>
                                        <summary style={{ cursor: 'pointer', color: '#2563eb', fontSize: '11px', fontWeight: '600' }}>VIEW RAW OSM TAGS</summary>
                                        <pre style={{ fontSize: '10px', background: '#f8fafc', padding: '5px', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '4px', marginTop: '5px', overflowX: 'auto' }}>
                                            {tagsRaw}
                                        </pre>
                                    </details>
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MarkerClusterGroup>

            <MapBounds bases={bases} />
        </MapContainer>
    );
};

export default RadarMap;
