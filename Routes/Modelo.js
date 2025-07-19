const express = require('express');
const router = express.Router();
const db = require('../conexion');

router.get('/', (req, res) => {
    const { id } = req.query;

    if (id) {
        db.query("SELECT * FROM Modelo WHERE id = ?", [id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: "Error al obtener el modelo." });
            }
            if (result.length === 0) {
                return res.status(404).json({ error: `No se encontró el modelo con id ${id}.` });
            }
            return res.json(result[0]);
        });
    } else {
        db.query("SELECT * FROM Modelo", (err, result) => {
            if (err) {
                return res.status(500).json({ error: "Error al obtener los modelos." });
            }
            return res.json(result);
        });
    }
});

router.post('/', (req, res) => {
    let { NombreModelo } = req.body;

    if (!NombreModelo) {
        return res.status(400).json({ error: "El campo NombreModelo es obligatorio." });
    }

    NombreModelo = NombreModelo.trim().toUpperCase();

    if (NombreModelo.length === 0) {
        return res.status(400).json({ error: "El nombre del modelo no puede estar vacío." });
    }

    db.query("SELECT * FROM Modelo WHERE UPPER(NombreModelo) = ?", [NombreModelo], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Error al buscar el modelo." });
        }

        if (result.length > 0) {
            return res.status(409).json({ error: "El modelo ya está registrado." });
        }

        db.query("INSERT INTO Modelo (NombreModelo) VALUES (?)", [NombreModelo], (errInsert, response) => {
            if (errInsert) {
                return res.status(500).json({ error: "Error al insertar el modelo." });
            }

            return res.status(201).json({
                message: "Modelo creado exitosamente.",
                modelo: {
                    id: response.insertId,
                    NombreModelo
                }
            });
        });
    });
});

router.put('/', (req, res) => {
    const { id } = req.query;
    let { NombreModelo } = req.body;

    if (!id) {
        return res.status(400).json({ error: "Se requiere el ID del modelo a actualizar." });
    }

    if (!NombreModelo) {
        return res.status(400).json({ error: "El campo NombreModelo es obligatorio." });
    }

    NombreModelo = NombreModelo.trim().toUpperCase();

    if (NombreModelo.length === 0) {
        return res.status(400).json({ error: "El nombre del modelo no puede estar vacío." });
    }

    db.query("SELECT * FROM Modelo WHERE Id = ?", [id], (errSelect, result) => {
        if (errSelect) {
            return res.status(500).json({ error: "Error al buscar el modelo." });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "Modelo no encontrado." });
        }

        db.query("SELECT * FROM Modelo WHERE UPPER(NombreModelo) = ? AND Id != ?", [NombreModelo, id], (errCheck, resultCheck) => {
            if (errCheck) {
                return res.status(500).json({ error: "Error al verificar duplicados." });
            }

            if (resultCheck.length > 0) {
                return res.status(409).json({ error: "Ya existe otro modelo con ese nombre." });
            }

            db.query("UPDATE Modelo SET NombreModelo = ? WHERE Id = ?", [NombreModelo, id], (errUpdate, resultUpdate) => {
                if (errUpdate) {
                    return res.status(500).json({ error: "Error al actualizar el modelo." });
                }

                return res.json({
                    message: "Modelo actualizado exitosamente.",
                    modelo: {
                        id,
                        NombreModelo
                    }
                });
            });
        });
    });
});

router.delete('/', (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Se requiere el ID del modelo a eliminar." });
    }

    db.query("SELECT * FROM Modelo WHERE Id = ?", [id], (errSelect, result) => {
        if (errSelect) {
            return res.status(500).json({ error: "Error al buscar el modelo." });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "Modelo no encontrado." });
        }

        db.query("DELETE FROM Modelo WHERE Id = ?", [id], (errDelete, resultDelete) => {
            if (errDelete) {
                return res.status(500).json({ error: "Error al eliminar el modelo." });
            }

            return res.json({
                message: "Modelo eliminado exitosamente.",
                modeloEliminado: result[0]
            });
        });
    });
});

module.exports = router;
