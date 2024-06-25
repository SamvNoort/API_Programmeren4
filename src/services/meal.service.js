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
    }
}
 
module.exports = mealService