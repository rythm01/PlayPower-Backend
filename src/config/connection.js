const mysql = require('mysql2');
const ErrorHandler = require('../utils/errorhandler');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,  
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

connection.connect((err)=>{
    if(err){
        return next(new ErrorHandler("Connection error!", 502));
    }
    console.log("Connected!!");
})

module.exports = connection