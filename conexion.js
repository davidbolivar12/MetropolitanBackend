const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',        
    user: 'root',        
    password: '123456789', 
    database: 'MetropolitanDB',
    port: 3306
});


db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos: ' + err.stack);
        return;
    }
    console.log('Conectado a la base de datos MySQL como ID ' + db.threadId);
});

module.exports = db;