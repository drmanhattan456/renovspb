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
  iconSize: [25, 25],
  iconAnchor: [12, 12]
});

const API_URL = 'https://renovspb.onrender.com'; 

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedObjects, setSavedObjects] = useState([]);
  const [currentLayer, setCurrentLayer] = useState(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('zone'); // zone, transport, road

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

  return (
    <div className="App" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="header" style={{ height: "60px", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", zIndex: 1000 }}>
        <div className="logo" style={{ fontWeight: "bold" }}>URBAN_PLANNER</div>
        <button onClick={() => setIsAdmin(!isAdmin)}>{isAdmin ? "ВЫЙТИ ИЗ АДМИН" : "АДМИН"}</button>
      </header>

      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer center={[59.93, 30.33]} zoom={12} style={{ height: "100%", width: "100%" }}>
          {/* ОБЫЧНАЯ ГЕОГРАФИЧЕСКАЯ КАРТА */}
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {savedObjects.map((obj) => {
            // Отрисовка ЗОН (Полигоны)
            if (obj.layerType === 'polygon' || obj.layerType === 'rectangle') {
              return (
                <Polygon key={obj.id} positions={obj.coordinates} pathOptions={{ color: 'orange', fillOpacity: 0.2 }}>
                  <Popup>{obj.description}</Popup>
                </Polygon>
              );
            }
            // Отрисовка ДОРОГ / ПУТЕЙ (Линии)
            if (obj.layerType === 'polyline') {
              return (
                <Polyline key={obj.id} positions={obj.coordinates} pathOptions={{ color: obj.category === 'transport' ? 'blue' : 'gray', weight: 5 }}>
                  <Popup>{obj.description}</Popup>
                </Polyline>
              );
            }
            // Отрисовка ОСТАНОВОК (Маркеры)
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
                polygon: true,
                rectangle: true,
                polyline: true, // Для дорог и маршрутов
                marker: true,   // Для остановок
                circle: false,
                circlemarker: false
              }}
            />
          </FeatureGroup>
        </MapContainer>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div className="modal-content" style={{ background: "#fff", padding: "20px", borderRadius: "10px", width: "300px" }}>
            <h3>Параметры объекта</h3>
            <label>Тип данных:</label>
            <select style={{ width: "100%", margin: "10px 0" }} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="zone">Заброшенная зона (Оранжевый)</option>
              <option value="transport">Транспортный маршрут (Синий)</option>
              <option value="road">Новая дорога (Серый)</option>
            </select>
            <textarea style={{ width: "100%", height: "60px" }} placeholder="Описание..." value={description} onChange={(e) => setDescription(e.target.value)} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
              <button onClick={() => setIsModalOpen(false)}>Отмена</button>
              <button onClick={sendToServer} style={{ background: "#27ae60", color: "#fff", border: "none", padding: "5px 15px" }}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;