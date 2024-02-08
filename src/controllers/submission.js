const db = require("../config/connection");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/errorhandler");
const cloudinary = require("../utils/cloudinary");
const jwt = require("jsonwebtoken");


//global method to convert file into uri
const uploadAndCreateDocument = async (file) => {
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            resource_type: 'auto',
            folder: 'assignments',
        });

        return result.secure_url;
    } catch (error) {
        console.log(error);
        throw new ErrorHandler("Unable to upload to Cloudinary", 400);
    }
};

//make submission
exports.createSubmission = catchAsyncErrors(async (req, res, next) => {

    const assignmentId = req.params.assId;

    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const studentId = decoded.userId;

    const submissionFile = req.file; // Uploaded submission file

    const submissionUrl = await uploadAndCreateDocument(submissionFile);

    // Inserting the submission into the database
    const sql = `INSERT INTO submissions (assignment_id, student_id, submission_file) VALUES (?, ?, ?)`;

    db.query(sql, [assignmentId, studentId, submissionUrl], function (err, result) {
        if (err) {
            console.error(err);
            return next(new ErrorHandler("Unable to submit assignment", 400));
        }

        const submission = result;

        res.status(201).json({ message: "Submission Done!", submission });
    });
});

//get all submission details
exports.getSubmission = catchAsyncErrors(async (req, res, next) => {
    try {
        const sql = `select * from submissions`;

        db.query(sql, function (err, results) {
            if (err) {
                console.error(err);
                return next(new ErrorHandler("Unable to fetch submissions", 400));
            }

            res.status(200).json({
                success: true,
                assignments: results,
            });
        });
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Something went wrong", 500));
    }
});

//grade submission(Update)
exports.gradeSubmission = catchAsyncErrors(async (req, res, next) => {
    try {
        const { score } = req.body;
        const sql = `UPDATE submissions SET score = ? WHERE submission_id = ?`;

        db.query(sql, [score,req.params.subId],function (err, results) {
            if (err) {
                console.error(err);
                return next(new ErrorHandler("Unable to grade given submission", 400));
            }

            res.status(200).json({
                success: true,
                assignments: results,
            });
        });
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Something went wrong", 500));
    }
});