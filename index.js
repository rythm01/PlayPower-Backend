const express = require('express');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 4000;
const cors = require('cors');
const cookieParser = require('cookie-parser')
const assign = require('./src/models/assignments')
const sub = require('./src/models/submissions')
const user = require('./src/models/users')

const authRouts = require('./src/routes/authentication')
const assRouts = require('./src/routes/assignments')
const subRouts = require('./src/routes/submission')

var corsOpetions = {
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true//enable creadentials for cookies & authorization headers
};

app.use(cors(corsOpetions));
app.use(cookieParser());

const ErrorHandler = require('./src/utils/errorhandler');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//all api endpoints
app.use("/api", authRouts,assRouts,subRouts)


app.get("/", async (req, res) => {
    res.status(200).json("Welcome to College Assessment api!");
});

const server = app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
    try {
        user.createUserTable();
        assign.createAssignmentTable();
        sub.createSubmitionTable();
    } catch (err) {
        console.log(err);
    }
})

// unhandled promise rejection
process.on("unhandledRejection", (err) => {
    console.log(`Error : ${err.message}`);
    console.log(`Shutting down the server due to Unhandled Promise Rejection`);

    server.close(() => {
        process.exit(1);
    })
})