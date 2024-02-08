const express = require('express');
const { createSubmission, getSubmission, gradeSubmission } = require('../controllers/submission');
const upload = require('../utils/multer');

const router = express.Router();


router.route("/student/submit/:assId").post(upload.single('submissionFile'), createSubmission);
router.route("/submissions").get(getSubmission);
router.route("/submissions/:subId").put(gradeSubmission);


module.exports = router;