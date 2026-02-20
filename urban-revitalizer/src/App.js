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
const BOROVICHI_CENTER = [58.3878, 33.9107]; // Координаты г. Боровичи

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
    
    // Автоматическая подстановка категории
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
      <header className="header" style={{ height: "60px", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", zIndex: 1000, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
        <div className="logo" style={{ fontWeight: "bold", color: "#2c3e50" }}>BOROVICHI_PLANNER</div>
        <button 
          onClick={() => setIsAdmin(!isAdmin)}
          style={{ padding: "8px 15px", cursor: "pointer", borderRadius: "5px", border: "1px solid #ccc" }}
        >
          {isAdmin ? "🔒 Выйти" : "👤 Админ"}
        </button>
      </header>

      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer center={BOROVICHI_CENTER} zoom={13} style={{ height: "100%", width: "100%" }}>
          {/* ЦВЕТНАЯ ГЕОГРАФИЧЕСКАЯ КАРТА */}
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            attribution='&copy; OpenStreetMap contributors'
          />
          
          {savedObjects.map((obj) => {
            // ЗОНЫ (Полигоны) - Прозрачность 0.15
            if (obj.layerType === 'polygon' || obj.layerType === 'rectangle') {
              return (
                <Polygon key={obj.id} positions={obj.coordinates} pathOptions={{ color: '#e67e22', fillOpacity: 0.15 }}>
                  <Popup>
                    <strong>Зона:</strong> {obj.description}
                    {isAdmin && <button onClick={() => deleteObject(obj.id)} style={{display: 'block', marginTop: '10px', color: 'red'}}>Удалить</button>}
                  </Popup>
                </Polygon>
              );
            }
            // ЛИНИИ (Дороги и Транспорт)
            if (obj.layerType === 'polyline') {
              return (
                <Polyline 
                  key={obj.id} 
                  positions={obj.coordinates} 
                  pathOptions={{ color: obj.category === 'transport' ? '#2980b9' : '#7f8c8d', weight: 5 }}
                >
                  <Popup>
                    <strong>{obj.category === 'transport' ? 'Маршрут' : 'Дорога'}:</strong> {obj.description}
                    {isAdmin && <button onClick={() => deleteObject(obj.id)} style={{display: 'block', marginTop: '10px', color: 'red'}}>Удалить</button>}
                  </Popup>
                </Polyline>
              );
            }
            // ОСТАНОВКИ (Маркеры)
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
                polygon: { shapeOptions: { color: '#e67e22', fillOpacity: 0.15 } },
                rectangle: { shapeOptions: { color: '#e67e22', fillOpacity: 0.15 } },
                polyline: { shapeOptions: { color: '#2980b9', weight: 4 } },
                marker: true,
                circle: false,
                circlemarker: false
              }}
            />
          </FeatureGroup>
        </MapContainer>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div className="modal-content" style={{ background: "#fff", padding: "25px", borderRadius: "12px", width: "320px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0 }}>Параметры объекта</h3>
            
            <label style={{ fontSize: "13px", color: "#666" }}>Категория:</label>
            <select 
              style={{ width: "100%", padding: "8px", margin: "10px 0 20px 0", borderRadius: "5px" }} 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="zone">Территория (Оранжевый)</option>
              <option value="transport">Транспорт / Остановка (Синий)</option>
              <option value="road">Дорога (Серый)</option>
            </select>

            <label style={{ fontSize: "13px", color: "#666" }}>Описание:</label>
            <textarea 
              style={{ width: "100%", height: "80px", padding: "8px", boxSizing: "border-box", borderRadius: "5px", border: "1px solid #ccc" }} 
              placeholder="Введите информацию об объекте..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
            />
            
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: "8px 20px", borderRadius: "5px", border: "1px solid #ccc", background: "none" }}>Отмена</button>
              <button onClick={sendToServer} style={{ padding: "8px 20px", borderRadius: "5px", border: "none", background: "#27ae60", color: "#fff", fontWeight: "bold" }}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;