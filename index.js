// app.mjs
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());

// Usa cors con opciones específicas
const frontendURL = 'https://mercadopagotest.medidasdigitales.com';
app.use(
  cors({
    origin: frontendURL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  })
);

// Middleware de conexión a la base de datos
app.use((req, res, next) => {
  // Configuración de la conexión a la base de datos
  const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  connection.connect((err) => {
    if (err) {
      console.error('Error al conectar a la base de datos:', err);
      res.status(500).send('Internal Server Error');
    } else {
      console.log('Conectado a la base de datos MySQL');
      req.dbConnection = connection; // Adjuntar la conexión al objeto de solicitud
      next(); // Continuar con la siguiente middleware/ruta
    }
  });
});

// Ruta de prueba para obtener datos de la base de datos
app.get('/transacciones', (req, res) => {
  const connection = req.dbConnection; // Obtener la conexión desde el objeto de solicitud
  connection.query('SELECT * FROM transacciones', (err, results) => {
    if (err) {
      console.error('Error al ejecutar la consulta:', err);
      res.status(500).send('Error en el servidor');
      return;
    }
    res.json(results);
  });
});

// Ruta para crear una nueva transacción (POST)
app.post('/transacciones', (req, res) => {
  const connection = req.dbConnection; // Obtener la conexión desde el objeto de solicitud

  try {
    const nuevaTransaccion = req.body;

    // Realizar la inserción en la base de datos
    const {
      tipo_pago,
      estado,
      monto,
      moneda,
      id_pago,
      id_usuario,
      nombre_persona,
      email_persona,
    } = nuevaTransaccion;

    connection.query(
      'INSERT INTO transacciones (tipo_pago, estado, monto, moneda, id_pago, id_usuario, nombre_persona, email_persona) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [tipo_pago, estado, monto, moneda, id_pago, id_usuario, nombre_persona, email_persona],
      (error, results) => {
        if (error) {
          console.error('Error al ejecutar la consulta:', error);
          res.status(500).send('Internal Server Error');
          return;
        }

        // Verificar si la inserción fue exitosa y enviar respuesta
        if (results && results.insertId !== undefined) {
          res.status(201).json({ message: 'Transacción creada con éxito', id: results.insertId });
        } else {
          res.status(500).send('Error al procesar la solicitud');
        }
      }
    );
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en port: ${port}`);
});

