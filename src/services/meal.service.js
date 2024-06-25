const pool = require('../dao/mysql-db');
const logger = require('../util/logger');

const db = require('../dao/mysql-db');
 
const mealService = {
    create: (meal, callback) => {
        logger.info('create meal', meal)
        const query =
            'INSERT INTO `meal` (name, description, price, datetime, imageURL, cookId) VALUES (?, ?, ?, ?, ?, ?)'
        const params = [
            meal.name,
            meal.description,
            meal.price,
            meal.datetime,
            meal.imageURL,
            meal.cookId
        ]
 
        pool.query(query, params, (err, result) => {
            if (err) {
                logger.info(
                    'error creating meal: ',
                    err.message || 'unknown error'
                )
                callback(err, null)
            } else {
                logger.trace(`Meal created with id ${result.insertId}.`)
                callback(null, {
                    message: `Meal created with id ${result.insertId}.`,
                    data: { id: result.insertId, ...meal }
                })
            }
        })
    },

    getAll: (callback) => {
        logger.info('getAll')

        db.getConnection(function (err, connection) {
            if (err) {
                logger.error(err)
                callback(err, null)
                return
            }

            connection.query(
                'SELECT * FROM `meal`',
                function (error, results, fields) {
                    connection.release()

                    if (error) {
                        logger.error(error)
                        callback(error, null)
                    } else {
                        logger.debug(results)
                        callback(null, {
                            message: `Found ${results.length} meals.`,
                            data: results
                        })
                    }
                }
            )
        })
    },

    getMealById: (mealId, callback) => {
        logger.info('getById userId: ' + mealId);

        db.getConnection(function (err, connection) {
            if(err) {
                logger.error(err);
                callback(err, null);
                return;
            }

            connection.query(
                'SELECT *' + 
                'FROM `meal` ' + 
                'WHERE `id` = ?',
                [mealId],
                function(error, results) {
                    connection.release()

                    if (error) {
                        logger.error(error)
                        callback(error, null)
                    } else if(results.length === 0){
                        logger.info(`Meal with id ${mealId} not found`);
                        callback(null, {
                            status: 404,
                            message: 'Meal not found',
                            data: {}
                        });
                    } else {
                        logger.debug(results);
                        callback(null, {
                            status: 200,
                            message: `Found ${results.length} Meal${results.length !== 1 ? 'S' : ''}.`,
                            data: results
                        });
                    }
                });
        });
    },

    update: (mealId, meal, cookId, callback) => {
        const checkQuery = 'SELECT id FROM meal WHERE id = ?'
        const checkParams = [mealId]
 
        pool.query(checkQuery, checkParams, (checkErr, checkResult) => {
            if (checkErr) {
                logger.info(
                    'error checking meal existence: ',
                    checkErr.message || 'unknown error'
                )
                return callback(checkErr, null)
            }
 
            if (checkResult.length === 0) {
                logger.info(`Meal with id ${mealId} does not exist.`)
                return callback(
                    {
                        message: `Meal with id ${mealId} does not exist.`,
                        status: 404
                    },
                    null
                )
            }
 
            logger.info('update meal', typeof meal.cookId, typeof cookId)
            const cook = parseInt(meal.cookId)
            if (cook === cookId) {
                logger.info('update meal', mealId)
                const query =
                    'UPDATE `meal` SET name = ?, description = ?, price = ?, datetime = ?, imageURL = ?, cookId = ? WHERE id = ?'
                const params = [
                    meal.name,
                    meal.description,
                    meal.price,
                    meal.datetime,
                    meal.imageURL,
                    meal.cookId,
                    mealId
                ]
 
                pool.query(query, params, (err, result) => {
                    if (err) {
                        logger.info(
                            'error updating meal: ',
                            err.message || 'unknown error'
                        )
                        callback(err, null)
                    } else {
                        logger.trace(`Meal updated with id ${mealId}.`)
                        callback(null, {
                            message: `Meal updated with id ${mealId}.`,
                            data: { id: mealId, ...meal },
                            status: 200
                        })
                    }
                })
            } else {
                logger.info('error updating meal: ', 'unauthorized')
                callback({ message: 'unauthorized', status: 403 }, null)
            }
        })
    }
}
 
module.exports = mealService