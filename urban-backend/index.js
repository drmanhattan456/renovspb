const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const DB_FILE = './requests.json';

// Получить все объекты
app.get('/api/requests', (req, res) => {
    if (!fs.existsSync(DB_FILE)) return res.json([]);
    const data = fs.readFileSync(DB_FILE);
    res.json(JSON.parse(data));
});

// Создать новую заявку от жителя
app.post('/api/requests', (req, res) => {
    const newRequest = {
        id: Date.now(),
        ...req.body,
        status: 'pending', // начальный статус - желтый
        createdAt: new Date()
    };
    let requests = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE)) : [];
    requests.push(newRequest);
    fs.writeFileSync(DB_FILE, JSON.stringify(requests, null, 2));
    res.status(201).json(newRequest);
});

// Верификация (изменение статуса на approved)
app.patch('/api/requests/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    let requests = JSON.parse(fs.readFileSync(DB_FILE));
    const index = requests.findIndex(r => r.id == id);
    if (index !== -1) {
        requests[index].status = status;
        fs.writeFileSync(DB_FILE, JSON.stringify(requests, null, 2));
        res.json(requests[index]);
    } else {
        res.status(404).send();
    }
});

// Удаление заявки
app.delete('/api/requests/:id', (req, res) => {
    const { id } = req.params;
    let requests = JSON.parse(fs.readFileSync(DB_FILE));
    requests = requests.filter(r => r.id != id);
    fs.writeFileSync(DB_FILE, JSON.stringify(requests, null, 2));
    res.status(204).send();
});

app.listen(PORT, '0.0.0.0', () => console.log(`Backend is running on port ${PORT}`));