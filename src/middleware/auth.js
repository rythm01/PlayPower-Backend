const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require('jsonwebtoken');


exports.isAuthenticatedTeacher = catchAsyncErrors(async (req, res, next) => {
    const { tokenjwt } = req.cookies;


    if (!tokenjwt) {
        return next(new ErrorHandler("Please login to access the resources", 401));
    }

    const decodedData = jwt.verify(tokenjwt, process.env.JWT_SECRET);
    
    if (decodedData.role !== 'Teacher') {
        return next(new ErrorHandler("Only teachers are allowed to access this resource", 403));
    }

    // req.teacherId = decodedData.userId;
    // req.teacherEmail = decodedData.email;

    next();
});