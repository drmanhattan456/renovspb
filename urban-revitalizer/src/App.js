import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon, Polyline, Marker, Popup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './App.css';

// ГАРАНТИРОВАННО РАБОЧАЯ ЦВЕТНАЯ ИКОНКА (PNG с прозрачностью)
const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -10]
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
    // Получаем координаты в зависимости от типа объекта
    const coords = layerType === 'marker' ? layer.getLatLng() : layer.getLatLngs();
    
    // Авто-категория для удобства
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
      layerType: currentLayer.type 
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

  return (
    <div className="App" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="header" style={{ height: "60px", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111", color: "#fff", zIndex: 1000 }}>
        <div className="logo" style={{ fontWeight: "bold" }}>BOROVICHI_COLOR_PLANNER</div>
        <button onClick={() => setIsAdmin(!isAdmin)} style={{ background: "#3498db", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "5px" }}>
          {isAdmin ? "ВЫЙТИ" : "АДМИН"}
        </button>
      </header>

      <div style={{ flex: 1 }}>
        <MapContainer center={BOROVICHI_CENTER} zoom={14} style={{ height: "100%", width: "100%" }}>
          {/* ИСПОЛЬЗУЕМ GOOGLE HYBRID - ОН ТОЧНО ЦВЕТНОЙ */}
          <TileLayer 
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" 
            attribution='&copy; Google Maps'
          />
          
          {savedObjects.map((obj) => {
            // 1. ЗОНЫ (Полигоны)
            if (obj.layerType === 'polygon' || obj.layerType === 'rectangle') {
              return (
                <Polygon key={obj.id} positions={obj.coordinates} pathOptions={{ color: '#00ff00', fillOpacity: 0.15 }}>
                  <Popup>{obj.description}</Popup>
                </Polygon>
              );
            }
            // 2. ДОРОГИ И ТРАНСПОРТНЫЕ ПУТИ
            if (obj.layerType === 'polyline') {
              return (
                <React.Fragment key={obj.id}>
                  <Polyline positions={obj.coordinates} pathOptions={{ color: obj.category === 'transport' ? '#00ccff' : '#ffcc00', weight: 5 }}>
                    <Popup>{obj.description}</Popup>
                  </Polyline>
                  
                  {/* МАГИЯ: Ставим иконку остановки на КАЖДУЮ точку пути, если это транспорт */}
                  {obj.category === 'transport' && obj.coordinates.map((coord, idx) => (
                    <Marker key={`${obj.id}-point-${idx}`} position={coord} icon={busIcon} />
                  ))}
                </React.Fragment>
              );
            }
            // 3. ОТДЕЛЬНЫЕ ОСТАНОВКИ (Маркеры)
            if (obj.layerType === 'marker') {
              return (
                <Marker key={obj.id} position={obj.coordinates} icon={busIcon}>
                  <Popup>{obj.description}</Popup>
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
                polygon: { shapeOptions: { color: '#00ff00', fillOpacity: 0.15 } },
                rectangle: { shapeOptions: { color: '#00ff00', fillOpacity: 0.15 } },
                polyline: { shapeOptions: { color: '#00ccff', weight: 4 } },
                marker: true,
                circle: false,
                circlemarker: false
              }}
            />
          </FeatureGroup>
        </MapContainer>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div className="modal-content" style={{ background: "#fff", padding: "25px", borderRadius: "10px", width: "320px" }}>
            <h3 style={{ marginTop: 0 }}>Тип объекта</h3>
            <select style={{ width: "100%", padding: "10px", marginBottom: "15px" }} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="zone">Территория (Зеленый)</option>
              <option value="transport">Транспорт / Маршрут (Синий + Остановки)</option>
              <option value="road">Дорога (Желтый)</option>
            </select>
            <textarea style={{ width: "100%", height: "80px", padding: "10px", boxSizing: "border-box" }} placeholder="Описание..." value={description} onChange={(e) => setDescription(e.target.value)} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: "8px 15px" }}>Отмена</button>
              <button onClick={sendToServer} style={{ background: "#27ae60", color: "#fff", border: "none", padding: "8px 20px", borderRadius: "5px", fontWeight: "bold" }}>СОХРАНИТЬ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;