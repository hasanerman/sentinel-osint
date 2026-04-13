import React, { useState } from 'react';
import axios from 'axios';
import { Search, Loader2 } from 'lucide-react';
import RadarMap from './components/RadarMap';

function App() {
  const [country, setCountry] = useState('Israel');
  const [data, setData] = useState({ bases: [], searchCountry: '', originalCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <div className="layout-container">
      <div className="map-layer">
        <RadarMap bases={data.bases} />
      </div>

      <div className="control-panel">
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
            <button onClick={scanArea} disabled={loading}>
              {loading ? <Loader2 className="spinning" size={18} /> : <Search size={18} />}
            </button>
          </div>
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
            <div className="info-item">
              <span>Merged Sub-Structures:</span>
              <strong style={{color: '#94a3b8'}}>{data.originalCount}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
