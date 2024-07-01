process.env.DB_DATABASE = process.env.DB_DATABASE || 'share-a-meal-testdb'
process.env.LOGLEVEL = 'trace'

const chai = require('chai')
const chaiHttp = require('chai-http')
const assert = require('assert')
const jwt = require('jsonwebtoken')
const jwtSecretKey = require('../src/util/config').secretkey
const db = require('../src/dao/mysql-db')
const server = require('../index')
const logger = require('../src/util/logger')
require('dotenv').config()

chai.should()
chai.use(chaiHttp)

const CLEAR_MEAL_TABLE = 'DELETE IGNORE FROM `meal`;'
const CLEAR_PARTICIPANTS_TABLE = 'DELETE IGNORE FROM `meal_participants_user`;'
const CLEAR_USERS_TABLE = 'DELETE IGNORE FROM `user`;'
const CLEAR_DB = CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE

/**
 * Voeg een user toe aan de database. Deze user heeft id 1.
 * Deze id kun je als foreign key gebruiken in de andere queries, bv insert meal.
 */
const INSERT_USER =
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city` ) VALUES' +
    '(1, "first", "last", "name@server.nl", "secret", "street", "city"),' + 
    '(2, "test", "name", "s.vannoort2@student.avans.nl", "JMGaming", "street", "city");'

/**
 * Query om twee meals toe te voegen. Let op de cookId, die moet matchen
 * met een bestaande user in de database.
 */
const INSERT_MEALS =
    'INSERT INTO `meal` (`id`, `name`, `description`, `imageUrl`, `dateTime`, `maxAmountOfParticipants`, `price`, `cookId`) VALUES' +
    "(1, 'Meal A', 'description', 'image url', NOW(), 5, 6.50, 1)," +
    "(2, 'Meal B', 'description', 'image url', NOW(), 5, 6.50, 1);"

let token = ''

describe('UC201 Registreren als nieuwe user', () => {

    beforeEach((done) => {
        logger.debug('beforeEach called')
        // maak de testdatabase leeg zodat we onze testen kunnen uitvoeren.
        db.getConnection(function (err, connection) {
            if (err) throw err // not connected!

            // Use the connection
            connection.query(
                CLEAR_DB + INSERT_USER,
                function (error, results, fields) {
                    // When done with the connection, release it.
                    connection.release()

                    // Handle error after the release.
                    if (error) throw error
                    // Let op dat je done() pas aanroept als de query callback eindigt!
                    logger.debug('beforeEach done')
                    done()
                }
            )
        })
    })

    const endpointToTest = '/api/user'
    /**
     * Voorbeeld van een beforeEach functie.
     * Hiermee kun je code hergebruiken of initialiseren.
     */
    beforeEach((done) => {
        console.log('Before each test')
        done()
    })

    /**
     * Hier starten de testcases
     */
    it('TC-201-1 Verplicht veld ontbreekt', (done) => {
        chai.request(server)
            .post(endpointToTest)
            .send({
                // firstName: 'Voornaam', ontbreekt
                lastName: 'Achternaam',
                emailAdress: 'v.a@server.nl'
            })
            .end((err, res) => {
                /**
                 * Voorbeeld uitwerking met chai.expect
                 */
                chai.expect(res).to.have.status(400)
                chai.expect(res).not.to.have.status(200)
                chai.expect(res.body).to.be.a('object')
                chai.expect(res.body).to.have.property('status').equals(400)
                chai.expect(res.body)
                    .to.have.property('message')
                    .equals('Missing or incorrect firstName field')
                chai
                    .expect(res.body)
                    .to.have.property('data')
                    .that.is.a('object').that.is.empty

                done()
            })
    })

    it('TC-201-2 Niet-valide email adres', (done) => {
        chai.request(server)
            .post(endpointToTest)
            .send({
                firstName: 'Voornaam',
                lastName: 'Achternaam',
                emailAdress: 'v.a@server',
                password:"secret",
                city:'breda',
                street:'straatlaan'
            })
            .end((err, res) => {
                /**
                 * Voorbeeld uitwerking met chai.expect
                 */
                chai.expect(res).to.have.status(400);
                chai.expect(res).not.to.have.status(200);
                chai.expect(res.body).to.be.a('object');
                chai.expect(res.body).to.have.property('status').equals(400);
                chai
                    .expect(res.body)
                    .to.have.property('message')
                    .equals(`Invalid emailAdress: expected 'v.a@server' to match ${/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/}`);
                chai
                    .expect(res.body)
                    .to.have.property('data')
                    .that.is.a('object').that.is.empty
                done()
            })
    }),

    it('TC-201-3 Niet-valide password', (done) => {
        chai.request(server)
            .post(endpointToTest)
            .send({
                firstName: 'Voornaam',
                lastName: 'Achternaam',
                emailAdress: 'v.a@server',
                password:'',
                city:'breda',
                street:'straatlaan'
            })
            .end((err, res) => {
                /**
                 * Voorbeeld uitwerking met chai.expect
                 */
                chai.expect(res).to.have.status(400)
                chai.expect(res).not.to.have.status(200)
                chai.expect(res.body).to.be.a('object')
                chai.expect(res.body).to.have.property('status').equals(400)
                chai.expect(res.body)
                    .to.have.property('message')
                    .equals('Missing or incorrect password field')
                chai
                    .expect(res.body)
                    .to.have.property('data')
                    .that.is.a('object').that.is.empty

                done()
        })
    }),

    it('TC-201-4 Gebruiker bestaat al', (done) => {
        chai.request(server)
            .post(endpointToTest)
            .send({
                firstName: 'Voornaam',
                lastName: 'Achternaam',
                emailAdress: 'name@server.nl',
                password: 'secret',
                city: 'Breda',
                street:'ridderstraat'
            })
            .end((err, res) => {
                chai.expect(res).to.have.status(500);
                chai.expect(res).not.to.have.status(200);
                chai.expect(res.body).to.be.a('object');
                chai.expect(res.body).to.have.property('status').equals(500);
                res.body.should.have.property('message').that.is.a('string').equals(`Duplicate entry 'name@server.nl' for key 'user.emailAdress'`)
                
                

                done()
            })
    })

    it('TC-201-5 Gebruiker succesvol geregistreerd', (done) => {
        chai.request(server)
            .post(endpointToTest)
            .send({
                firstName: 'Voornaam',
                lastName: 'Achternaam',
                emailAdress: 'joe2test@server.nl',
                password: 'secret',
                city: 'Breda',
                street:'ridderstraat'
            })
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.be.a('object')

                res.body.should.have.property('data').that.is.a('object')
                res.body.should.have.property('message').that.is.a('string')

                const data = res.body.data
                data.should.have.property('firstName').equals('Voornaam')
                data.should.have.property('lastName').equals('Achternaam')
                data.should.have.property('emailAdress')
                data.should.have.property('id').that.is.a('number')

                done()
            })
    })
})

describe('UC-202 opvragen van overzicht users', () => {

    const endpointToTest = '/api/user'
    let agent

    beforeEach((done) => {
        console.log('before each test')
        agent = chai.request.agent(server)
        // Simulate login
        agent
            .post('/api/auth/login')
            .send({
                emailAdress: 'name@server.nl',
                password: 'secret'
            })
            .end((err, res) => {
                res.should.have.status(200)
                token = res.body.data.token
                done()
            })
    })

    it('TC-202-1 Opvragen van alle users', (done) => {
        agent
            .get(endpointToTest)
            .set('Authorization', `Bearer ${token}`) // Set the Authorization header
            .end((err, res) => {
                chai.expect(res).to.have.status(200)
                chai.expect(res).not.to.have.status(400)
 
                done()
            })
    })
})

describe('UC203 Opvragen van een gebruikersprofiel', () => {
    const endpointToTest = '/api/user/profile'
    let agent
 
    beforeEach((done) => {
        agent = chai.request.agent(server)
        // Simulate login
        agent
            .post('/api/auth/login')
            .send({
                emailAdress: 'name@server.nl',
                password: 'secret'
            })
            .end((err, res) => {
                res.should.have.status(200)
                token = res.body.data.token
                done()
            })
    })

    it('TC-203-1 Opvragen van een gebruikersprofiel', (done) => {
        agent
            .get(endpointToTest)
            .set('Authorization', `Bearer ${token}`) // Set the Authorization header
            .end((err, res) => {
                chai.expect(res).to.have.status(200)
                chai.expect(res).not.to.have.status(400)
                chai.expect(res.body).to.be.a('object')
                done()
            })
    })

})