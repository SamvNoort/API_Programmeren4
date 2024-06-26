const database = require('../dao/inmem-db')
const logger = require('../util/logger')
const pool = require('../dao/mysql-db');

const db = require('../dao/mysql-db')

const userService = {
    create: (user, callback) => {
        logger.info('create user ', user)
        const query =
            'INSERT INTO `user` (firstName, lastName, emailAdress, password, city, street) VALUES (?, ?, ?, ?, ?, ?)'
        const params = [
            user.firstName,
            user.lastName,
            user.emailAdress,
            user.password,
            user.city,
            user.street
        ]
 
        pool.query(query, params, (err, result) => {
            if (err) {
                logger.info(
                    'error creating user: ',
                    err.message || 'unknown error'
                )
                callback(err, null)
            } else {
                logger.trace(`user created with id ${result.insertId}.`)
                callback(null, {
                    message: `user created with id ${result.insertId}.`,
                    data: { id: result.insertId, ...user }
                })
            }
        })
    },

    getAll: (callback) => {
        logger.info('getAll')

        // Deprecated: de 'oude' manier van werken, met de inmemory database
        // database.getAll((err, data) => {
        //     if (err) {
        //         callback(err, null)
        //     } else {
        //         callback(null, {
        //             message: `Found ${data.length} users.`,
        //             data: data
        //         })
        //     }
        // })

        // Nieuwe manier van werken: met de MySQL database
        db.getConnection(function (err, connection) {
            if (err) {
                logger.error(err)
                callback(err, null)
                return
            }

            connection.query(
                'SELECT id, firstName, lastName FROM `user`',
                function (error, results, fields) {
                    connection.release()

                    if (error) {
                        logger.error(error)
                        callback(error, null)
                    } else {
                        logger.debug(results)
                        callback(null, {
                            message: `Found ${results.length} users.`,
                            data: results
                        })
                    }
                }
            )
        })
    },

    getProfile: (userId, callback) => {
        logger.info('getProfile userId:', userId)

        db.getConnection(function (err, connection) {
            if (err) {
                logger.error(err)
                callback(err, null)
                return
            }

            connection.query(
                'SELECT id, firstName, lastName FROM `user` WHERE id = ?',
                [userId],
                function (error, results, fields) {
                    connection.release()

                    if (error) {
                        logger.error(error)
                        callback(error, null)
                    } else {
                        logger.debug(results)
                        callback(null, {
                            message: `Found ${results.length} user.`,
                            data: results
                        })
                    }
                }
            )
        })
    },

    getById: (userId, callback) => {
        logger.info('getById userId: ' + userId);

        db.getConnection(function (err, connection) {
            if(err) {
                logger.error(err);
                callback(err, null);
                return;
            }

            connection.query(
                'SELECT `emailAdress`, `phoneNumber`, `meal`.name AS mealName ' + 
                'FROM `user` ' + 
                'INNER JOIN `meal` ON `user`.`id` = `meal`.`id` ' + 
                'WHERE `user`.`id` = ?',
                [userId],
                function(error, results) {
                    connection.release()

                    if (error) {
                        logger.error(error)
                        callback(error, null)
                    } else if(results.length === 0){
                        logger.info(`User with id ${userId} not found`);
                        callback(null, {
                            status: 404,
                            message: 'User not found',
                            data: {}
                        });
                    } else {
                        logger.debug(results);
                        callback(null, {
                            status: 200,
                            message: `Found ${results.length} user${results.length !== 1 ? 'S' : ''}.`,
                            data: results
                        });
                    }
                });
        });
    },

    filter: (filter, callback) => {
        logger.info('filter', filter);
 
        db.getConnection(function (err, connection) {
            if (err) {
                logger.error(err);
                callback(err, null);
                return
            }
 
            connection.query(
                'SELECT id, firstName, lastName FROM `user` WHERE city LIKE ? AND isActive = ?',
                ['%' + filter.city + '%', filter.isActive],
                function (error, results, fields) {
                    connection.release();
 
                    if (error) {
                        logger.error(error);
                        callback(error, null);
                    } else {
                        logger.debug(results);
                        callback(null, {
                            message: `Found ${results.length} users.`,
                            data: results
                        });
                    }
                });
        });
    },

    update: (userId, user, callback) => {
        logger.info('update user', userId, user)
 
        db.getConnection(function (err, connection) {
            if (err) {
                logger.error(err)
                callback(err, null)
                return
            }
 
            connection.query(
                'UPDATE `user` SET `firstName` = ?, `lastName` = ?, `emailAdress` = ?, `phoneNumber` = ?, `street` = ?, `city` = ? WHERE `id` = ?',
                [
                    user.firstName,
                    user.lastName,
                    user.emailAdress,
                    user.phoneNumber,
                    user.street,
                    user.city,
                    userId
                ],
                function (error, results) {
                    connection.release()
 
                    if (error) {
                        logger.error(error)
                        callback(error, null)
                    } else if (results.affectedRows === 0) {
                        // No user found, return 404
                        logger.info(`User with ID ${userId} not found`)
                        callback(null, {
                            status: 404,
                            message: 'User not found',
                            data: {}
                        })
                    } else {
                        // User updated, return user details
                        logger.debug(results)
                        callback(null, {
                            status: 200,
                            message: `User with ID ${userId} updated.`,
                            data: results
                        })
                    }
                }
            )
        })
    },

    delete: (userId, callback) => {
        logger.info('delete user', userId);
 
        db.getConnection(function (err, connection) {
            if (err) {
                logger.error(err);
                callback(err, null);
                return
            }
 
            connection.query(
                'Update `user` SET isActive = 0 WHERE `id` = ?',
                [userId],
                function (error, results) {
                    connection.release()
 
                    if (error) {
                        logger.error(error)
                        callback(error, null)
                    } else if (results.affectedRows === 0) {
                        // No user found, return 404
                        logger.info(`User with ID ${userId} not found`)
                        callback(null, {
                            status: 404,
                            message: 'User not found',
                            data: {}
                        })
                    } else {
                        // User deleted, return success message
                        logger.debug(results)
                        callback(null, {
                            status: 200,
                            message: `Gebruiker met id ${userId} inactief gezet`,
                            data: results
                        });
                    }
                }
            )
        })
    }
}

module.exports = userService
