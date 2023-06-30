const http = require("http")
const path = require("path")
const fs = require("fs")
const {v4: uuid} = require("uuid")


http.createServer((req, res) => {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`)
    
    if(pathname === '/personas' && req.method === 'GET'){
        const data = fs.readFileSync(`${__dirname}/data/personas.txt`)
        res.write(data)
        return res.end() //Finalización de la petición
    }

    if(pathname === '/personas' && req.method === 'POST'){
        let json
        req.on("data", (datos) => {
            json = JSON.parse(datos)
        })

        return req.on("end", () => {
            json.id = uuid()
            const data = fs.readFileSync(`${__dirname}/data/personas.txt`)
            const arreglo = JSON.parse(data)
            console.log(arreglo);
            //Validacion de RUT
            const busqueda = arreglo.some(persona => persona.rut === json.rut)
            if(busqueda) {
                res.write("Este RUT ya se encuentra en nuestros registros")
                return res.end() //Finalización de la petición
            }
            arreglo.push(json)
            const texto = JSON.stringify(arreglo)
            console.log(texto)
            fs.writeFileSync(`${__dirname}/data/personas.txt`, texto, "utf8")
            res.write("Persona registrada con éxito")
            res.end() //Finalización de la petición
        })
    }

    if(pathname === '/personas' && req.method === 'PUT'){
        res.write("Actualizando Persona")
        return res.end()
    }

    if(pathname === '/personas' && req.method === 'DELETE') {
        res.write("Eliminando Persona")
        return res.end()
    }

    res.write("Ruta no válida")
    res.end()
}).listen(3000, () => console.log("Server ejecutando en la ruta http://localhost:3000"))