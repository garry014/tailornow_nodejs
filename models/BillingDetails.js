const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const BillingDetails = db.define('BillingDetails', {
    firstname: {
        type: Sequelize.STRING
    },
    lastname: {
        type: Sequelize.STRING
    },
    username: {
        type: Sequelize.STRING
    },
    address1: {
        type: Sequelize.STRING
    },
    address2: {
        type: Sequelize.STRING
    },
    city: {
        type: Sequelize.STRING
    },
    postalcode: {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING
    },
    phoneno: {
        type: Sequelize.STRING
    },
    deliverytime: {
        type: Sequelize.STRING,
    },
    deliverydate: {
        type: Sequelize.DATE
    }
});

module.exports = BillingDetails;