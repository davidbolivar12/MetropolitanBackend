const express = require('express');
const router = express.Router();
const db = require('../conexion');

const baseQuery = `
    SELECT 
        v.Id,
        v.CapacidadPasajeros,
        v.CapacidadMaletas,
        mo.NombreModelo AS Modelo,
        ma.NombreMarca AS Marca
    FROM Vehiculo v
    JOIN Modelo mo ON v.IdModelo = mo.Id
    JOIN Marca ma ON v.IdMarca = ma.Id
`;

router.get('/', (req, res) => {
    const { maletas, pasajeros } = req.query;

    const maletasNum = Number(maletas);
    const pasajerosNum = Number(pasajeros);

    if ((maletas && isNaN(maletasNum)) || (pasajeros && isNaN(pasajerosNum))) {
        return res.status(400).json({ error: "Los valores de maletas y pasajeros deben ser numéricos." });
    }

    if ((maletas && maletasNum < 0) || (pasajeros && pasajerosNum < 0)) {
        return res.status(400).json({ error: "Los valores de maletas y pasajeros no pueden ser negativos." });
    }

    if (maletas && pasajeros) {
        db.query(
            `${baseQuery} WHERE v.CapacidadMaletas >= ? AND v.CapacidadPasajeros >= ?`,
            [maletasNum, pasajerosNum],
            (err, response) => {
                if (err) return res.status(500).json({ error: "Error al obtener los vehículos." });

                if (response.length > 0) return res.json(response);

                db.query(
                    `${baseQuery} WHERE v.CapacidadMaletas >= ?`,
                    [maletasNum],
                    (errMaletas, vehiculosMaletas) => {
                        if (errMaletas) return res.status(500).json({ error: "Error al comprobar capacidad de maletas." });

                        db.query(
                            `${baseQuery} WHERE v.CapacidadPasajeros >= ?`,
                            [pasajerosNum],
                            (errPasajeros, vehiculosPasajeros) => {
                                if (errPasajeros) return res.status(500).json({ error: "Error al comprobar capacidad de pasajeros." });

                                if (vehiculosMaletas.length > 0 && vehiculosPasajeros.length === 0) {
                                    return res.status(404).json({
                                        error: "Hay vehículos con suficiente capacidad para maletas, pero no para pasajeros.",
                                        detalle: { maletas: maletasNum, pasajeros: pasajerosNum }
                                    });
                                }

                                if (vehiculosMaletas.length === 0 && vehiculosPasajeros.length > 0) {
                                    return res.status(404).json({
                                        error: "Hay vehículos con suficiente capacidad para pasajeros, pero no para maletas.",
                                        detalle: { maletas: maletasNum, pasajeros: pasajerosNum }
                                    });
                                }

                                return res.status(404).json({
                                    error: "No hay vehículos que cumplan con la capacidad de maletas ni de pasajeros.",
                                    detalle: { maletas: maletasNum, pasajeros: pasajerosNum }
                                });
                            }
                        );
                    }
                );
            }
        );
        return;
    }

    if (pasajeros) {
        db.query(
            `${baseQuery} WHERE v.CapacidadPasajeros >= ?`,
            [pasajerosNum],
            (err, response) => {
                if (err) return res.status(500).json({ error: "Error al obtener los vehículos." });
                if (response.length === 0) return res.status(404).json({ error: "No hay vehículos con suficiente capacidad de pasajeros." });
                return res.json(response);
            }
        );
        return;
    }

    if (maletas) {
        db.query(
            `${baseQuery} WHERE v.CapacidadMaletas >= ?`,
            [maletasNum],
            (err, response) => {
                if (err) return res.status(500).json({ error: "Error al obtener los vehículos." });
                if (response.length === 0) return res.status(404).json({ error: "No hay vehículos con suficiente capacidad de maletas." });
                return res.json(response);
            }
        );
        return;
    }

    db.query(baseQuery, (err, response) => {
        if (err) return res.status(500).json({ error: "Error al obtener los vehículos." });
        return res.json(response);
    });
});

