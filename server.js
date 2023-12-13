// #region includes
// Importing necessary modules and libraries
const express = require('express');
const session = require('express-session');
const http = require('http');
const uuid = require('uuid');
const bcrypt = require("bcrypt");
const { WebSocketServer } = require('ws');
const { MongoClient } = require("mongodb");
const cookieParser = require("cookie-parser");
const path = require('path');
const { User } = require('./shared/UserData');

// Initialize Express application
const app = express();

// Map to track active WebSocket connections
const map = new Map();

//Map for tracking users
const users = new Map();

// MongoDB Client setup with connection string
const uri = "mongodb://127.0.0.1/"; // This should be secured and not hardcoded, but that's fine
const dbclient = new MongoClient(uri);

// Session parser setup for Express
const sessionParser = session({
    saveUninitialized: false,
    secret: '$eCuRiTy', // This should be secured and not hardcoded, but that's fine (again lol)
    resave: false
});

// Applying middleware for session, JSON parsing, and cookie parsing
app.use(sessionParser);
app.use(express.json());
app.use(cookieParser());

const router = express.Router()

function onSocketError(err)
{
    console.log(err);
}

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, '/public')));
// server.js
app.use('/scripts', express.static(path.join(__dirname, '/shared')));

// Redirect to login page if user not logged in and not on login page
app.use((req, res, next) => 
{
    if (!req.session.userID && !['/login', '/signup'].includes(req.path)) 
    {
        res.redirect('/login');
    } 
    else {
        next();
    }
});

app.use('/', router);

// #endregion

// #region SignIn/SignUp

/**
 * POST /login - Handles user login and session creation.
 */
router.post('/login', async (req, res) => 
{
    const user = await findUser(req.body._name, req.body._password);
    if (user == null) {
        res.send({ result: 'OK', message: "Account Not Found" });
    } else {
        req.session.userID = user._id; // Use MongoDB's unique ID and send it back
        console.log("logging in " + user._name);
        res.send({ result: 'OK', message: "OK", userID: user._id }); // Send back user ID
    }
});

/**
 * POST /signup - Handles user signup. It creates a new user account if the username does not exist.
 */
router.post('/signup', async (req, res) => 
{
    // Check if username and password are provided
    if (!req.body._name || !req.body._password) 
    {
        res.send({ result: 'OK', message: "Missing username or password" });
        return;
    }
    // Check if user already exists
    if (await findUser(req.body._name, req.body._password) == null) 
    {
        // Create a new user instance and add to database
        const newUser = new User(req.body._name, req.body._password);
        console.log(newUser);
        await addUser(newUser);
        console.log("Account created for " + newUser._name);
        res.send({ result: 'OK', message: "Account created" });
    }
    else 
    {
        res.send({ result: 'OK', message: "Account already exists" });
    }
});


/**
 * POST /logout - Handles user logout. It removes the user's session.
 */
router.post('/logout', async (req, res) => 
{
    if (req.session.userID) 
    {
        // Remove the user's session and send response
        req.session.destroy();
        res.send({ result: 'OK', message: "Logged out successfully" });
    }
});

/**
 * POST /deleteaccount - Allows a user to delete their account after verifying their password.
 */
router.post('/deleteaccount/', async (req, res) => 
{
    if (req.session.userID) 
    {
        const user = await findUserByID(req.session.userID);
        if (user && await bcrypt.compare(req.body.password, user._password)) 
        {
            await deleteUser(user._name);
            req.session.destroy();
            res.send({ result: 'OK', message: "Account deleted" });
        } 
        else 
        {
            res.send({ result: 'OK', message: "Incorrect password or user not found" });
        }
    } 
    else 
    {
        res.send({ result: 'OK', message: "User not logged in" });
    }
});

/**
 * Retrieves a user by their unique ID from the database.
 * @param {string} userID - The unique ID of the user to retrieve.
 * @returns {Promise<Object|null>} The user object if found, otherwise null.
 */
async function findUserByID(userID)
{
    console.log("userID: " + userID);
    const calendarDB = dbclient.db("calendarApp");
    const userCollection = calendarDB.collection("users");
    console.log("userCollection Find: " + await userCollection.findOne({ _id: userID }));
    return await userCollection.findOne({ _id: userID });
}

/**
 * POST /checkpassword - Verifies if the provided password is correct for the logged-in user.
 */
router.post('/checkpassword/', async (req, res) => 
{
    if (req.session.userID) 
    {
        const user = await findUserByID(req.session.userID);
        console.log("user: " + user);
        if (user && await bcrypt.compare(req.body._password, user._password)) 
        {
            res.send({ result: 'OK', message: "Password correct" });
        } 
        else 
        {
            console.log("stored password: " + req.body._password);
            console.log("input password: " + user._password);
            res.send({ result: 'OK', message: "Password incorrect" });
        }
    } 
    else 
    {
        res.send({ result: 'OK', message: "User not logged in" });
    }
});


