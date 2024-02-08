const db = require('../config/connection');

class Submissions {

    static createSubmitionTable() {
        const sql = `
        CREATE TABLE IF NOT EXISTS submissions (
            submission_id INT AUTO_INCREMENT PRIMARY KEY,
            assignment_id INT,
            student_id INT,
            submission_file VARCHAR(255),
            score INT,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id) ON UPDATE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(user_id) ON UPDATE CASCADE
        )`;
        return db.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Submition table created!" + result);
        })
    }

}

module.exports = Submissions;