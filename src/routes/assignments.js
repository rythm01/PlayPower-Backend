const express = require('express');
const { createAssignment,getAssignments, updateAssignment,deleteAssignment } = require('../controllers/assignments');
const upload = require('../utils/multer');
const { isAuthenticatedTeacher } = require('../middleware/auth');

const router = express.Router();

router.route("/teacher/Add").post(isAuthenticatedTeacher,upload.fields([{ name: 'assessmentFile', maxCount: 1 }]), createAssignment);
router.route("/teacher/Update/:assId").put(isAuthenticatedTeacher, upload.fields([{ name: 'assessmentFile', maxCount: 1 }]), updateAssignment);
router.route("/teacher/delete/:assId").delete(isAuthenticatedTeacher,deleteAssignment);
router.route("/assignments").get(getAssignments);

module.exports = router;