const http = require("http")
const path = require("path")
const fs = require("fs")
const {v4: uuid} = require("uuid")


/*
- Instalar rut.js
- Verificar que el RUT que intenten registrar sea válido en caso contrario devolver un mensaje
- Después de verificar el RUT aplicar un format para que sean guardados con el mismo formato

- En el editar no permitir que se reciba el RUT. No se debe avanzar al proceso de edición para este caso
- En el editar validar que se reciba el ID.

- En el eliminar si no envian el id en la petición devolver un mensaje
- En el eliminar si no existe el id en el archivo devolver un mensaje
*/

http.createServer((req, res) => {
    const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`)
    const params = new URLSearchParams(searchParams)
    
    //Ruta para listar personas
    if(pathname === '/personas' && req.method === 'GET'){
        const data = fs.readFileSync(`${__dirname}/data/personas.txt`)
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
            fs.writeFileSync(`${__dirname}/data/personas.txt`, texto, "utf8")
            res.write("Persona registrada con éxito")
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
            const data = fs.readFileSync(`${__dirname}/data/personas.txt`,"utf8")
            const arreglo = JSON.parse(data)
            const indice = arreglo.findIndex(persona => persona.id === json.id)

            if(indice !== -1) {
                arreglo[indice] = { ...arreglo[indice], ...json}
            }
            //Validar cuando el id no exista, devolver un mensaje y no permitir la edición
            const texto = JSON.stringify(arreglo)
            fs.writeFileSync(`${__dirname}/data/personas.txt`, texto,"utf8")
            res.write("Persona actualizada con éxito")
            return res.end()
        })
    }

    //Ruta para eliminar personas
    if(pathname === '/personas' && req.method === 'DELETE') {
        const id=params.get("id")
        const data = fs.readFileSync(`${__dirname}/data/personas.txt`,"utf8")
        const arreglo = JSON.parse(data)
        const indice = arreglo.findIndex(persona => persona.id == id)

        if(indice != -1) {
            arreglo.splice(indice,1)
        }
        const texto = JSON.stringify(arreglo)
        fs.writeFileSync(`${__dirname}/data/personas.txt`, texto, "utf8")
        res.write("Persona eliminada con éxito")
        return res.end()
    }

    res.write("Ruta no válida")
    res.end()
}).listen(3000, () => console.log("Server ejecutando en la ruta http://localhost:3000"))