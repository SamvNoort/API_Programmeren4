const express = require('express')
const assert = require('assert')
const chai = require('chai')
chai.should()
const router = express.Router()
const userController = require('../controllers/user.controller')
const validateToken = require('./authentication.routes').validateToken
const logger = require('../util/logger')

// Tijdelijke functie om niet bestaande routes op te vangen
const notFound = (req, res, next) => {
    next({
        status: 404,
        message: 'Route not found',
        data: {}
    });
}

const validateUserCreate = (req, res, next) => {
    try {
        const body = req.body;
        assert(body.firstName, 'Missing or incorrect firstName field');
        assert(body.lastName, 'Missing or incorrect lastName field');
        assert(body.emailAdress, 'Missing or incorrect emailAdress field');
        assert(body.city, 'Missing or incorrect city field');
        assert(body.street, 'Missing or incorrect street field');
        assert(body.password, 'Missing or incorrect password field');

        chai.expect(body.firstName).to.not.be.empty;
        chai.expect(body.firstName).to.be.a('string');
        chai.expect(body.lastName).to.not.be.empty;
        chai.expect(body.lastName).to.be.a('string');
        chai.expect(body.street).to.not.be.empty;
        chai.expect(body.street).to.be.a('string');
        chai.expect(body.city).to.not.be.empty;
        chai.expect(body.city).to.be.a('string');
        chai.expect(req.body.emailAdress).to.be.a('string');
        chai.expect(body.emailAdress, 'Invalid emailAdress').to.match(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        );
        assert(req.body.firstName, 'Missing or incorrect password field');
        chai.expect(req.body.password).to.not.be.empty;
        chai.expect(req.body.password).to.be.a('string');
        logger.trace('User successfully validated');
        next();
    } catch (ex) {
        logger.trace('User validation failed:', ex.message)
        next({
            status: 400,
            message: ex.message,
            data: {}
        });
    }
}

const validateUpdateUser = (req, res, next) => {
    try {
        logger.trace('validateUpdateUser');
        const body = req.body
        assert(body.firstName, 'Missing or incorrect firstName field');
        assert(body.lastName, 'Missing or incorrect lastName field');
        assert(body.emailAdress, 'Missing or incorrect emailAdress field');
        assert(body.phoneNumber, 'Missing or incorrect phoneNumber field');
        assert(body.street, 'Missing or incorrect street field');
        assert(body.city, 'Missing or incorrect city field');

        chai.expect(body.firstName).to.not.be.empty;
        chai.expect(body.firstName).to.be.a('string');
        chai.expect(body.lastName).to.not.be.empty;
        chai.expect(body.lastName).to.be.a('string');

        chai.expect(body.emailAdress, 'Invalid emailAdress').to.match(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        );

        chai.expect(body.phoneNumber, 'Invalid phoneNumber').to.match(
            /^(?:\+31\s?|0)?6[\s-]?[1-9][0-9]{7}$/
        );
        next();
    } catch (ex) {
        logger.trace('User validation failed:', ex.message)
        next({
            status: 400,
            message: ex.message,
            data: {}
        });
    }
}

// Userroutes
router.post('/api/user', validateUserCreate, userController.create)
router.get('/api/user', validateToken,userController.getAll)
router.get('/api/user/profile', validateToken, userController.getProfile)
router.get('/api/user/:userId', userController.getById)
router.post('/api/user/filter', validateToken, userController.filter)
router.put('/api/user/update', validateToken, validateUpdateUser, userController.update)
router.delete('/api/user/delete', validateToken, userController.delete)

// Tijdelijke routes om niet bestaande routes op te vangen
// router.put('/api/user/:userId', notFound)
// router.delete('/api/user/:userId', notFound)

module.exports = router
