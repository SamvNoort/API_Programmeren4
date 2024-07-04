const chai = require('chai')
const chaiHttp = require('chai-http')
const server = require('../index')
const tracer = require('tracer')
 
describe('UC101 Login', () => {
    const endpointToTest = '/api/auth/login'
    beforeEach((done) => {
        console.log('Before each test')
        done()
    })
    it('TC-101-1 Verplicht veld ontbreekt', (done) => {
        chai.request(server)
            .post(endpointToTest)
            .send({
                // emailAdress: 'v.a@server', ontbreekt
                password: 'secret'
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(409)
                chai.expect(res).not.to.have.status(200)
                chai.expect(res.body).to.be.a('object')
                chai.expect(res.body).to.have.property('status').equals(409)
                chai.expect(res.body)
                    .to.have.property('message')
                    .equals(
                        'AssertionError [ERR_ASSERTION]: email must be a string.'
                    )
                chai
                    .expect(res.body)
                    .to.have.property('data')
                    .that.is.a('object').that.is.empty
                done()
            })
    })
    it('TC-101-2 Niet-valide email adres', (done) => {
        chai.request(server)
            .post(endpointToTest)
            .send({
                emailAdress: 'v.a@server',
                password: 'secret'
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(409)
                chai.expect(res).not.to.have.status(200)
                chai.expect(res.body).to.be.a('object')
                chai.expect(res.body).to.have.property('status').equals(409)
                chai.expect(res.body)
                    .to.have.property('message')
                    .equals(
                        'User not found or password invalid'
                    )
                chai
                    .expect(res.body)
                    .to.have.property('data')
                    .that.is.a('object').that.is.empty
                done()
            })
    })
    it('TC-101-3 Niet-valide wachtwoord', (done) => {
        chai.request(server)
            .post(endpointToTest)
            .send({
                emailAdress: 's.vannoort2@student.avans.nl',
                password: 'notsecret'
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(409)
                chai.expect(res).not.to.have.status(200)
                chai.expect(res.body).to.be.a('object')
                chai.expect(res.body).to.have.property('status').equals(409)
                chai.expect(res.body)
                    .to.have.property('message')
                    .equals(
                        'User not found or password invalid'
                    )
                chai
                    .expect(res.body)
                    .to.have.property('data')
                    .that.is.a('object').that.is.empty
                done()
            })
    })
    it('TC-101-4 Succesvolle login', (done) => {
        chai.request(server)
            .post(endpointToTest)
            .send({
                emailAdress: 'm.vandullemen@server.nl',
                password: 'secret'
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(200)
                chai.expect(res.body).to.be.a('object')
                chai.expect(res.body).to.have.property('status').equals(200)
                chai.expect(res.body)
                    .to.have.property('message')
                    .equals('User logged in')
                chai.expect(res.body)
                    .to.have.property('data')
                    .that.is.a('object')
                done()
            })
    })
})