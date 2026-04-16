import React, { useState } from 'react';
import { useMapEvents, Polyline, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';

const dotIcon = L.divIcon({ 
    className: 'ruler-dot', 
    html: '<div style="width:12px;height:12px;background:#ef4444;border-radius:50%;border:2px solid #fff;box-shadow:0 0 10px #ef4444"></div>', 
    iconSize:[12,12], 
    iconAnchor:[6,6] 
});

const WarRuler = ({ active, machSpeed }) => {
    const [points, setPoints] = useState([]);
    const [mousePos, setMousePos] = useState(null);

    useMapEvents({
        click(e) {
            if (!active) return;
            if (points.length >= 2) {
                setPoints([e.latlng]);
                setMousePos(null);
            } else {
                setPoints([...points, e.latlng]);
            }
        },
        mousemove(e) {
            if (active && points.length === 1) {
                setMousePos(e.latlng);
            }
        }
    });

    if (!active) {
        if (points.length > 0) {
            setPoints([]);
            setMousePos(null);
        }
        return null;
    }

    const calcDistance = (p1, p2) => p1.distanceTo(p2) / 1000;
    
    const calcTime = (distKm, mach) => {
        const speedKmh = mach * 1234.8;
        const hours = distKm / speedKmh;
        if (hours < 1) {
            const mins = hours * 60;
            if (mins < 1) {
                return `${Math.round(mins * 60)} SECONDS`;
            }
            return `${Math.round(mins)} MINS ${Math.round((mins % 1) * 60)} SECS`;
        }
        return `${hours.toFixed(2)} HOURS`;
    };

    let drawPoints = [...points];
    if (points.length === 1 && mousePos) {
        drawPoints.push(mousePos);
    }

    if (drawPoints.length < 2) {
        if (drawPoints.length === 1) {
            return <Marker position={drawPoints[0]} icon={dotIcon} />;
        }
        return null;
    }

    const p1 = drawPoints[0];
    const p2 = drawPoints[1];
    const dist = calcDistance(p1, p2);
    const timeToTarget = calcTime(dist, machSpeed);
    const midPoint = [(p1.lat + p2.lat) / 2, (p1.lng + p2.lng) / 2];

    return (
        <>
            <Marker position={p1} icon={dotIcon} />
            <Marker position={p2} icon={dotIcon} />
            <Polyline 
                positions={[p1, p2]} 
                pathOptions={{ color: '#ef4444', weight: 3, dashArray: '8, 12' }} 
            />
            <Marker position={midPoint} opacity={0}>
                <Tooltip permanent direction="center" className="transparent-tooltip">
                    <div style={{ 
                        background: 'rgba(15, 23, 42, 0.65)', 
                        padding: '6px 10px', 
                        color: '#fff', 
                        border: '1px solid rgba(239, 68, 68, 0.5)', 
                        borderRadius: '6px', 
                        textAlign: 'center',
                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)',
                        fontFamily: 'Inter, sans-serif',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div style={{color: '#fca5a5', fontSize: '0.55rem', fontWeight:'900', letterSpacing:'1px', marginBottom:'2px'}}>TACTICAL MEASUREMENT</div>
                        <div style={{fontSize: '0.95rem', fontWeight: 'bold'}}>{dist.toLocaleString('en-US', {maximumFractionDigits:1})} KM</div>
                        <div style={{color: '#facc15', fontSize: '0.65rem', fontWeight: 'bold', marginTop:'2px', borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:'2px'}}>
                            ETA (Mach {machSpeed}): {timeToTarget}
                        </div>
                    </div>
                </Tooltip>
            </Marker>
        </>
    );
};

export default WarRuler;
