const express = require('express');
const router = express.Router();
const db = require('../conexion');

router.get('/', (req, res) => {
    const { id } = req.query;

    if (id) {
        db.query("SELECT * FROM servicio WHERE id = ?", [id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: "Error al obtener el servicio." });
            }
            if (result.length === 0) {
                return res.status(404).json({ error: `No se encontró el servicio con id ${id}.` });
            }
            return res.json(result[0]);
        });
    } else {
        db.query("SELECT * FROM servicio", (err, result) => {
            if (err) {
                return res.status(500).json({ error: "Error al obtener los servicios." });
            }
            return res.json(result);
        });
    }
});

router.post('/', (req, res) => {
    let { NombreServicio } = req.body;

    if (!NombreServicio) {
        return res.status(400).json({ error: "El campo NombreServicio es obligatorio." });
    }

    NombreServicio = NombreServicio.trim().toUpperCase();

    if (NombreServicio.length === 0) {
        return res.status(400).json({ error: "El nombre del servicio no puede estar vacío." });
    }

    db.query("SELECT * FROM servicio WHERE UPPER(NombreServicio) = ?", [NombreServicio], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Error al buscar el servicio." });
        }

        if (result.length > 0) {
            return res.status(409).json({ error: "El servicio ya está registrado." });
        }

        db.query("INSERT INTO servicio (NombreServicio) VALUES (?)", [NombreServicio], (errInsert, response) => {
            if (errInsert) {
                return res.status(500).json({ error: "Error al insertar el servicio." });
            }

            return res.status(201).json({
                message: "Servicio creado exitosamente.",
                servicio: {
                    id: response.insertId,
                    NombreServicio
                }
            });
        });
    });
});

router.put('/', (req, res) => {
    const { id } = req.query;
    let { NombreServicio } = req.body;

    if (!id) {
        return res.status(400).json({ error: "Se requiere el ID del servicio a actualizar." });
    }

    if (!NombreServicio) {
        return res.status(400).json({ error: "El campo NombreServicio es obligatorio." });
    }

    NombreServicio = NombreServicio.trim().toUpperCase();

    if (NombreServicio.length === 0) {
        return res.status(400).json({ error: "El nombre del servicio no puede estar vacío." });
    }

    db.query("SELECT * FROM servicio WHERE Id = ?", [id], (errSelect, result) => {
        if (errSelect) {
            return res.status(500).json({ error: "Error al buscar el servicio." });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "Servicio no encontrado." });
        }

        db.query("SELECT * FROM servicio WHERE UPPER(NombreServicio) = ? AND Id != ?", [NombreServicio, id], (errCheck, resultCheck) => {
            if (errCheck) {
                return res.status(500).json({ error: "Error al verificar duplicados." });
            }

            if (resultCheck.length > 0) {
                return res.status(409).json({ error: "Ya existe otro servicio con ese nombre." });
            }

            db.query("UPDATE servicio SET NombreServicio = ? WHERE Id = ?", [NombreServicio, id], (errUpdate, resultUpdate) => {
                if (errUpdate) {
                    return res.status(500).json({ error: "Error al actualizar el servicio." });
                }

                return res.json({
                    message: "Servicio actualizado exitosamente.",
                    servicio: {
                        id,
                        NombreServicio
                    }
                });
            });
        });
    });
});

router.delete('/', (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Se requiere el ID del servicio a eliminar." });
    }

    db.query("SELECT * FROM servicio WHERE Id = ?", [id], (errSelect, result) => {
        if (errSelect) {
            return res.status(500).json({ error: "Error al buscar el servicio." });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "Servicio no encontrado." });
        }

        db.query("DELETE FROM servicio WHERE Id = ?", [id], (errDelete, resultDelete) => {
            if (errDelete) {
                return res.status(500).json({ error: "Error al eliminar el servicio." });
            }

            return res.json({
                message: "Servicio eliminado exitosamente.",
                servicioEliminado: result[0]
            });
        });
    });
});

module.exports = router;
