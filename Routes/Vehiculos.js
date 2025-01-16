const express = require('express');
const router = express.Router();
const db = require('../conexion');

router.get('/', (req, res) => {
    const { maletas, pasajeros } = req.query;

    if (maletas && pasajeros) {
        db.query("SELECT * FROM vehiculos WHERE capacidad_maletas >= ? AND capacidad_pasajeros >= ?", [maletas, pasajeros], (err, response) => {
            if (err) {
                return res.status(500).json({ error: "Error al obtener los vehiculos" });
            }
            return res.json(response); 
        });
        return; 
    }

    if (pasajeros) {
        console.log(pasajeros);
        db.query("SELECT * FROM vehiculos WHERE capacidad_pasajeros >= ?", [pasajeros], (err, response) => {
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

    const {modelo, anio, capacidad_pasajeros, capacidad_maletas, tipo_vehiculo} = req.body;

    db.query('INSERT INTO vehiculos (modelo, anio, capacidad_pasajeros, capacidad_maletas, tipo_vehiculo) VALUES (?, ?, ?, ?, ?)', [modelo, anio, capacidad_pasajeros, capacidad_maletas, tipo_vehiculo], (err, response)=>{
        if(err){
            return res.status(500).json({ error: "Error en el servidor"});
        }if(response.affectedRows === 0){
            return res.status(404).json({ error: "Error al agregar el vehiculo"});
        }
        res.json({ message: "vehiculo agregado exitosamente"});
    });
});

router.put('/', (req, res)=>{
    const {id} = req.query;
    const {modelo, anio, capacidad_pasajeros, capacidad_maletas, tipo_vehiculo} = req.body;

    db.query('UPDATE vehiculos set modelo = ?, anio = ?, capacidad_pasajeros = ?, capacidad_maletas = ?, tipo_vehiculo = ? WHERE id_vehiculo = ?', [modelo, anio, capacidad_pasajeros, capacidad_maletas, tipo_vehiculo, id], (err, response)=>{
        if(err){
            return res.status(500).json({ error: "Error en el servidor"});
        }if(response.affectedRows === 0){
            return res.status(404).json({ error: "Vehiculo no encontrado"})
        }
        res.json({message: "Vechiculo actualizado"})
    })
})

module.exports = router;
