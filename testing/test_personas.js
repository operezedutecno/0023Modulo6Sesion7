const chai = require("chai")
const chaiHttp = require("chai-http")
const { servidor } = require("../index")

chai.use(chaiHttp)

describe("Pruebas para el listado de personas (GET)", () => {
  it("Comprobación de respuesta código 200", (done) => {
    chai.request(servidor).get("/personas").end((error, respuesta) => {
        chai.expect(respuesta).to.have.status(200)
        done();
    })
  })
  it("Comprobar que la respuesta sea un arreglo", (done) => {
    chai.request(servidor).get("/personas").end((error, respuesta) => {
      chai.expect(respuesta.body).to.have.property("length")
      done();
    })
  })
  it("Comprobar que la primera persona contenga id, rut, nombre y apellido", (done) => {
    chai.request(servidor).get("/personas").end((error, respuesta) => {
      chai.expect(respuesta.body[0]).to.have.property("rut")
      chai.expect(respuesta.body[0]).to.have.property("nombre")
      chai.expect(respuesta.body[0]).to.have.property("apellido")
      chai.expect(respuesta.body[0]).to.have.property("id")
      done();
    })
  })
})


describe("Pruebas para el registro de personas (POST)", () => {
  it("La petición contiene rut, nombre y apellido", (done) => {
    chai.request(servidor).post("/personas").send({ rut: "11111111-1"}).end( (error, respuesta) => {
      chai.expect(respuesta).to.have.status(400)
      chai.expect(respuesta.text).to.equal("La petición debe contener rut, nombre y apellido")
      done()
    })
  })

  it("Cuando la petición contiene un rut invalido, devuelve 400", (done) => {
    const persona = { rut: "11111111-2", nombre: "José", apellido: "Valles" } 
    chai.request(servidor).post("/personas").send(persona).end( (error, respuesta) => {
      chai.expect(respuesta).to.have.status(400)
      chai.expect(respuesta.text).to.equal("Rut inválido por favor verificar")
      done()
    })
  })
})