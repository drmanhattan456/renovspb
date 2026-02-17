import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon, Popup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './App.css';

const API_URL = 'https://renovspb.onrender.com'; 

const COLORS = [
  { name: 'Зеленый', value: '#2ecc71' },
  { name: 'Синий', value: '#3498db' },
  { name: 'Красный', value: '#e74c3c' },
  { name: 'Фиолетовый', value: '#9b59b6' },
  { name: 'Оранжевый', value: '#f39c12' },
  //{ name: 'Чёрный'}
];

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedObjects, setSavedObjects] = useState([]);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [type, setType] = useState('Заброшенная территория');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value); // Цвет по умолчанию

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
    // Добавляем selectedColor в объект данных
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
    <div className="App">
      <header className="header">
        <div className="menu-icon" onClick={() => setIsAdmin(!isAdmin)}>
          {isAdmin ? "🔒 ADMIN" : "☰"}
        </div>
        <div className="logo">URBAN_REVITALIZER</div>
        {isAdmin && <div className="admin-badge">MODERATION MODE</div>}
      </header>

      <MapContainer 
        center={[20, 0]} 
        zoom={2} 
        zoomControl={true}
        style={{ height: "100%", width: "100%", background: "#fff" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {savedObjects.map((obj) => (
          <Polygon 
            key={obj.id} 
            positions={obj.coordinates} 
            // Используем цвет из базы, если его нет — берем стандартный
            pathOptions={{ color: obj.color || '#f1c40f', fillOpacity: 0.5 }}
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
                polygon: { shapeOptions: { color: selectedColor } } 
              }}
            />
          </FeatureGroup>
        )}
      </MapContainer>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Новый объект</h3>
            
            <label>Тип объекта:</label>
            <select className="modal-input" value={type} onChange={(e) => setType(e.target.value)}>
              <option>Заброшенная промзона</option>
              <option>Пустырь</option>
              <option>Недострой</option>
              <option>Объект реновации</option>
            </select>

            <label>Цвет выделения:</label>
            <div className="color-picker" style={{ display: 'flex', gap: '10px', margin: '10px 0' }}>
              {COLORS.map(c => (
                <div 
                  key={c.value}
                  onClick={() => setSelectedColor(c.value)}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: c.value,
                    cursor: 'pointer',
                    border: selectedColor === c.value ? '3px solid #000' : '1px solid #ccc'
                  }}
                />
              ))}
            </div>

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