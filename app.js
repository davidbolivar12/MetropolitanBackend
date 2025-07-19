const express = require('express');
const cors = require('cors');


const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

app.use("/API/vehiculo", require("./Routes/Vehiculo.js"));
app.use("/API/marca", require("./Routes/Marca.js"));
app.use("/API/modelo", require("./Routes/Modelo.js"));
app.use("/API/servicio", require("./Routes/Servicio.js"));


app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});