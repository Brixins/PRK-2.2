import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken'; 
import dotenv from 'dotenv';
import { db } from '../db.js';

// Acceso a las variables de entorno
dotenv.config();


//-----


async function login(req, res) {
    try {
        console.log(req.body);

        const { email, password } = req.body;

        // Validar campos requeridos
        if (!email || !password) {
            return res.status(400).send({ status: "Error", message: "La información no es válida" });
        }

        // Verificar si el usuario existe en la base de datos
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(400).send({ status: "Error", message: "Usuario no existe" });
        }

        const revisarUsuario = rows[0]; // Tomar el primer resultado de la consulta

        // Verificar la contraseña
        const loginCorrecto = await bcryptjs.compare(password, revisarUsuario.pasw); // Verifica que pasw sea una cadena válida
        if (!loginCorrecto) {
            return res.status(400).send({ status: "Error", message: "Credenciales incorrectas" });
        }

        // Generar el token JWT
        const token = jwt.sign(
            { email: revisarUsuario.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION }
        );

        // Configurar opciones de la cookie
        const cookieOption = {
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
            path: "/", // Rango de acceso para la cookie
        };

        // Enviar la cookie con el token
        res.cookie("jwt", token, cookieOption);

        // Responder con éxito
        res.send({ status: "OK", message: "Inicio de sesión exitoso", redirect: "/profile" });
    } catch (error) {
        console.error("Error en el proceso de inicio de sesión:", error);
        res.status(500).send({ status: "Error", message: "Error interno del servidor" });
    }
}

//------


async function register(req, res) {
    try {
        console.log(req.body);

        // Validar información del usuario
        const { user, email, password } = req.body;
        if (!user || !email || !password) {
            return res.status(400).send({ status: "Error", message: "La información no es válida" });
        }

        // Verificar si el usuario ya existe en la base de datos
        const [existingUser] = await db.query(
            'SELECT * FROM users WHERE name = ?',
            [user]
        );

        if (existingUser.length > 0) {
            return res.status(400).send({ status: "Error", message: "Usuario ya registrado" });
        }

        // Encriptar la contraseña del usuario
        const salt = await bcryptjs.genSalt(4); 
        const hashedPassword = await bcryptjs.hash(password, salt);

        // Insertar usuario en la base de datos
        const result = await db.query(
            'INSERT INTO users (name, email, pasw) VALUES (?, ?, ?)',
            [user, email, hashedPassword]
        );

        console.log(result); // Verificar el resultado de la inserción
        res.status(200).send({ status: "Ok", message: "Usuario creado...", redirect: "/profile" });

    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "Error", message: "Error interno del servidor" });
    }
}

export const methods = {
    login,
    register
}