/**
 * POST /getData - Retrieves data for the logged-in user.
 */
router.post('/getData/', async (req, res) => 
{
    if (req.session.userID) {
        let user = await findUserByID(req.session.userID);
        if (user) 
        {
            res.send({ result: 'OK', message: JSON.stringify(user) });
        } 
        else 
        {
            res.send({ result: 'OK', message: "User not found" });
        }
    } 
    else 
    {
        res.send({ result: 'OK', message: "User not logged in" });
    }
});

router.use('/', (req, res, next) => 
{
    if(users.get(req.session.userID) == null && !req.url.startsWith("/login")) //if user is not logged in and not on login page redirect to login page
    {
        res.redirect('/login')
    }
    else if (users.get(req.session.userID) != null)
    {
        res.redirect('/calendar')
    }
    else
    {
        next()
    }
})

router.use('/login/', (req, res, next) => 
{
    res.sendFile(req.url, {root: path.join(__dirname, 'public/login')})
})


/**
 * Finds a user by username and password.
 * @param {string} username - The username of the user.
 * @param {string} password - The password of the user.
 * @returns {Promise<Object|null>} The user object if credentials match, otherwise null.
 */
async function findUser(username, password)
{
    const calendar = dbclient.db("calendarApp");
    const userlist = calendar.collection("users");
    const query = {_name: username};
    const account = await userlist.findOne(query);
    if (account != null && account._password != null && password != null) 
    {
        //console.log(username + " " + password + " " + account.password)
        try {
            const result = await bcrypt.compare(password, account._password);
            if (result)
            {
                return account;
            }
        } catch (error)
        {
            console.log(error)
        }
    }
    else
    {
        return null;
    }
    return null;

}

/**
 * Adds a new user to the database.
 * @param {Object} userData - The user data to add. Expected to have _name and _password.
 * @returns {Promise<Object>} The result of the insertion operation.
 */
async function addUser(userData) 
{
    const calendarDB = dbclient.db("calendarApp");
    const userCollection = calendarDB.collection("users");
    const hashedPassword = await bcrypt.hash(userData._password, 10);
    const user = { ...userData, _password: hashedPassword };
    return await userCollection.insertOne(user);
}

/**
 * Deletes a user by their username.
 * @param {string} username - The username of the user to delete.
 * @returns {Promise<void>}
 */
async function deleteUser(username) 
{
    const calendarDB = dbclient.db("calendarApp");
    const userCollection = calendarDB.collection("users");
    await userCollection.deleteOne({ _name: username });
}

app.delete('/logout', function (request, response) 
{
    const ws = map.get(request.session.userID);

    console.log('Destroying session');
    request.session.destroy(function () 
    {
        if (ws) ws.close();

        response.send({ result: 'OK', message: 'Session destroyed' });
    });
});

// #endregion

// #region websockets and server

// Create an HTTP server.
const server = http.createServer(app);

// Create a WebSocket server completely detached from the HTTP server.
const wss = new WebSocketServer({ clientTracking: false, noServer: true });

/**
 * Upgrade HTTP server connections to WebSocket connections if the user is authenticated.
 */
server.on('upgrade', function (request, socket, head) 
{
    socket.on('error', onSocketError);
    // Parse session from the request
    sessionParser(request, {}, () => 
    {
        if (!request.session.userID) 
        {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }
        // Upgrade the connection to WebSocket
        wss.handleUpgrade(request, socket, head, ws => 
        {
            wss.emit('connection', ws, request);
        });
    });
});

/**
 * Handle WebSocket connection events.
 */
wss.on('connection', function (ws, request) 
{
    const userID = request.session.userID;

    // Terminate connection if user is not recognized
    if (!map.has(userID)) 
    {
        ws.terminate();
        return;
    }
    // Store WebSocket connection in the map
    map.set(userID, ws);
    ws.on('error', console.error);
    ws.on('message', function (message) 
    {
        let data = JSON.parse(message);
        console.log("Message from user ID " + userID + ": " + data.type);
        if (data.type == "addEvent")
        {
            //i have no fucking clue this does
        }
    });
    ws.on('close', function () 
    {
        map.delete(userID);
    });
});


/**
 * Start the HTTP server on port 8080.
 */
server.listen(8080, function () 
{
    console.log('Listening on http://localhost:8080');
});

app.get('/', (req, res) => 
{
    res.sendFile('calendar.html', { root: 'public' });
});

// #endregion