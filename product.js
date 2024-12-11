import cors from 'cors';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

import cookieParser from 'cookie-parser';
import { methods as authentication } from './controllers/authentication.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuración de la conexión a MySQL
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'prk2',
};

let connection;

// Crear conexión a la base de datos
async function initDB() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Conexión a MySQL exitosa.');

    // Crear tabla de productos si no existe
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock INT NOT NULL,
        image_path VARCHAR(255),
        category VARCHAR(255)
      )
    `);
    // Crear tabla de carrito si no existe
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id)  
      )
    `);
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.message);
    process.exit(1);
  }
}

// Crear carpeta para imágenes si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Iniciar el servidor
const app = express();
app.listen(4000, () => console.log('Server on port 4000'));


// Rutas estáticas
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

//Configuracion
app.use(cookieParser());

// Configuración de CORS
app.use(cors());

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });


// Middleware para parsear JSON
app.use(express.json());


// Ruta para la interfaz principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "src/home/home.html"));
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "src/home/home.html"));
});

app.get("/Login",(req, res) =>{
  res.sendFile(__dirname + "/src/login.html")
})

app.get("/Register",(req,res)=>{
  res.sendFile(__dirname + "/src/register.html")
})

app.get("/Profile",(req,res)=>{
  res.sendFile(__dirname + "/src/profile.html")
})
app.get("/Admin",(req,res)=>{
  res.sendFile(__dirname + "/src/admin.html")
})

//Autentication
app.post("/api/register",authentication.register)
app.post("/api/login",authentication.login)


// Ruta para subir un producto
app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !price || !stock) {
      return res.status(400).json({ error: 'Los campos nombre, precio y stock son obligatorios.' });
    }

    const [result] = await connection.execute(
      'INSERT INTO products (name, description, price, stock, image_path, category) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || null, parseFloat(price), parseInt(stock), imagePath, category || null]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      image_path: imagePath,
    });
  } catch (error) {
    console.error('Error al guardar el producto:', error.message);
    res.status(500).json({ error: `No se pudo guardar el producto: ${error.message}` });
  }
});

// Ruta para obtener todos los productos
app.get('/api/products', async (req, res) => {
  try {
    const [products] = await connection.execute('SELECT * FROM products');
    res.json(products);
  } catch (error) {
    console.error('Error al obtener los productos:', error.message);
    res.status(500).json({ error: `Error al obtener los productos: ${error.message}` });
  }
});


// Carrito de compras
app.post('/api/cart/add', async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body;
    const [existingItem] = await connection.execute(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
      [user_id, product_id]
    );

    if (existingItem.length > 0) {
      await connection.execute(
        'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
        [quantity, user_id, product_id]
      );
    } else {
      await connection.execute(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [user_id, product_id, quantity]
      );
    }

    res.status(200).json({ message: 'Producto agregado al carrito' });
  } catch (error) {
    console.error('Error al agregar producto al carrito:', error.message);
    res.status(500).json({ error: 'Error al agregar producto al carrito' });
  }
});

// Obtener el carrito de un usuario
app.get('/api/cart/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const [cartItems] = await connection.execute(
      `SELECT ci.id, ci.quantity, p.name, p.price, p.image_path 
       FROM cart_items ci 
       JOIN products p ON ci.product_id = p.id 
       WHERE ci.user_id = ?`,
      [user_id]
    );
    res.json(cartItems);
  } catch (error) {
    console.error('Error al obtener el carrito:', error.message);
    res.status(500).json({ error: 'Error al obtener el carrito' });
  }
});

// Inicializar la base de datos
initDB();

