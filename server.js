const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const cors = require('cors');  // Importa cors

const app = express();

// Configurar CORS para permitir solicitudes desde Netlify
app.use(cors({
    origin: 'https://golpes.netlify.app',  // Aquí especificas el dominio de tu frontend
    methods: ['GET', 'POST', 'DELETE'],  // Métodos permitidos
    allowedHeaders: ['Content-Type']  // Encabezados permitidos
}));

// Middleware para manejar archivos estáticos
app.use(express.static('public'));
app.use(express.json());

// Configuración de Multer para el manejo de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/img');  // Carpeta donde se guardarán las imágenes
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // Renombrar para evitar conflictos
    }
});
const upload = multer({ storage: storage });

// Ruta para obtener los eventos
app.get('/api/events', (req, res) => {
    fs.readFile('./data/events.json', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer los eventos.' });
        }
        res.json(JSON.parse(data));  // Enviar los eventos al frontend
    });
});

// Ruta para agregar un evento
app.post('/api/events', upload.single('image'), (req, res) => {
    const { title, date, location, status } = req.body;
    const image = req.file ? req.file.filename : '';

    const newEvent = { title, date, location, status, image };

    fs.readFile('./data/events.json', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer los eventos.' });
        }

        const events = JSON.parse(data);
        events.push(newEvent);

        fs.writeFile('./data/events.json', JSON.stringify(events, null, 2), (writeErr) => {
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

    fs.readFile('./data/events.json', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer los eventos.' });
        }
        const events = JSON.parse(data);

        if (index < 0 || index >= events.length) {
            return res.status(400).json({ error: 'Índice inválido.' });
        }

        events.splice(index, 1);

        fs.writeFile('./data/events.json', JSON.stringify(events, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: 'Error al eliminar el evento.' });
            }
            res.status(200).json({ message: 'Evento eliminado con éxito.' });
        });
    });
});

// Exporta la app para ser usada en Vercel o en un servidor
module.exports = app;

// Iniciar el servidor en el puerto 3000
app.listen(3000, () => {
    console.log("Servidor corriendo en puerto 3000");
});