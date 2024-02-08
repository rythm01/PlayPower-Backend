const db = require("../config/connection");
const jwt = require("jsonwebtoken");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const cloudinary = require("../utils/cloudinary");
const ErrorHandler = require("../utils/errorhandler");
const nodemailer = require('nodemailer');

//global method to convert file into uri
const uploadAndCreateDocument = async (file) => {
    try {
        const result = await cloudinary.uploader.upload(file[0].path, {
            resource_type: 'auto',
            folder: 'assignments',
        });

        return result.secure_url;
    } catch (error) {
        console.log(error);
        throw new ErrorHandler("Unable to upload to Cloudinary", 400);
    }
};

// Create Assignment with Cloudinary URL
exports.createAssignment = catchAsyncErrors(async (req, res, next) => {
    const { title, due_date, total_score } = req.body;

    const assessmentFile = req.files.assessmentFile;

    // Extract teacher ID and email from the token
    const { tokenjwt } = req.cookies;
    const decoded = jwt.verify(tokenjwt, process.env.JWT_SECRET);

    const teacherId = decoded.userId;
    const teacherEmail = decoded.email;

    const assessment_url = await uploadAndCreateDocument(assessmentFile);

    const sql = `INSERT INTO assignments (title, due_date, total_score, teacher_id, assessment_url) VALUES (?, ?, ?, ?, ?)`;

    db.query(sql, [title, due_date, total_score, teacherId, assessment_url], function (err, result) {
        if (err) {
            console.error(err);
            return next(new ErrorHandler("Unable to create assignment", 400));
        }

        const assignmentId = result.insertId;

        const getAssignmentSql = `SELECT * FROM assignments WHERE assignment_id = ?`;

        db.query(getAssignmentSql, [assignmentId], function (err, assignmentResult) {
            if (err) {
                console.error(err);
                return next(new ErrorHandler("Unable to fetch assignment data", 400));
            }

            const assignment = assignmentResult[0];

            // Send email notifications to students
            sendAssignmentEmailToStudents(assignmentId, teacherEmail);

            res.status(201).json({ message: "Assignment created successfully", assignment });
        });
    });
});

// Send Assignment Email to Students
const sendAssignmentEmailToStudents = (assignmentId, teacherEmail) => {
    // Fetch student emails from your database
    const getStudentEmailsSql = `SELECT email FROM users WHERE role = 'Student'`;
    db.query(getStudentEmailsSql, (err, result) => {
        if (err) {
            console.error(err);
            return next(new ErrorHandler("Unable to fetch student emails", 400));
        }

        const studentEmails = result.map((student) => student.email);
        const subject = "New Assignment Available";
        const html = `A new assignment is available for you to complete. Please log in to your account to view the details.`;

        sendMailToStudents(studentEmails, subject, html, teacherEmail);
    });
};

// Send email to multiple students
const sendMailToStudents = async (toEmails, subject, html, teacherEmail) => {
    try {
        let transporter = await nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: 'ridhamchauhan693@gmail.com',
                pass: 'yrnjrpxrybemoiyg'
            }
        });

        await transporter.sendMail({
            from: teacherEmail,
            to: toEmails.join(', '), // Comma-separated list of student emails
            subject: subject,
            html: html,
        });

    } catch (error) {
        console.log('Error sending email:', error);
    }
};

//show all assignments (for students)
exports.getAssignments = catchAsyncErrors(async (req, res, next) => {
    try {
        const { due_date, total_score, sort } = req.query;

        let sql = 'SELECT * FROM assignments';

        if (due_date) {
            // Filter by due_date
            sql += ` WHERE due_date <= '${due_date}'`;
        }

        if (total_score) {
            if (due_date) {
                sql += ' AND';
            } else {
                sql += ' WHERE';
            }

            // Filter by total_score
            sql += ` total_score = ${total_score}`;
        }

        if (sort) {
            // Sort the results
            sql += ` ORDER BY ${sort}`;
        }

        db.query(sql, function (err, results) {
            if (err) {
                console.error(err);
                return next(new ErrorHandler("Unable to fetch assignments", 400));
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

//update assignment
exports.updateAssignment = async (req, res, next) => {
    let assignmentId = req.params.assId; // Retrieve assignment ID from the route parameter
    let { title, due_date, total_score } = req.body;

    try {
        // Check if the assignment with the given ID exists
        let checkAssignmentSql = `SELECT * FROM assignments WHERE assignment_id = ?`;

        db.query(checkAssignmentSql, [assignmentId], async (err, checkResult) => {
            if (err) {
                console.error(err);
                return next(new ErrorHandler("Unable to check assignment data", 400));
            }

            if (checkResult.length === 0) {
                return next(new ErrorHandler("Assignment not found", 404));
            }

            // Update the assignment based on the fields present in the request body
            let updateAssignmentSql = "UPDATE assignments SET ";
            let updateParams = [];
            let updateFields = [];

            // Handle file upload and update the assignment file
            const updateFile = req.files ? req.files.assessmentFile : null;

            if (updateFile) {
                const result = await uploadAndCreateDocument(updateFile);
                const updatedAssessmentUrl = result;

                updateFields.push("assessment_url = ?");
                updateParams.push(updatedAssessmentUrl);
            }

            if (title) {
                updateFields.push("title = ?");
                updateParams.push(title);
            }
            if (due_date) {
                updateFields.push("due_date = ?");
                updateParams.push(due_date);
            }
            if (total_score) {
                updateFields.push("total_score = ?");
                updateParams.push(total_score);
            }

            updateAssignmentSql += updateFields.join(", ");
            updateAssignmentSql += " WHERE assignment_id = ?";

            // Add the assignment ID to the parameters array
            updateParams.push(assignmentId);

            db.query(updateAssignmentSql, updateParams, (err, updateResult) => {
                if (err) {
                    console.error(err);
                    return next(new ErrorHandler("Unable to update assignment data", 400));
                }

                res.status(200).json({ message: "Assignment updated successfully" });
            });
        });
    } catch (err) {
        console.error(err);
        return next(new ErrorHandler("Something went wrong", 500));
    }
};

//delete assignment
exports.deleteAssignment = catchAsyncErrors(async (req, res, next) => {
    const id = req.params.assId;

    try {
        const sql = 'DELETE FROM assignments WHERE assignment_id = ?';

        db.query(sql, [id], function (err, result) {
            if (err) {
                console.error(err);
                return next(new ErrorHandler('Unable to delete assignment data', 400));
            }

            if (result.affectedRows === 0) {
                // No rows were deleted, which means the assignment with the given ID doesn't exist.
                return next(new ErrorHandler('Assignment not found', 404));
            }

            res.status(200).json({ message: 'Assignment deleted successfully' });
        });
    } catch (err) {
        console.error(err);
        return next(new ErrorHandler('Something went wrong!', 500));
    }
});