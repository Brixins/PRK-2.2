import dotenv from 'dotenv'
import  jsonwebtoken from "jsonwebtoken"

dotenv.config();

function profileAcceso(req, res, next){

    const cookieJWT = req.headers.cookie.split(("; ").find(cookie => cookie.startsWith("jwt=")).slice(4))
    console.log("This you Cookie: ",cookieJWT)

    const decodificado = jsonwebtoken.verify(cookieJWT,process.env.JWT_SECRETO)
    console.log(decodificado)

}
 


function publicAcceso(){

}
export const methods = {
    profileAcceso,
    publicAcceso
}