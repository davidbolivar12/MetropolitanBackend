const express = require('express');
const router = express.Router();
const db = require('../conexion');


router.get('/', (req, res) => {
    const { id } = req.query;

    if (id) {
        db.query("SELECT * FROM Marca WHERE id = ?", [id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: "Error al obtener la marca." });
            }
            if (result.length === 0) {
                return res.status(404).json({ error: `No se encontró la marca con id ${id}.` });
            }
            return res.json(result[0]);
        });
    } else {
        db.query("SELECT * FROM Marca", (err, result) => {
            if (err) {
                return res.status(500).json({ error: "Error al obtener las marcas." });
            }
            return res.json(result);
        });
    }
});

router.post('/', (req, res) => {
    let { NombreMarca } = req.body;

    if (!NombreMarca) {
        return res.status(400).json({ error: "El campo NombreMarca es obligatorio." });
    }

    NombreMarca = NombreMarca.trim().toUpperCase();

    if (NombreMarca.length === 0) {
        return res.status(400).json({ error: "El nombre de la marca no puede estar vacío." });
    }

    db.query("SELECT * FROM Marca WHERE UPPER(NombreMarca) = ?", [NombreMarca], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Error al buscar la marca." });
        }

        if (result.length > 0) {
            return res.status(409).json({ error: "La marca ya está registrada." });
        }

        db.query("INSERT INTO Marca (NombreMarca) VALUES (?)", [NombreMarca], (errInsert, response) => {
            if (errInsert) {
                return res.status(500).json({ error: "Error al insertar la marca." });
            }

            return res.status(201).json({
                message: "Marca creada exitosamente.",
                marca: {
                    id: response.insertId,
                    NombreMarca
                }
            });
        });
    });
});

router.put('/', (req, res) => {
    const { id } = req.query;
    let { NombreMarca } = req.body;

    if (!id) {
        return res.status(400).json({ error: "Se requiere el ID de la marca a actualizar." });
    }

    if (!NombreMarca) {
        return res.status(400).json({ error: "El campo NombreMarca es obligatorio." });
    }

    NombreMarca = NombreMarca.trim().toUpperCase();

    if (NombreMarca.length === 0) {
        return res.status(400).json({ error: "El nombre de la marca no puede estar vacío." });
    }

    db.query("SELECT * FROM Marca WHERE Id = ?", [id], (errSelect, result) => {
        if (errSelect) {
            return res.status(500).json({ error: "Error al buscar la marca." });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "Marca no encontrada." });
        }

        db.query("SELECT * FROM Marca WHERE UPPER(NombreMarca) = ? AND Id != ?", [NombreMarca, id], (errCheck, resultCheck) => {
            if (errCheck) {
                return res.status(500).json({ error: "Error al verificar duplicados." });
            }

            if (resultCheck.length > 0) {
                return res.status(409).json({ error: "Ya existe otra marca con ese nombre." });
            }

            db.query("UPDATE Marca SET NombreMarca = ? WHERE Id = ?", [NombreMarca, id], (errUpdate, resultUpdate) => {
                if (errUpdate) {
                    return res.status(500).json({ error: "Error al actualizar la marca." });
                }

                return res.json({
                    message: "Marca actualizada exitosamente.",
                    marca: {
                        id,
                        NombreMarca
                    }
                });
            });
        });
    });
});

router.delete('/', (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Se requiere el ID de la marca a eliminar." });
    }

    db.query("SELECT * FROM Marca WHERE Id = ?", [id], (errSelect, result) => {
        if (errSelect) {
            return res.status(500).json({ error: "Error al buscar la marca." });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "Marca no encontrada." });
        }

        db.query("DELETE FROM Marca WHERE Id = ?", [id], (errDelete, resultDelete) => {
            if (errDelete) {
                return res.status(500).json({ error: "Error al eliminar la marca." });
            }

            return res.json({
                message: "Marca eliminada exitosamente.",
                marcaEliminada: result[0]
            });
        });
    });
});

module.exports = router;
