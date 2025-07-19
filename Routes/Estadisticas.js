const express = require('express');
const router = express.Router();
const db = require('../conexion');

// Obtener estadísticas por ID o por nombre del modelo
router.get('/', (req, res) => {
    const { id, modelo } = req.query;

    if (id) {
        db.query(`
            SELECT e.*, m.NombreModelo, s.NombreServicio 
            FROM EstadisticasVehiculo e
            JOIN Modelo m ON e.IdModelo = m.Id
            JOIN servicio s ON e.IdServicioReservado = s.Id
            WHERE e.Id = ?`,
            [id],
            (err, result) => {
                if (err) return res.status(500).json({ error: "Error al obtener la estadística por ID." });
                if (result.length === 0) return res.status(404).json({ error: `No se encontró estadística con ID ${id}.` });
                return res.json(result[0]);
            }
        );
    } else if (modelo) {
        db.query(`
            SELECT e.*, m.NombreModelo, s.NombreServicio 
            FROM EstadisticasVehiculo e
            JOIN Modelo m ON e.IdModelo = m.Id
            JOIN servicio s ON e.IdServicioReservado = s.Id
            WHERE UPPER(m.NombreModelo) = ?`,
            [modelo.toUpperCase()],
            (err, result) => {
                if (err) return res.status(500).json({ error: "Error al buscar estadísticas por modelo." });
                if (result.length === 0) return res.status(404).json({ error: `No se encontraron estadísticas para el modelo '${modelo}'.` });
                return res.json(result);
            }
        );
    } else {
        db.query(`
            SELECT e.*, m.NombreModelo, s.NombreServicio 
            FROM EstadisticasVehiculo e
            JOIN Modelo m ON e.IdModelo = m.Id
            JOIN servicio s ON e.IdServicioReservado = s.Id`,
            (err, result) => {
                if (err) return res.status(500).json({ error: "Error al obtener las estadísticas." });
                return res.json(result);
            }
        );
    }
});

// Crear una nueva estadística
router.post('/', (req, res) => {
    const { IdServicioReservado, VecesReservado, IdModelo } = req.body;

    if ([IdServicioReservado, VecesReservado, IdModelo].some(v => v === undefined)) {
        return res.status(400).json({ error: "Todos los campos son obligatorios: IdServicioReservado, VecesReservado, IdModelo." });
    }

    const parsed = [IdServicioReservado, VecesReservado, IdModelo].map(Number);
    if (parsed.some(v => isNaN(v) || v < 0)) {
        return res.status(400).json({ error: "Los valores deben ser numéricos y no negativos." });
    }

    db.query("SELECT * FROM servicio WHERE Id = ?", [IdServicioReservado], (errServicio, servicioResult) => {
        if (errServicio) return res.status(500).json({ error: "Error al validar el servicio." });
        if (servicioResult.length === 0) {
            return res.status(404).json({ error: `No existe un servicio con ID ${IdServicioReservado}.` });
        }

        db.query("SELECT * FROM Modelo WHERE Id = ?", [IdModelo], (errModelo, modeloResult) => {
            if (errModelo) return res.status(500).json({ error: "Error al validar el modelo." });
            if (modeloResult.length === 0) {
                return res.status(404).json({ error: `No existe un modelo con ID ${IdModelo}.` });
            }

            db.query(
                "INSERT INTO EstadisticasVehiculo (IdServicioReservado, VecesReservado, IdModelo) VALUES (?, ?, ?)",
                [IdServicioReservado, VecesReservado, IdModelo],
                (errInsert, resultInsert) => {
                    if (errInsert) return res.status(500).json({ error: "Error al insertar la estadística." });

                    return res.status(201).json({
                        message: "Estadística creada exitosamente.",
                        estadistica: {
                            id: resultInsert.insertId,
                            IdServicioReservado,
                            VecesReservado,
                            IdModelo
                        }
                    });
                }
            );
        });
    });
});

// Actualizar una estadística por ID
router.put('/', (req, res) => {
    const { id } = req.query;
    const { IdServicioReservado, VecesReservado, IdModelo } = req.body;

    if (!id) return res.status(400).json({ error: "Se requiere el ID de la estadística a actualizar." });

    if ([IdServicioReservado, VecesReservado, IdModelo].some(v => v === undefined)) {
        return res.status(400).json({ error: "Todos los campos son obligatorios: IdServicioReservado, VecesReservado, IdModelo." });
    }

    const parsed = [IdServicioReservado, VecesReservado, IdModelo].map(Number);
    if (parsed.some(v => isNaN(v) || v < 0)) {
        return res.status(400).json({ error: "Todos los valores deben ser numéricos y no negativos." });
    }

    db.query("SELECT * FROM EstadisticasVehiculo WHERE Id = ?", [id], (errFind, resultFind) => {
        if (errFind) return res.status(500).json({ error: "Error al buscar la estadística." });
        if (resultFind.length === 0) {
            return res.status(404).json({ error: `No se encontró una estadística con ID ${id}.` });
        }

        db.query("SELECT * FROM servicio WHERE Id = ?", [IdServicioReservado], (errServicio, servicioResult) => {
            if (errServicio) return res.status(500).json({ error: "Error al validar el servicio." });
            if (servicioResult.length === 0) {
                return res.status(404).json({ error: `No existe un servicio con ID ${IdServicioReservado}.` });
            }

            db.query("SELECT * FROM Modelo WHERE Id = ?", [IdModelo], (errModelo, modeloResult) => {
                if (errModelo) return res.status(500).json({ error: "Error al validar el modelo." });
                if (modeloResult.length === 0) {
                    return res.status(404).json({ error: `No existe un modelo con ID ${IdModelo}.` });
                }

                db.query(
                    "UPDATE EstadisticasVehiculo SET IdServicioReservado = ?, VecesReservado = ?, IdModelo = ? WHERE Id = ?",
                    [IdServicioReservado, VecesReservado, IdModelo, id],
                    (errUpdate, resultUpdate) => {
                        if (errUpdate) return res.status(500).json({ error: "Error al actualizar la estadística." });

                        return res.json({
                            message: "Estadística actualizada exitosamente.",
                            estadistica: {
                                id: Number(id),
                                IdServicioReservado,
                                VecesReservado,
                                IdModelo
                            }
                        });
                    }
                );
            });
        });
    });
});

// Eliminar una estadística por ID
router.delete('/', (req, res) => {
    const { id } = req.query;

    if (!id) return res.status(400).json({ error: "Se requiere el ID de la estadística a eliminar." });

    db.query("SELECT * FROM EstadisticasVehiculo WHERE Id = ?", [id], (errFind, resultFind) => {
        if (errFind) return res.status(500).json({ error: "Error al buscar la estadística." });

        if (resultFind.length === 0) {
            return res.status(404).json({ error: `No se encontró una estadística con ID ${id}.` });
        }

        db.query("DELETE FROM EstadisticasVehiculo WHERE Id = ?", [id], (errDelete, resultDelete) => {
            if (errDelete) return res.status(500).json({ error: "Error al eliminar la estadística." });

            return res.json({
                message: "Estadística eliminada exitosamente.",
                estadisticaEliminada: resultFind[0]
            });
        });
    });
});

module.exports = router;
