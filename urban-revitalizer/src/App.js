import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon, Polyline, Marker, Popup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './App.css';

const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const API_URL = 'https://renovspb.onrender.com'; 
const BOROVICHI_CENTER = [58.3878, 33.9107]; 

// Расширенный список цветов
const COLORS = [
  { name: 'Зеленый', value: '#2ecc71' },
  { name: 'Синий', value: '#3498db' },
  { name: 'Красный', value: '#e74c3c' },
  { name: 'Фиолетовый', value: '#9b59b6' },
  { name: 'Оранжевый', value: '#f39c12' },
  { name: 'Розовый', value: '#fd79a8' },
  { name: 'Бирюзовый', value: '#00cec9' },
  { name: 'Белый', value: '#ffffff' }
];

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedObjects, setSavedObjects] = useState([]);
  const [currentLayer, setCurrentLayer] = useState(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('zone'); 
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);

  const loadData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/requests`);
      const data = await res.json();
      setSavedObjects(Array.isArray(data) ? data : []);
    } catch (e) { setSavedObjects([]); }
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
      color: selectedColor // Сохраняем выбранный цвет
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
      <header style={{ height: "50px", background: "#111", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", zIndex: 1000 }}>
        <b style={{ letterSpacing: "1px" }}>BOROVICHI URBAN DESIGN</b>
        <button onClick={() => setIsAdmin(!isAdmin)} style={{ background: "#333", color: "#fff", border: "1px solid #555", padding: "5px 12px", borderRadius: "4px" }}>
          {isAdmin ? "ВЫХОД" : "АДМИН"}
        </button>
      </header>

      <div style={{ flex: 1 }}>
        <MapContainer center={BOROVICHI_CENTER} zoom={14} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" attribution='&copy; Google Maps' />
          
          {savedObjects.map((obj) => {
            if (!obj.coordinates) return null;

            if (obj.layerType === 'polygon' || obj.layerType === 'rectangle') {
              return (
                <Polygon key={obj.id} positions={obj.coordinates} pathOptions={{ color: obj.color || '#00ff00', fillOpacity: 0.15, weight: 3 }}>
                  <Popup>
                    {obj.description}
                    {isAdmin && <button onClick={() => deleteObject(obj.id)} style={{display:"block", color:"red", marginTop:"10px"}}>Удалить</button>}
                  </Popup>
                </Polygon>
              );
            }

            if (obj.layerType === 'polyline') {
              const isTransport = obj.category === 'transport';
              return (
                <React.Fragment key={obj.id}>
                  <Polyline positions={obj.coordinates} pathOptions={{ color: obj.color || '#3498db', weight: 5 }}>
                    <Popup>{obj.description}</Popup>
                  </Polyline>
                  {isTransport && obj.coordinates.map((pos, i) => (
                    <Marker key={`${obj.id}-${i}`} position={pos} icon={busIcon} />
                  ))}
                </React.Fragment>
              );
            }

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
                polygon: { shapeOptions: { color: selectedColor, fillOpacity: 0.15 } },
                rectangle: { shapeOptions: { color: selectedColor, fillOpacity: 0.15 } },
                polyline: { shapeOptions: { color: selectedColor, weight: 5 } },
                circle: false, circlemarker: false, marker: true
              }}
            />
          </FeatureGroup>
        </MapContainer>
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 3000 }}>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", width: "320px", color: "#333" }}>
            <h3 style={{ marginTop: 0 }}>Настройка объекта</h3>
            
            <label style={{ fontSize: "12px", fontWeight: "bold" }}>КАТЕГОРИЯ:</label>
            <select style={{ width: "100%", padding: "8px", margin: "5px 0 15px 0" }} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="zone">Территория</option>
              <option value="transport">Транспорт (с остановками)</option>
              <option value="road">Дорога / Путь</option>
            </select>

            <label style={{ fontSize: "12px", fontWeight: "bold" }}>ЦВЕТ ВЫДЕЛЕНИЯ:</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "10px 0 20px 0" }}>
              {COLORS.map(c => (
                <div 
                  key={c.value} 
                  onClick={() => setSelectedColor(c.value)} 
                  style={{ 
                    width: "28px", height: "28px", borderRadius: "50%", 
                    backgroundColor: c.value, cursor: "pointer", 
                    border: selectedColor === c.value ? "3px solid #000" : "1px solid #ddd" 
                  }} 
                  title={c.name}
                />
              ))}
            </div>

            <textarea style={{ width: "100%", height: "70px", padding: "8px", boxSizing: "border-box", borderRadius: "5px" }} placeholder="Описание объекта..." value={description} onChange={(e) => setDescription(e.target.value)} />
            
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: "8px 15px", borderRadius: "5px", border: "1px solid #ccc", background: "none" }}>ОТМЕНА</button>
              <button onClick={sendToServer} style={{ background: "#27ae60", color: "#fff", border: "none", padding: "8px 20px", borderRadius: "5px", fontWeight: "bold" }}>СОХРАНИТЬ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;