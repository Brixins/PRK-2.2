import { createPool } from 'mysql2/promise';


export const db = createPool({
    user: "root",
    /*
    password: "",
    host: "localhost",
    */
    port: 3308,
    database: "prk2"
})