const db = require('../config/connection');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const bcrypt = require('bcryptjs');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/errorhandler');

// Register a user
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password, role } = req.body;

    var pass = await bcrypt.hash(password, 10);

    try {
        const sql = `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`;

        db.query(sql, [name, email, pass, role], function (err, result) {
            if (err) {
                console.error(err);
                return next(new ErrorHandler("Unable to register user", 400));
            }

            //if user registered successfully then retrive that row
            const rId = result.insertId;

            const token = jwt.sign({ userId: rId, email, role }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRE
            });

            const user = `select * from users where user_id = ?`;

            db.query(user, [rId], function (err, resObj) {
                if (err) {
                    console.error(err);
                    return next(new ErrorHandler("Unable to fetch user data", 400));
                }

                const user = resObj[0];

                const tokenCookie = cookie.serialize('tokenjwt', token, {
                    expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
                    httpOnly: true
                });

                res.setHeader('Set-Cookie', tokenCookie);

                res.status(201).json({ message: "User registered successfully", user });
            })

        });
    } catch (err) {
        console.log(err);
        return next(new ErrorHandler("Unable to proceed", 400));
    }
});

// login user
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
    }

    const sql = `SELECT * FROM users WHERE email = ?`;

    db.query(sql, [email], function (err, result) {
        if (err) {
            console.error(err);
            return next(new ErrorHandler("Invalid email or password", 401));
        }

        if (result.length === 0) {
            return next(new ErrorHandler("Invalid email or password", 401));
        }

        const user = result[0];
        const storedPasswordHash = user.password_hash;

        bcrypt.compare(password, storedPasswordHash, function (err, isPasswordMatched) {
            if (err || !isPasswordMatched) {
                return next(new ErrorHandler("Invalid email or password", 401));
            }

            const token = jwt.sign({ userId: user.user_id, email: user.email ,role: user.role }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRE
            });

            const tokenCookie = cookie.serialize('tokenjwt', token, {
                expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
                httpOnly: true
            });

            res.setHeader('Set-Cookie', tokenCookie);

            res.status(200).json({ message: "User logged in successfully", user });
        });
    });
});

//Logout user 
exports.logout = catchAsyncErrors(async (req, res, next) => {

    res.cookie("tokenjwt", null, {
        httponly: true,
        expires: new Date(Date.now()),
        path: "/api"
    });

    res.status(200).json({
        success: true,
        message: "Logged out"
    })
});