router.post('/', (req, res) => {
    let { CapacidadPasajeros, CapacidadMaletas, Modelo, Marca } = req.body;

    if (
        CapacidadPasajeros === undefined ||
        CapacidadMaletas === undefined ||
        !Modelo ||
        !Marca
    ) {
        return res.status(400).json({
            error: "Todos los campos son obligatorios: CapacidadPasajeros, CapacidadMaletas, Modelo, Marca.",
        });
    }

    CapacidadPasajeros = Number(CapacidadPasajeros);
    CapacidadMaletas = Number(CapacidadMaletas);

    if (isNaN(CapacidadPasajeros) || isNaN(CapacidadMaletas)) {
        return res.status(400).json({
            error: "CapacidadPasajeros y CapacidadMaletas deben ser valores numéricos.",
        });
    }

    if (CapacidadPasajeros <= 0 || CapacidadMaletas < 0) {
        return res.status(400).json({
            error: "CapacidadPasajeros debe ser mayor a 0 y CapacidadMaletas no puede ser negativa.",
        });
    }

    Modelo = Modelo.toUpperCase();
    Marca = Marca.toUpperCase();

    db.query(
        "SELECT Id FROM Modelo WHERE UPPER(NombreModelo) = ?",
        [Modelo],
        (errModelo, resultModelo) => {
            if (errModelo) return res.status(500).json({ error: "Error al buscar el modelo." });
            if (resultModelo.length === 0) return res.status(404).json({ error: `No se encontró el modelo '${Modelo}'` });

            const IdModelo = resultModelo[0].Id;

            db.query(
                "SELECT Id FROM Marca WHERE UPPER(NombreMarca) = ?",
                [Marca],
                (errMarca, resultMarca) => {
                    if (errMarca) return res.status(500).json({ error: "Error al buscar la marca." });
                    if (resultMarca.length === 0) return res.status(404).json({ error: `No se encontró la marca '${Marca}'` });

                    const IdMarca = resultMarca[0].Id;

                    db.query(
                        "SELECT * FROM Vehiculo WHERE IdModelo = ? AND IdMarca = ?",
                        [IdModelo, IdMarca],
                        (errCheck, existingVehicles) => {
                            if (errCheck) return res.status(500).json({ error: "Error al verificar duplicados." });
                            if (existingVehicles.length > 0) {
                                return res.status(409).json({
                                    error: "Este vehículo ya está registrado.",
                                    detalle: { Modelo, Marca },
                                });
                            }

                            db.query(
                                "INSERT INTO Vehiculo (CapacidadPasajeros, CapacidadMaletas, IdModelo, IdMarca) VALUES (?, ?, ?, ?)",
                                [CapacidadPasajeros, CapacidadMaletas, IdModelo, IdMarca],
                                (errInsert, response) => {
                                    if (errInsert) return res.status(500).json({ error: "Error al insertar el vehículo." });
                                    if (response.affectedRows === 0) return res.status(400).json({ error: "No se pudo agregar el vehículo." });

                                    res.status(201).json({
                                        message: "Vehículo agregado exitosamente.",
                                        vehiculo: {
                                            id: response.insertId,
                                            CapacidadPasajeros,
                                            CapacidadMaletas,
                                            Modelo,
                                            Marca
                                        }
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

router.put('/', (req, res) => {
    const { id } = req.query;
    let { Modelo, Marca, CapacidadPasajeros, CapacidadMaletas } = req.body;

    if (!id) {
        return res.status(400).json({ error: "Se requiere el ID del vehículo a actualizar." });
    }

    if (!Modelo || !Marca || CapacidadPasajeros === undefined || CapacidadMaletas === undefined) {
        return res.status(400).json({
            error: "Todos los campos son obligatorios: Modelo, Marca, CapacidadPasajeros, CapacidadMaletas.",
        });
    }

    CapacidadPasajeros = Number(CapacidadPasajeros);
    CapacidadMaletas = Number(CapacidadMaletas);

    if (isNaN(CapacidadPasajeros) || isNaN(CapacidadMaletas)) {
        return res.status(400).json({ error: "Capacidades deben ser valores numéricos." });
    }

    if (CapacidadPasajeros <= 0 || CapacidadMaletas < 0) {
        return res.status(400).json({
            error: "CapacidadPasajeros debe ser mayor que 0 y CapacidadMaletas no puede ser negativa.",
        });
    }

    Modelo = Modelo.toUpperCase();
    Marca = Marca.toUpperCase();

    db.query("SELECT Id FROM Modelo WHERE UPPER(NombreModelo) = ?", [Modelo], (errModelo, modeloResult) => {
        if (errModelo) return res.status(500).json({ error: "Error al buscar el modelo." });
        if (modeloResult.length === 0) return res.status(404).json({ error: `No se encontró el modelo '${Modelo}'.` });

        const IdModelo = modeloResult[0].Id;

        db.query("SELECT Id FROM Marca WHERE UPPER(NombreMarca) = ?", [Marca], (errMarca, marcaResult) => {
            if (errMarca) return res.status(500).json({ error: "Error al buscar la marca." });
            if (marcaResult.length === 0) return res.status(404).json({ error: `No se encontró la marca '${Marca}'.` });

            const IdMarca = marcaResult[0].Id;

            db.query(
                `SELECT * FROM Vehiculo 
                 WHERE IdModelo = ? AND IdMarca = ? AND CapacidadPasajeros = ? AND CapacidadMaletas = ? AND Id != ?`,
                [IdModelo, IdMarca, CapacidadPasajeros, CapacidadMaletas, id],
                (errCheck, duplicado) => {
                    if (errCheck) return res.status(500).json({ error: "Error al verificar duplicados." });
                    if (duplicado.length > 0) {
                        return res.status(409).json({
                            error: "Ya existe otro vehículo con esa misma combinación de modelo, marca y capacidades.",
                        });
                    }

                    db.query(
                        `UPDATE Vehiculo 
                         SET IdModelo = ?, IdMarca = ?, CapacidadPasajeros = ?, CapacidadMaletas = ?
                         WHERE Id = ?`,
                        [IdModelo, IdMarca, CapacidadPasajeros, CapacidadMaletas, id],
                        (errUpdate, result) => {
                            if (errUpdate) return res.status(500).json({ error: "Error al actualizar el vehículo." });
                            if (result.affectedRows === 0) return res.status(404).json({ error: "Vehículo no encontrado." });

                            return res.json({
                                message: "Vehículo actualizado exitosamente.",
                                vehiculo: {
                                    id,
                                    Modelo,
                                    Marca,
                                    CapacidadPasajeros,
                                    CapacidadMaletas,
                                },
                            });
                        }
                    );
                }
            );
        });
    });
});

router.delete('/', (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Se requiere el ID del vehículo a eliminar." });
    }

    db.query(`${baseQuery} WHERE v.Id = ?`, [id], (errSelect, result) => {
        if (errSelect) return res.status(500).json({ error: "Error al buscar el vehículo." });

        if (result.length === 0) {
            return res.status(404).json({ error: "Vehículo no encontrado." });
        }

        db.query("DELETE FROM Vehiculo WHERE Id = ?", [id], (errDelete, resultDelete) => {
            if (errDelete) return res.status(500).json({ error: "Error al eliminar el vehículo." });
            if (resultDelete.affectedRows === 0) return res.status(400).json({ error: "No se pudo eliminar el vehículo." });

            return res.json({
                message: "Vehículo eliminado exitosamente.",
                vehiculoEliminado: result[0],
            });
        });
    });
});

module.exports = router;
