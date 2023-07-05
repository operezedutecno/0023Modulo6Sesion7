const http = require("http")
const path = require("path")
const fs = require("fs")
const {v4: uuid} = require("uuid")
const {validate, format} = require("rut.js")
const axios = require("axios")


/*
- Instalar rut.js
- Verificar que el RUT que intenten registrar sea válido en caso contrario devolver un mensaje
- Después de verificar el RUT aplicar un format para que sean guardados con el mismo formato

- En el editar no permitir que se reciba el RUT. No se debe avanzar al proceso de edición para este caso
- En el editar validar que se reciba el ID.
- Validar cuando el id no exista, devolver un mensaje y no permitir la edición

- En el eliminar si no envian el id en la petición devolver un mensaje
- En el eliminar si no existe el id en el archivo devolver un mensaje
*/

// Requerimientos Sábado 01/07/2023
/*
- Implementar axios
- Crear un archivo para guardar personajes de star wars
- Crear una ruta que reciba un id, con ese id consultaremos en la API de star wars y el personaje que nos devuelva
    lo registraremos en el archivo.(Se puede enviar el id por el body y por el querystring)
- Se debe validar en el registro si el personaje ya está registrado.
- Crear una ruta que permita visualizar los personajes ya registrados.
*/

const servidor = http.createServer((req, res) => {
    const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`)
    const params = new URLSearchParams(searchParams)
    
    //Ruta para listar personas
    if(pathname === '/personas' && req.method === 'GET'){
        const data = fs.readFileSync(`${__dirname}/data/personas.txt`)
        res.writeHead(200, {"Content-type": "application/json"})
        res.write(data)
        return res.end() //Finalización de la petición
    }

    // Ruta para registrar personas
    if(pathname === '/personas' && req.method === 'POST'){
        let json
        req.on("data", (datos) => {
            json = JSON.parse(datos)
        })

        return req.on("end", () => {

            if(json.rut === undefined || json.nombre === undefined || json.apellido === undefined) {
                res.statusCode = 400
                res.write("La petición debe contener rut, nombre y apellido")
                return res.end()
            }
            json.id = uuid()
            if(!validate(json.rut)){
                res.statusCode = 400
                res.write("Rut inválido por favor verificar")
                return res.end()
            }
            json.rut = format(json.rut)
            const data = fs.readFileSync(`${__dirname}/data/personas.txt`)
            const arreglo = JSON.parse(data)
            //Validacion de RUT
            const busqueda = arreglo.some(persona => persona.rut === json.rut)
            if(busqueda) {
                res.write("Este RUT ya se encuentra en nuestros registros")
                return res.end() //Finalización de la petición
            }
            arreglo.push(json)
            const texto = JSON.stringify(arreglo)
            fs.writeFileSync(`${__dirname}/data/personas.txt`, texto, "utf8")
            res.writeHead(200, {"Content-type": "application/json"})
            res.write(JSON.stringify(json))
            res.end() //Finalización de la petición
        })
    }

    // Ruta para modificar persona
    if(pathname === '/personas' && req.method === 'PUT'){
        let json
        req.on("data", (data) => {
            json = JSON.parse(data)
        })
        return req.on("end", () => {
            if(json.rut) {
                res.statusCode = 400
                res.write("No es posible editar el RUT, corregir la petición")
                return res.end();
            }
            if(!json.id) {
                res.statusCode = 400
                res.write("Por favor enviar el id de la persona a modificar")
                return res.end();
            }
            const data = fs.readFileSync(`${__dirname}/data/personas.txt`,"utf8")
            const arreglo = JSON.parse(data)
            const indice = arreglo.findIndex(persona => persona.id === json.id)

            if(indice !== -1) {
                arreglo[indice] = { ...arreglo[indice], ...json}
            } else {
                res.statusCode = 400
                res.write("Está intentado modificar un id no existente, por favor verificar")
                return res.end()
            }
            
            const texto = JSON.stringify(arreglo)
            fs.writeFileSync(`${__dirname}/data/personas.txt`, texto,"utf8")
            res.writeHead(200, { "Content-type":"application/json"})
            res.write(JSON.stringify(arreglo[indice]))
            return res.end()
        })
    }

    //Ruta para eliminar personas
    if(pathname === '/personas' && req.method === 'DELETE') {
        const id=params.get("id")
        if(!id) {
            res.statusCode = 400
            res.write("Por favor enviar el id de la persona a eliminar")
            return res.end();
        }
        const data = fs.readFileSync(`${__dirname}/data/personas.txt`,"utf8")
        const arreglo = JSON.parse(data)
        const indice = arreglo.findIndex(persona => persona.id == id)

        if(indice != -1) {
            arreglo.splice(indice,1)
        } else {
            res.statusCode = 404
            res.write("El id enviado no se encuentra registrado, por favor verificar")
            return res.end()
        }
        const texto = JSON.stringify(arreglo)
        fs.writeFileSync(`${__dirname}/data/personas.txt`, texto, "utf8")
        res.write("Persona eliminada con éxito")
        return res.end()
    }

    // Agregar personajes de Star Wars
    if(pathname === '/star-wars/agregar' && req.method === 'POST') {
        let json
        req.on("data", (datos) => {
            json = JSON.parse(datos)
        })
        return req.on("end", async () => {
            try {
                if(json.id === undefined){
                    res.write("Por favor enviar el id del personaje")
                    return res.end()
                }
                const id = json.id
                const respuesta = await axios.get(`https://swapi.dev/api/people/${id}`)

                const datos = fs.readFileSync(`${__dirname}/data/starwars.txt`,"utf8")
                const arreglo = JSON.parse(datos)
                const validacion = arreglo.some(personaje => personaje.url === respuesta.data.url)

                if(validacion){
                    res.write("El personaje fue registrado previamente")
                    return res.end()
                }

                arreglo.push(respuesta.data)
                const texto = JSON.stringify(arreglo)
                fs.writeFileSync(`${__dirname}/data/starwars.txt`, texto, "utf8")
                res.write(`Personaje Star Wars agregado con éxito ${respuesta.data.name}`);
                return res.end();
            } catch (error) {
                if(error.response.status === 404) {
                    res.write("Imposible conseguir los datos del personaje");    
                } else {
                    res.write("Ocurrió un error consultando la API de Star Wars");
                }
                return res.end();
            }
        })
    }

    // Listar Personajes de Star Wars
    if(pathname === '/star-wars/listar' && req.method === 'GET') {
        const datos = fs.readFileSync(`${__dirname}/data/starwars.txt`,"utf8")
        res.write(datos)
        return res.end()
    }

    res.write("Ruta no válida")
    res.end()
}).listen(3000, () => console.log("Server ejecutando en la ruta http://localhost:3000"))


module.exports = { servidor }