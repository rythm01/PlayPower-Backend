const db = require('../config/connection');

class User{

    static createUserTable(){
        const sql = `CREATE TABLE IF NOT EXISTS users (user_id INT AUTO_INCREMENT PRIMARY KEY,username VARCHAR(255) NOT NULL,password_hash VARCHAR(255) NOT NULL,email VARCHAR(255) NOT NULL,
        UNIQUE (email),role VARCHAR(255) DEFAULT 'Student')`;
        return db.query(sql,function(err,result){
            if(err) throw err;
            console.log("User Table crated!");
        })
    }
    
}

module.exports = User;