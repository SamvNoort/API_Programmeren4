const chai = require('chai')
const chaiHttp = require('chai-http')
const server = require('../index')
const db = require('../src/dao/mysql-db')
const logger = require('../src/util/logger')
 
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

describe('UC301 toevoegen van een maaltijd', () => {

    const endpointToTest = '/api/meal/create'
    let agent

    beforeEach((done) => {
        console.log('before each test')

        // maak de testdatabase leeg zodat we onze testen kunnen uitvoeren.
        db.getConnection(function (err, connection) {
            if (err) throw err // not connected!

            // Use the connection
            connection.query(
                CLEAR_DB + INSERT_USER + INSERT_MEALS,
                function (error, results, fields) {
                    // When done with the connection, release it.
                    connection.release()

                    // Handle error after the release.
                    if (error) throw error
                    // Let op dat je done() pas aanroept als de query callback eindigt!
                    logger.debug('beforeEach done')
                }
            )
        })

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
            })
        done()
    })

    it('TC-301-1 gebruiker is niet ingelogd', (done) => {
        chai.request(server)
            .post(endpointToTest)
            .send({
                name: 'testMeal',
                description: 'test description',
                price: '29.99',
                datetime: '2022-05-22 13:35:00',
                imageURL: 'http://example.com/pasta.jpg'
            }).end((err, res) => {
                chai.expect(res).to.have.status(401)
                chai.expect(res).not.to.have.status(200)
                res.body.should.have.property('message').that.is.a('string').equals('Authorization header missing!')
            })
        done()
    })
})