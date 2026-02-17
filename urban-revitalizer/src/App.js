import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon, Popup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './App.css';

// Ссылка на твой бэкенд на Render
const API_URL = 'https://renovspb.onrender.com'; 

const COLORS = [
  { name: 'Зеленый', value: '#2ecc71' },
  { name: 'Синий', value: '#3498db' },
  { name: 'Красный', value: '#e74c3c' },
  { name: 'Фиолетовый', value: '#9b59b6' },
  { name: 'Оранжевый', value: '#f39c12' }
];

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedObjects, setSavedObjects] = useState([]);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [type, setType] = useState('Заброшенная промзона');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);

  const loadData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/requests`);
      const data = await res.json();
      setSavedObjects(data);
    } catch (e) { console.error("Ошибка загрузки", e); }
  };

  useEffect(() => { loadData(); }, []);

  const _onCreate = (e) => {
    setCurrentCoords(e.layer.getLatLngs());
    setIsModalOpen(true);
  };

  const sendToServer = async () => {
    const data = { type, description, coordinates: currentCoords, color: selectedColor };
    await fetch(`${API_URL}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    setIsModalOpen(false);
    setDescription('');
    loadData();
  };

  const handleVerify = async (id, status) => {
    await fetch(`${API_URL}/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadData();
  };

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/api/requests/${id}`, { method: 'DELETE' });
    loadData();
  };

  return (
    <div className="App" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="header" style={{ height: "60px", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderBottom: "1px solid #ddd", zIndex: 1000 }}>
        <div className="menu-icon" onClick={() => setIsAdmin(!isAdmin)} style={{ cursor: "pointer", fontSize: "20px" }}>
          {isAdmin ? "🔒 ADMIN" : "☰"}
        </div>
        <div className="logo" style={{ fontWeight: "bold", letterSpacing: "1px" }}>URBAN_REVITALIZER</div>
        {isAdmin && <div className="admin-badge" style={{ color: "red", fontSize: "12px", fontWeight: "bold" }}>MODERATION MODE</div>}
      </header>

      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer 
          center={[20, 0]} 
          zoom={3} 
          style={{ height: "100%", width: "100%" }} 
          zoomControl={true}
        >
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap'
          />
          
          {savedObjects.map((obj) => (
            <Polygon 
              key={obj.id} 
              positions={obj.coordinates} 
              pathOptions={{ color: obj.color || '#f1c40f', fillOpacity: 0.5 }}
            >
              <Popup>
                <div className="popup-custom">
                  <strong>{obj.type}</strong>
                  <p>{obj.description}</p>
                  {isAdmin && (
                    <div className="admin-btns" style={{ marginTop: "10px", display: "flex", gap: "5px" }}>
                      {obj.status !== 'approved' && <button onClick={() => handleVerify(obj.id, 'approved')}>Одобрить</button>}
                      <button onClick={() => handleDelete(obj.id)} style={{ color: "red" }}>Удалить</button>
                    </div>
                  )}
                </div>
              </Popup>
            </Polygon>
          ))}

          {!isAdmin && (
            <FeatureGroup>
              <EditControl
                position='topleft'
                onCreated={_onCreate}
                draw={{ 
                  rectangle: true, circle: false, polyline: false, 
                  circlemarker: false, marker: true, 
                  polygon: { shapeOptions: { color: selectedColor } } 
                }}
              />
            </FeatureGroup>
          )}
        </MapContainer>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div className="modal-content" style={{ background: "#fff", padding: "20px", borderRadius: "8px", width: "300px" }}>
            <h3>Новый объект</h3>
            <label style={{ fontSize: "12px" }}>Тип:</label>
            <select className="modal-input" style={{ width: "100%", marginBottom: "10px" }} value={type} onChange={(e) => setType(e.target.value)}>
              <option>Заброшенная промзона</option>
              <option>Пустырь</option>
              <option>Недострой</option>
              <option>Объект реновации</option>
            </select>

            <label style={{ fontSize: "12px" }}>Цвет зоны:</label>
            <div style={{ display: "flex", gap: "8px", margin: "10px 0" }}>
              {COLORS.map(c => (
                <div key={c.value} onClick={() => setSelectedColor(c.value)} style={{ width: "25px", height: "25px", borderRadius: "50%", backgroundColor: c.value, cursor: "pointer", border: selectedColor === c.value ? "2px solid #000" : "1px solid #ccc" }} />
              ))}
            </div>

            <textarea className="modal-input" style={{ width: "100%", height: "80px", marginBottom: "10px" }} placeholder="Описание..." value={description} onChange={(e) => setDescription(e.target.value)} />
            
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setIsModalOpen(false)}>Отмена</button>
              <button onClick={sendToServer} style={{ background: "#2ecc71", color: "#fff", border: "none", padding: "5px 15px", borderRadius: "4px" }}>Отправить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;