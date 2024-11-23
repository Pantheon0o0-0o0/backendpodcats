const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Usar el puerto proporcionado por Vercel

// Middleware para manejar archivos estáticos
app.use(express.static(path.join(__dirname, 'public'))); // Aseguramos que la ruta sea correcta
app.use(express.json());

// Configurar Multer para la carga de imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'public', 'img');
        // Crear la carpeta 'img' si no existe
        fs.existsSync(uploadPath) || fs.mkdirSync(uploadPath);
        cb(null, uploadPath); // Carpeta donde se guardarán las imágenes
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Renombrar archivo para evitar conflictos
    }
});
const upload = multer({ storage: storage });

// Ruta para obtener eventos
app.get('/api/events', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'events.json');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer los eventos.' });
        }
        res.json(JSON.parse(data));
    });
});

// Ruta para agregar un evento
app.post('/api/events', upload.single('image'), (req, res) => {
    const { title, date, location, status } = req.body;
    const image = req.file ? req.file.filename : '';

    const newEvent = { title, date, location, status, image };

    const filePath = path.join(__dirname, 'data', 'events.json');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer los eventos.' });
        }

        const events = JSON.parse(data);
        events.push(newEvent);

        fs.writeFile(filePath, JSON.stringify(events, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: 'Error al guardar el evento.' });
            }
            res.status(201).json({ message: 'Evento guardado con éxito.' });
        });
    });
});

// Ruta para eliminar un evento
app.delete('/api/events/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);

    const filePath = path.join(__dirname, 'data', 'events.json');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer los eventos.' });
        }
        const events = JSON.parse(data);

        if (index < 0 || index >= events.length) {
            return res.status(400).json({ error: 'Índice inválido.' });
        }

        events.splice(index, 1);

        fs.writeFile(filePath, JSON.stringify(events, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: 'Error al eliminar el evento.' });
            }
            res.status(200).json({ message: 'Evento eliminado con éxito.' });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
