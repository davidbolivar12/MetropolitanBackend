const express = require('express');
const db = require('./conexion');
const cors = require('cors');


const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

app.use("/API/vehiculos", require("./Routes/Vehiculos.js"));

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});