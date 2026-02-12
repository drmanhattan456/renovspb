import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon, Popup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './App.css';

// Адрес твоего бэкенда на Render
const API_URL = 'https://renovspb.onrender.com'; 

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedObjects, setSavedObjects] = useState([]);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [type, setType] = useState('Заброшенная территория');
  const [description, setDescription] = useState('');

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
    const data = { type, description, coordinates: currentCoords };
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
    <div className="App">
      <header className="header">
        <div className="menu-icon" onClick={() => setIsAdmin(!isAdmin)}>
          {isAdmin ? "🔒 ADMIN" : "☰"}
        </div>
        <div className="logo">URBAN_REVITALIZER</div>
        {isAdmin && <div className="admin-badge">MODERATION MODE</div>}
      </header>

      <MapContainer 
        center={[20, 0]} // Начальная точка (ближе к центру карты мира)
        zoom={2}         // Отдаленный зум, чтобы видеть все страны
        zoomControl={true} // Включаем кнопки зума для удобства
        style={{ height: "100%", width: "100%", background: "#fff" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {savedObjects.map((obj) => (
          <Polygon 
            key={obj.id} 
            positions={obj.coordinates} 
            pathOptions={{ color: obj.status === 'approved' ? '#2ecc71' : '#f1c40f', fillOpacity: 0.5 }}
          >
            <Popup>
              <div className="popup-custom">
                <strong>{obj.type}</strong>
                <p>{obj.description}</p>
                {isAdmin && (
                  <div className="admin-btns">
                    {obj.status !== 'approved' && <button onClick={() => handleVerify(obj.id, 'approved')}>Одобрить</button>}
                    <button onClick={() => handleDelete(obj.id)} className="del-btn">Удалить</button>
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
                rectangle: true, 
                circle: false, 
                polyline: false, 
                circlemarker: false, 
                marker: true, 
                polygon: { shapeOptions: { color: '#27ae60' } } 
              }}
            />
          </FeatureGroup>
        )}
      </MapContainer>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Новый объект</h3>
            <select className="modal-input" value={type} onChange={(e) => setType(e.target.value)}>
              <option>Заброшенная промзона</option>
              <option>Пустырь</option>
              <option>Недострой</option>
              <option>Объект реновации</option>
            </select>
            <textarea className="modal-input" placeholder="Опишите потенциал места..." value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="modal-buttons">
              <button onClick={() => setIsModalOpen(false)}>Отмена</button>
              <button className="btn-send" onClick={sendToServer}>Отправить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;