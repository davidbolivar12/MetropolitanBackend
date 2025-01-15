const express = require('express');
const router = express.Router();
const db = require('../conexion');

router.get('/', (req, res) => {
    const { maletas, pasajeros } = req.query;

    if (maletas && pasajeros) {
        db.query("SELECT * FROM vehiculos WHERE capacidad_maletas <= ? AND capacidad_pasajeros <= ?", [maletas, pasajeros], (err, response) => {
            if (err) {
                return res.status(500).json({ error: "Error al obtener los vehiculos" });
            }
            return res.json(response); 
        });
        return; 
    }

    if (pasajeros) {
        console.log(pasajeros);
        db.query("SELECT * FROM vehiculos WHERE capacidad_pasajeros <= ?", [pasajeros], (err, response) => {
            if (err) {
                return res.status(500).json({ error: "Error al obtener los vehiculos" });
            }
            return res.json(response); 
        });
        return; 
    }

    db.query("SELECT * FROM vehiculos", (err, response) => {
        if (err) {
            return res.status(500).json({ error: "Error al obtener los vehiculos" });
        }
        return res.json(response); 
    });
});

router.post('/', (req, res)=>{
    const 
})

module.exports = router;
