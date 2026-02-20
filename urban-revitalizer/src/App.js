import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon, Polyline, Marker, Popup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './App.css';

// Иконка автобусной остановки
const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

const API_URL = 'https://renovspb.onrender.com'; 
const BOROVICHI_CENTER = [58.3878, 33.9107]; 

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedObjects, setSavedObjects] = useState([]);
  const [currentLayer, setCurrentLayer] = useState(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('zone'); 

  const loadData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/requests`);
      const data = await res.json();
      setSavedObjects(data);
    } catch (e) { console.error("Ошибка загрузки", e); }
  };

  useEffect(() => { loadData(); }, []);

  const _onCreated = (e) => {
    const { layerType, layer } = e;
    const coords = layerType === 'marker' ? layer.getLatLng() : layer.getLatLngs();
    
    if (layerType === 'marker') setCategory('transport');
    else if (layerType === 'polyline') setCategory('road');
    else setCategory('zone');

    setCurrentLayer({ type: layerType, coords });
    setIsModalOpen(true);
  };

  const sendToServer = async () => {
    const data = { 
      category, 
      description, 
      coordinates: currentLayer.coords, 
      layerType: currentLayer.type,
      status: 'pending' 
    };
    await fetch(`${API_URL}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    setIsModalOpen(false);
    setDescription('');
    loadData();
  };

  const deleteObject = async (id) => {
    await fetch(`${API_URL}/api/requests/${id}`, { method: 'DELETE' });
    loadData();
  };

  return (
    <div className="App" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="header" style={{ height: "60px", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1a1a1a", color: "#fff", zIndex: 1000 }}>
        <div className="logo" style={{ fontWeight: "bold" }}>BOROVICHI_SATELLITE</div>
        <button 
          onClick={() => setIsAdmin(!isAdmin)}
          style={{ padding: "8px 15px", cursor: "pointer", background: isAdmin ? "#e74c3c" : "#3498db", color: "#fff", border: "none", borderRadius: "5px" }}
        >
          {isAdmin ? "ВЫЙТИ" : "АДМИН"}
        </button>
      </header>

      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer center={BOROVICHI_CENTER} zoom={14} style={{ height: "100%", width: "100%" }}>
          {/* СПУТНИКОВЫЙ СЛОЙ (ESRI World Imagery) */}
          <TileLayer 
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
          />
          {/* Слой с названиями улиц поверх спутника (опционально) */}
          <TileLayer 
            url="https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}{r}.png" 
            opacity={0.7}
          />
          
          {savedObjects.map((obj) => {
            if (obj.layerType === 'polygon' || obj.layerType === 'rectangle') {
              return (
                <Polygon key={obj.id} positions={obj.coordinates} pathOptions={{ color: '#00ff00', fillOpacity: 0.1, weight: 2 }}>
                  <Popup>
                    <strong>Зона:</strong> {obj.description}
                    {isAdmin && <button onClick={() => deleteObject(obj.id)} style={{display: 'block', marginTop: '10px', color: 'red'}}>Удалить</button>}
                  </Popup>
                </Polygon>
              );
            }
            if (obj.layerType === 'polyline') {
              return (
                <Polyline 
                  key={obj.id} 
                  positions={obj.coordinates} 
                  pathOptions={{ color: obj.category === 'transport' ? '#3498db' : '#ffffff', weight: 4, dashArray: obj.category === 'road' ? '10, 10' : '' }}
                >
                  <Popup>
                    <strong>{obj.category === 'transport' ? 'Маршрут' : 'Дорога'}:</strong> {obj.description}
                    {isAdmin && <button onClick={() => deleteObject(obj.id)} style={{display: 'block', marginTop: '10px', color: 'red'}}>Удалить</button>}
                  </Popup>
                </Polyline>
              );
            }
            if (obj.layerType === 'marker') {
              return (
                <Marker key={obj.id} position={obj.coordinates} icon={busIcon}>
                  <Popup>
                    <strong>Остановка:</strong> {obj.description}
                    {isAdmin && <button onClick={() => deleteObject(obj.id)} style={{display: 'block', marginTop: '10px', color: 'red'}}>Удалить</button>}
                  </Popup>
                </Marker>
              );
            }
            return null;
          })}

          <FeatureGroup>
            <EditControl
              position='topleft'
              onCreated={_onCreated}
              draw={{
                polygon: { shapeOptions: { color: '#00ff00', fillOpacity: 0.1 } },
                rectangle: { shapeOptions: { color: '#00ff00', fillOpacity: 0.1 } },
                polyline: { shapeOptions: { color: '#3498db', weight: 4 } },
                marker: true,
                circle: false,
                circlemarker: false
              }}
            />
          </FeatureGroup>
        </MapContainer>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div className="modal-content" style={{ background: "#fff", padding: "20px", borderRadius: "8px", width: "300px" }}>
            <h3 style={{ marginTop: 0 }}>Новый объект</h3>
            <select style={{ width: "100%", padding: "8px", marginBottom: "15px" }} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="zone">Территория (Зеленый)</option>
              <option value="transport">Транспорт (Синий)</option>
              <option value="road">Дорога (Белый)</option>
            </select>
            <textarea style={{ width: "100%", height: "80px", padding: "8px", boxSizing: "border-box" }} placeholder="Описание..." value={description} onChange={(e) => setDescription(e.target.value)} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
              <button onClick={() => setIsModalOpen(false)}>Отмена</button>
              <button onClick={sendToServer} style={{ background: "#27ae60", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "4px", cursor: "pointer" }}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;