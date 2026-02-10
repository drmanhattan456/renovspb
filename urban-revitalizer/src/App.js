import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon, Popup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './App.css';

const SPB_BOUNDS = [[59.4000, 29.5000], [60.5000, 31.5000]];
// Создадим константу для адреса, чтобы менять в одном месте
const API_URL = 'https://renovspb.onrender.com'; 

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedObjects, setSavedObjects] = useState([]);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [type, setType] = useState('Заброшенная промзона');
  const [description, setDescription] = useState('');

  const loadData = async () => {
    try {
      // ЗАМЕНЕНО: используем API_URL
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
    // ЗАМЕНЕНО: используем API_URL
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
    // ЗАМЕНЕНО: используем API_URL
    await fetch(`${API_URL}/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadData();
  };

  const handleDelete = async (id) => {
    // ЗАМЕНЕНО: используем API_URL
    await fetch(`${API_URL}/api/requests/${id}`, { method: 'DELETE' });
    loadData();
  };

  // ... остальной код (return и т.д.) остается без изменений
  return (
    <div className="App">
      <header className="header">
        <div className="menu-icon" onClick={() => setIsAdmin(!isAdmin)}>
          {isAdmin ? "🔒 ADMIN" : "☰"}
        </div>
        <div className="logo">SPB_RENOVATION</div>
        {isAdmin && <div className="admin-badge">MODERATION MODE</div>}
      </header>

      <MapContainer 
        center={[59.9311, 30.4500]} 
        zoom={10} 
        maxBounds={SPB_BOUNDS}
        zoomControl={false}
        style={{ height: "100%", width: "100%", background: "#fff" }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" />
        
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
              draw={{ rectangle: false, circle: false, polyline: false, circlemarker: false, marker: false, polygon: { shapeOptions: { color: '#27ae60' } } }}
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
            </select>
            <textarea className="modal-input" placeholder="Ваше предложение..." value={description} onChange={(e) => setDescription(e.target.value)} />
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