import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon, Polyline, Marker, Popup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './App.css';

// Фикс иконок для Leaflet (иногда они пропадают в React)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Иконка автобуса
const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
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
      setSavedObjects(Array.isArray(data) ? data : []);
    } catch (e) { 
      console.error("Ошибка загрузки", e);
      setSavedObjects([]);
    }
  };

  useEffect(() => { loadData(); }, []);

  const _onCreated = (e) => {
    const { layerType, layer } = e;
    const coords = layerType === 'marker' ? layer.getLatLng() : layer.getLatLngs();
    
    setCurrentLayer({ type: layerType, coords });
    
    // Предустановка категории
    if (layerType === 'marker') setCategory('transport');
    else if (layerType === 'polyline') setCategory('road');
    else setCategory('zone');

    setIsModalOpen(true);
  };

  const sendToServer = async () => {
    if (!currentLayer) return;

    const data = { 
      category, 
      description, 
      coordinates: currentLayer.coords, 
      layerType: currentLayer.type 
    };

    try {
      await fetch(`${API_URL}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setIsModalOpen(false);
      setDescription('');
      loadData();
    } catch (e) {
      alert("Ошибка при сохранении!");
    }
  };

  const deleteObject = async (id) => {
    await fetch(`${API_URL}/api/requests/${id}`, { method: 'DELETE' });
    loadData();
  };

  return (
    <div className="App" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ height: "50px", background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", zIndex: 1000 }}>
        <b style={{ letterSpacing: "2px" }}>BOROVICHI PRO</b>
        <button onClick={() => setIsAdmin(!isAdmin)} style={{ background: isAdmin ? "red" : "#444", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}>
          {isAdmin ? "ВЫЙТИ ИЗ АДМИН" : "АДМИН"}
        </button>
      </header>

      <div style={{ flex: 1 }}>
        <MapContainer center={BOROVICHI_CENTER} zoom={14} style={{ height: "100%", width: "100%" }}>
          <TileLayer 
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" 
            attribution='&copy; Google Maps'
          />
          
          {savedObjects.map((obj) => {
            if (!obj.coordinates) return null;

            // Рендер ЗОН
            if (obj.layerType === 'polygon' || obj.layerType === 'rectangle') {
              return (
                <Polygon key={obj.id} positions={obj.coordinates} pathOptions={{ color: '#00ff00', fillOpacity: 0.1, weight: 2 }}>
                  <Popup>
                    {obj.description}
                    {isAdmin && <button onClick={() => deleteObject(obj.id)} style={{display:"block", color:"red", marginTop:"10px"}}>Удалить</button>}
                  </Popup>
                </Polygon>
              );
            }

            // Рендер ЛИНИЙ (Дороги / Маршруты)
            if (obj.layerType === 'polyline') {
              const isTransport = obj.category === 'transport';
              return (
                <React.Fragment key={obj.id}>
                  <Polyline positions={obj.coordinates} pathOptions={{ color: isTransport ? '#00e5ff' : '#ffea00', weight: 5 }}>
                    <Popup>
                      {obj.description}
                      {isAdmin && <button onClick={() => deleteObject(obj.id)} style={{display:"block", color:"red", marginTop:"10px"}}>Удалить</button>}
                    </Popup>
                  </Polyline>
                  {/* Остановки на каждой точке линии транспорта */}
                  {isTransport && Array.isArray(obj.coordinates) && obj.coordinates.map((pos, i) => (
                    <Marker key={`${obj.id}-node-${i}`} position={pos} icon={busIcon} />
                  ))}
                </React.Fragment>
              );
            }

            // Рендер одиночных ОСТАНОВОК
            if (obj.layerType === 'marker') {
              return (
                <Marker key={obj.id} position={obj.coordinates} icon={busIcon}>
                  <Popup>
                    {obj.description}
                    {isAdmin && <button onClick={() => deleteObject(obj.id)} style={{display:"block", color:"red", marginTop:"10px"}}>Удалить</button>}
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
                polyline: { shapeOptions: { color: '#00e5ff', weight: 5 } },
                circle: false, circlemarker: false, marker: true
              }}
            />
          </FeatureGroup>
        </MapContainer>
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 3000 }}>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", width: "280px" }}>
            <h4 style={{ marginTop: 0 }}>Настройка объекта</h4>
            <select style={{ width: "100%", padding: "8px", marginBottom: "10px" }} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="zone">Территория (Зеленый)</option>
              <option value="transport">Транспорт (Синий + Остановки)</option>
              <option value="road">Дорога (Желтый)</option>
            </select>
            <textarea style={{ width: "100%", height: "60px", padding: "5px", boxSizing: "border-box" }} placeholder="Описание..." value={description} onChange={(e) => setDescription(e.target.value)} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
              <button onClick={() => setIsModalOpen(false)}>Отмена</button>
              <button onClick={sendToServer} style={{ background: "#27ae60", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "4px" }}>СОХРАНИТЬ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;