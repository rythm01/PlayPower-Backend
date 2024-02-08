const db = require('../config/connection');

class Assignment {

    static createAssignmentTable() {
        const sql = `
        CREATE TABLE IF NOT EXISTS assignments (
            assignment_id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            assessment_url VARCHAR(255), -- Storing the Cloudinary URL
            due_date DATE,
            total_score INT,
            teacher_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON UPDATE CASCADE
        )`;
        return db.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Assignment table created!" + result);
        })
    }

}

module.exports = Assignment;