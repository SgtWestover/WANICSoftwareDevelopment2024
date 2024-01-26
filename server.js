/*
Name: Kaelin Wang Hu, Jason Leech
Date: 11/27/2023
Last Edited: 1/8/2024
Description: express.js backend framework handling much of the server and database side functionality
*/
// #region Imports of necessary modules and libraries

// Express.js framework
const express = require('express');
// Middleware for handling session state in Express applications
const session = require('express-session');
// Core module in Node.js for HTTP server functionality
const http = require('http');
// Module for generating unique identifiers
const uuid = require('uuid');
// Library for hashing and comparing passwords securely
const bcrypt = require("bcrypt");
// WebSocket implementation for real-time communication
const { WebSocketServer } = require('ws');
// MongoDB driver for Node.js
const { MongoClient } = require("mongodb");
// Middleware for parsing cookies attached to the client request object
const cookieParser = require("cookie-parser");
// Core module in Node.js for handling file and directory paths
const path = require('path');
// Custom classes for User and CalendarEvent
const { User, CalendarEvent, CalendarTeam} = require('./shared/CalendarClasses');
// MongoDB's utility for handling ObjectIDs
const { ObjectId } = require('mongodb');
// Core module in Node.js for writing logs to the console
const { Console } = require('console');
// Initialize Express application
const app = express();
// Map to track active WebSocket connections
const map = new Map();
// Map for tracking users and session management
const users = new Map();
// MongoDB Client setup with connection string
// Security note: Connection strings should be stored in environment variables or config files
const uri = "mongodb://127.0.0.1/";
const dbclient = new MongoClient(uri);
//mongoose for schemas to store unique team codes to check against
const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema
({
    code: 
    {
        type: String,
        unique: true,
        required: true
    }
});
const Code = mongoose.model('Code', codeSchema);
mongoose.connect(uri);
// Session parser setup for Express
const sessionParser = session
({
    saveUninitialized: false,
    secret: '$eCuRiTy', //shouldnt be hard coded but oh well
    resave: false
});
// Applying middleware for session, JSON parsing, and cookie parsing
app.use(sessionParser);
app.use(express.json());
app.use(cookieParser());
// Router for handling different routes
const router = express.Router();
// Create an HTTP server using the Express app.
const server = http.createServer(app);
// Function to log WebSocket errors
// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, '/public')));
// Serve shared scripts from 'shared' directory
app.use('/scripts', express.static(path.join(__dirname, '/shared')));
// Middleware to redirect unauthenticated users to login page
app.use((req, res, next) => 
{
    if (!req.session.userID && !['/signin', '/signup'].includes(req.path)) 
    {
        res.redirect('/login');
    } 
    else 
    {
        next();
    }
});
// Use the defined router for handling requests
app.use('/', router);

// #endregion Imports of necessary modules and libraries

// #region Account and SignIn functions

// #region Sign in functions

/**
 * Handles user login and session creation.
 * @param {express.Request} req - The request object, containing user credentials.
 * @param {express.Response} res - The response message that details whether sign-in worked or not.
 * @returns {Promise<void>} - Does not return a value but sends a response to the client.
 */
router.post('/signin', async (req, res) => 
{
    const user = await findUserSignIn(req.body._name, req.body._password);
    if (user == null) 
    {
        res.send({ result: 'FAIL', message: "Sign In Unsuccessful" });
    } 
    else 
    {
        req.session.userID = user._id; // Use MongoDB's unique ID and sets it for the session for authorization
        console.log("signing in " + user._name);
        res.send({ result: 'OK', message: "Sign In Successful", userID: user._id }); // Send back user ID
    }
});

/**
 * Validates a user's sign-in credentials against the database.
 * @param {string} username - The username of the user attempting to sign in.
 * @param {string} password - The password provided by the user.
 * @returns {Promise<Object|null>} The user object if credentials are valid, otherwise null.
 */
async function findUserSignIn(username, password) 
{
    const calendar = dbclient.db("calendarApp");
    const userlist = calendar.collection("users");
    const query = { _name: username };
    const account = await userlist.findOne(query);
    if (account && account._password && password) 
    {
        try 
        {
            const result = await bcrypt.compare(password, account._password);
            return result ? account : null;
        } 
        catch (error) 
        {
            console.log(error);
            return null;
        }
    } 
    else 
    {
        return null;
    }
}

//#endregion Sign in functions

// #region Sign up functions

/**
 * Handles user signup. It creates a new user account if the username does not exist.
 * @param {express.Request} req - The request object, containing new user details.
 * @param {express.Response} res - The response object detailing whether the signup was successful or not.
 * @returns {Promise<void>} - Does not return a value but sends a response to the client.
 */
router.post('/signup', async (req, res) => 
{
    if (!req.body._name || !req.body._password) 
    {
        res.send({ result: 'FAIL', message: "Missing username or password" });
        return;
    }
    if (await findUser(req.body._name) == null) //if there is no user with that name, create a new user
    {
        const newUser = new User(req.body._name, req.body._password);
        await addUser(newUser);
        console.log("signing up " + newUser._name);
        res.send({ result: 'OK', message: "Account created" });
    } 
    else //otherwise, error
    {
        res.send({ result: 'FAIL', message: "Account already exists" });
    }
});

/**
 * Finds a user by username and password.
 * @param {string} username - The username of the user.
 * @returns {Promise<Object|null>} The user object if credentials match, otherwise null.
 */
async function findUser(username)
{
    // Define the calendar database and users collection
    const calendar = dbclient.db("calendarApp");
    const userlist = calendar.collection("users");
    // Create a query object for the username
    const query = {_name: username};
    try 
    {
        // Find the user document in the database
        const account = await userlist.findOne(query);
        // Check if an account with the username exists
        if (account != null) 
        {
            // Return the account details
            return account;
        } 
        else 
        {
            // Return null if no account is found
            return null;
        }
    } 
    catch (error)
    {
        // Log any errors that occur during the database query
        console.log(error);
        return null;
    }
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

// #endregion Sign up functions

/**
 * Handles user logout by destroying their session.
 * @param {express.Request} req - The request object with the user ID.
 * @param {express.Response} res - The response object that details whether the signout was successful or not.
 * @returns {Promise<void>} - Sends a response to the client.
 */
router.post('/signout', async (req, res) => 
{
    if (req.session.userID) 
    {
        req.session.destroy();
        res.send({ result: 'OK', message: "Signed out successfully" });
    }
});

// #region Delete account functions

/**
 * Allows a user to delete their account after verifying their password.
 * @param {express.Request} req - The request object, containing the user's password.
 * @param {express.Response} res - The response object detailing whether the account deletion was successful or not.
 * @returns {Promise<void>} - Sends a response to the client.
 */
router.post('/deleteaccount/', async (req, res) => 
{
    if (req.session.userID) 
    {
        const user = await findUserByID(req.session.userID);
        if (user && await bcrypt.compare(req.body.password, user._password)) 
        {
            await deleteUser(user._name);
            await deleteUserEvents(req.session.userID);
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
    const userObjectID = new ObjectId(userID); //this is quite retarded because mongoDB appropriates the id to an object string so we have to work with this
    const calendarDB = dbclient.db("calendarApp");
    const userCollection = calendarDB.collection("users");
    return await userCollection.findOne({ _id: userObjectID });
}

/**
 * Deletes a user by their username.
 * @param {string} username - The username of the user to delete.
 * @returns {Promise<void>}
 * //TODO: PORT OVER TO USERID INSTEAD OF USERNAME. THIS IS A TEMPORARY FIX BECUZ IM TIRED LMAO
 */
async function deleteUser(username) 
{
    const calendarDB = dbclient.db("calendarApp");
    const userCollection = calendarDB.collection("users");
    await userCollection.deleteOne({ _name: username });
}

//TODO: Make it so that if userID is the only person it can delete it, otherwise its gonna delete the functions of others
/**
 * Deletes events associated with a specific user ID.
 * @param {string} userID - The user ID whose events are to be deleted.
 * @returns {Promise<void>}
 */
async function deleteUserEvents(userID) 
{
    const calendarDB = dbclient.db("calendarApp");
    const eventsCollection = calendarDB.collection("events");
    await eventsCollection.deleteMany({ _users: { $in: [userID] } });
}

/**
 * Verifies if the provided password is correct for the logged-in user.
 * @param {express.Request} req - The request object, containing the user's password.
 * @param {express.Response} res - The response object detailing whether the password was correct or incorrect
 * @returns {Promise<void>} - Sends a response to the client.
 */
router.post('/checkpassword/', async (req, res) => 
{
    if (req.session.userID) 
    {
        const user = await findUserByID(req.session.userID);
        if (user && await bcrypt.compare(req.body._password, user._password)) 
        {
            res.send({ result: 'OK', message: "CorrectPassword" });
        } 
        else 
        {
            res.send({ result: 'OK', message: "IncorrectPassword" });
        }
    } 
    else 
    {
        res.send({ result: 'OK', message: "User not logged in" });
    }
});

// #endregion Delete account functions

//#endregion Account and SignIn functions

// #region Events

// #region Event creation

//TODO: 
/**
 * Handles the creation of a new event.
 * @param {express.Request} req - The request object, containing event details.
 * @param {express.Response} res - The response object that details whether the event was created successfully or not.
 * @returns {Promise<void>} - Sends a response to the client.
 */
router.post('/createEvent', async (req, res) => 
{
    // Validate required information
    if (!req.body._users || !req.body._name || !req.body._startDate || !req.body._endDate) 
    {
        res.send({ result: 'OK', message: "Missing information" });
        return;
    }
    // Check for event duplication
    if (await findEvent(req.body._users, req.body._name, req.body._startDate, req.body._endDate, req.body._description) == null) 
    {
        const newEvent = new CalendarEvent(null, req.body._users, req.body._name, req.body._startDate, req.body._endDate, req.body._description);
        const result = await addEvent(newEvent);
        res.status(201).send({ result: 'OK', message: "Event Created", eventID: result.insertedId });
    } 
    else 
    {
        res.send({ result: 'OK', message: "Event Duplicate" });
    }
});

/**
 * Adds a new event to the database.
 * @param {Object} eventData - The event data to add. Expected to have _name, _startDate, _endDate and _description.
 * @returns {Promise<Object>} The result of the insertion operation.
 */
async function addEvent(eventData) 
{
    const calendarDB = dbclient.db("calendarApp");
    const eventsCollection = calendarDB.collection("events");
    const result = await eventsCollection.insertOne(eventData);
    return result;
}

// #endregion Event creation

// #region Event deletion

/**
 * Deletes an event based on its ID.
 * @param {express.Request} req - The request object, containing the event ID.
 * @param {express.Response} res - The response object detailing whether the event deletion was successful or not.
 * @returns {Promise<void>} - Sends a response to the client.
 */
router.post('/deleteEvent', async (req, res) => 
{
    const eventID = req.body.eventID;
    // Validate event ID presence
    if (!eventID) 
    {
        res.send({ result: 'ERROR', message: "Missing event ID" });
        return;
    }
    try 
    {
        const eventDetails = await findEventDetails(eventID);
        if (!eventDetails) 
        {
            res.send({ result: 'ERROR', message: "Event not found" });
            return;
        }

        await deleteEvent(eventID);
        res.send({ result: 'OK', message: "Event deleted successfully" });
    } 
    catch (error) 
    {
        console.error("Error deleting event: ", error);
        res.status(500).send({ result: 'ERROR', message: "Internal Server Error" });
    }
});

/**
 * Retrieves details of a specific event from the database.
 * @param {string} eventID - The unique identifier of the event.
 * @returns {Promise<Object|null>} The event object if found, otherwise null.
 */
async function findEventDetails(eventID) 
{
    try 
    {
        const calendar = dbclient.db("calendarApp");
        const eventList = calendar.collection("events");
        const eventObjectID = new ObjectId(eventID);
        const query = { _id: eventObjectID };
        const event = await eventList.findOne(query);
        return event;
    } 
    catch (error) 
    {
        console.error("Error finding event: ", error);
        return null;
    }
}

/**
 * Deletes an event from the database based on its ID.
 * @param {string} eventID - The unique identifier of the event to be deleted.
 * @returns {Promise<void>} 
 */
async function deleteEvent(eventID) 
{
    const calendarDB = dbclient.db("calendarApp");
    const eventsCollection = calendarDB.collection("events");
    const eventObjectID = new ObjectId(eventID);
    await eventsCollection.deleteOne({ _id: eventObjectID });
}

// #endregion Event deletion

// #region Event retrieval

/**
 * Retrieves all events for a given user ID.
 * @param {express.Request} req - The request object, containing the user ID.
 * @param {express.Response} res - The response object giving either the events with the associated user if they exist.
 * @returns {Promise<void>} - Sends the events as a JSON response to the client.
 */
router.get('/getUserEvents/:userID', async (req, res) => 
{
    try 
    {
        const userID = req.params.userID;
        const events = await findEventsByUserID(userID);
        res.json(events);
    } 
    catch (error) 
    {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

/**
 * Retrieves an event by their user ID from the database.
 * @param {string} userID - The user ID of the events to retrieve.
 * @returns {Promise<Object|null>} The user object if found, otherwise null.
 */
async function findEventsByUserID(userID) 
{
    const calendarDB = dbclient.db("calendarApp");
    const eventsCollection = calendarDB.collection("events");
    // Use the $in operator to find events where the _users array contains the userID, using the mongodb array accessors
    const eventsCursor = eventsCollection.find({ _users: { $in: [userID] } });
    const userEvents = await eventsCursor.toArray();
    return userEvents;
}

/**
 * Searches for an event based on provided criteria.
 * @param {express.Request} req - The request object, containing search criteria.
 * @param {express.Response} res - The response object detailing whether the event was found or not.
 * @returns {Promise<void>} - Sends a response to the client.
 */
router.post('/findEvent', async (req, res) => 
{
    // Validate required information
    if (!req.body._users || !req.body._name || !req.body._startDate || !req.body._endDate) 
    {
        res.send({ result: 'ERROR', message: "Missing information" });
        return;
    }
    // Find the event
    const foundEventID = await findEvent(req.body._users, req.body._name, req.body._startDate, req.body._endDate, req.body._description);
    if (foundEventID) 
    {
        res.send({ result: 'OK', eventID: foundEventID });
    } 
    else 
    {
        res.send({ result: 'ERROR', message: "Event not found" });
    }
});

/**
 * Finds an event by name, dates, and description
 * @param {string} name - The name of the event
 * @param {Date} startDate - The starting date of the event
 * @param {Date} endDate - The ending date of the event
 * @param {string} description - The description of the event
 * @returns {Promise<Object|null>} The event object if an identical event is found, otherwise null.
 */
async function findEvent(users, name, startDate, endDate, description) 
{
    try 
    {
        const calendar = dbclient.db("calendarApp");
        const eventList = calendar.collection("events");
        // Create a query to find an event matching all the given criteria
        const query = 
        {
            _users: users,
            _name: name,
            _startDate: startDate,
            _endDate: endDate,
            _description: description
        };
        // Find one event that matches the query
        const event = await eventList.findOne(query);
        // If an event is found, return it; otherwise return null
        return event ? event._id.toString() : null;
    } 
    catch (error) 
    {
        console.error("Error finding event: ", error);
        return null;
    }
}

// #endregion Event retrieval

// #endregion Events

// #region Teams
router.post('/findUser', async (req, res) => 
{
    const username = req.body.username;
    if (!username) 
    {
        return res.send({ result: 'FAIL', message: 'Username is required' });
    }
    try 
    {
        const user = await findUser(username);
        if (user) 
        {
            res.send({ result: 'OK', message: 'USER FOUND', userID: user._id });
        } 
        else 
        {
            res.send({ result: 'FAIL', message: 'NO USER FOUND' });
        }
    } 
    catch (error) 
    {
        console.error('Error finding user:', error);
        res.send({ result: 'ERROR', message: 'An error occurred' });
    }
});

router.post('/findUserName', async (req, res) => 
{
    const userID = req.body.userID;
    if (!userID) 
    {
        return res.send({ result: 'FAIL', message: 'UserID is required' });
    }
    try 
    {
        const user = await findUserByID(userID);
        if (user) 
        {
            res.send({ result: 'OK', message: 'USER FOUND', username: user._name });
        } 
        else 
        {
            res.send({ result: 'FAIL', message: 'NO USER FOUND' });
        }
    } 
    catch (error) 
    {
        console.error('Error finding user by ID:', error);
        res.send({ result: 'ERROR', message: 'An error occurred' });
    }
});

router.post('/createTeam', async (req, res) => 
{
    // Validate required information
    if (!req.body._name || !req.body._users) 
    {
        res.send({ result: 'FAIL', message: "Missing information" });
        return;
    }
    try 
    {
        const teamJoinCode = await getNewCode();
        const newTeam = new CalendarTeam(null, req.body._name, req.body._description, req.body._users, teamJoinCode, null, req.body._autoJoin, req.body._joinPerms);
        const result = await addTeam(newTeam);
        if (result)
        {
            await notifyTeamUpdate(newTeam); // Notify users about the team update
            res.status(201).send({ result: 'OK', message: "Team Created", teamID: result.insertedId, teamJoinCode: teamJoinCode });
        }
    } 
    catch (error) 
    {
        // Handle error from getNewCode or addTeam
        res.status(500).send({ result: 'FAIL', message: error.message });
    }
});

async function addTeam(teamData) 
{
    const calendarDB = dbclient.db("calendarApp");
    const teamsCollection = calendarDB.collection("teams");
    const result = await teamsCollection.insertOne(teamData);
    return result;
}

/**
 * Creates a new unique random code of 8 characters, including URL-safe special characters.
 * The function generates the first 7 characters randomly, checks for uniqueness at the 8th character,
 * and backtracks if necessary.
 * @returns {string} The new unique code.
 */
async function getNewCode() 
{
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_~';

    // Function to generate a random code of a given length
    const generateRandomCode = (length) => 
    {
        let code = '';
        for (let i = 0; i < length; i++) 
        {
            code += characters[Math.floor(Math.random() * characters.length)];
        }
        return code;
    }

    // Function to check if the code exists in the database
    const codeExists = async (code) => 
    {
        const count = await Code.countDocuments({ code: code });
        return count > 0;
    }

    // Starting with 8 characters, try to find a unique 9th character
    for (let i = 8; i >= 0; i--) 
    {
        let baseCode = generateRandomCode(i);
        for (let j = 0; j < characters.length; j++) 
        {
            let testCode = baseCode + characters[j];
            if (!await codeExists(testCode)) 
            {
                // Unique code found, add it to the database and return
                let newCode = new Code({ code: testCode });
                await newCode.save();
                return testCode;
            }
        }
    }
    throw new Error('Unable to generate a unique code.');
}

router.post('/getUserTeams', async (req, res) => 
{
    try 
    {
        // Extract userID from the request
        const userID = req.body.userID;
        if (!userID) 
        {
            res.status(400).send({ result: 'FAIL', message: "Missing userID" });
            return;
        }

        // Retrieve user by ID
        const user = await findUserByID(userID);
        if (!user) 
        {
            res.status(404).send({ result: 'FAIL', message: "User not found" });
            return;
        }
        // Extract user's name
        const userName = user._name;
        // Connect to the 'teams' collection
        const calendarDB = dbclient.db("calendarApp");
        const teamsCollection = calendarDB.collection("teams");
        // Find teams where the user is a member
        const query = { [`_users.${userName}`]: { $exists: true } };
        const userTeams = await teamsCollection.find(query).toArray();
        // Send the retrieved teams
        res.status(200).send({ result: 'OK', teams: userTeams });
    } 
    catch (error) 
    {
        // Handle any errors
        res.status(500).send({ result: 'FAIL', message: error.message });
    }
});
router.post('/joinTeam', async (req, res) => 
{
    const { userID, joinCode } = req.body;
    if (!joinCode || joinCode.length !== 9) 
    {
        return res.send({ result: 'FAIL', message: 'Invalid join code' });
    }

    try 
    {
        const calendarDB = dbclient.db("calendarApp");
        const teamsCollection = calendarDB.collection("teams");
        const team = await teamsCollection.findOne({ _joinCode: joinCode });
        if (!team) 
        {
            return res.send({ result: 'FAIL', message: 'Team not found' });
        }
        const user = await findUserByID(userID);
        if (!user) 
        {
            return res.send({ result: 'FAIL', message: 'User not found' });
        }
        const userName = user._name;
        // Check if user is already in the team or queued
        if (team._users[userName] || (team._usersQueued && team._usersQueued[userName])) 
        {
            return res.send({ result: 'FAIL', message: 'Already a member or in queue' });
        }
        // Proceed with joining or queuing the user
        if (team._autoJoin) 
        {
            team._users[userName] = team._joinPerms;
            await teamsCollection.updateOne({ _id: team._id }, { $set: { _users: team._users } });
            await notifyTeamUpdate(team);
            res.send({ result: 'OK', message: 'Successfully joined the team' });
        } 
        else 
        {
            team._usersQueued = team._usersQueued || {};
            team._usersQueued[userName] = team._joinPerms;
            await teamsCollection.updateOne({ _id: team._id }, { $set: { _usersQueued: team._usersQueued } });
            res.send({ result: 'QUEUED', message: 'Added to the queue' });
        }
    }
    catch (error) 
    {
        console.error('Error joining team:', error);
        res.send({ result: 'ERROR', message: 'An error occurred' });
    }
});


async function notifyTeamUpdate(team) 
{
    const usersToUpdate = Object.keys(team._users);
    console.log("usersToUpdate: " + usersToUpdate);
    for (const username of usersToUpdate) 
    {
        try 
        {
            const user = await findUser(username);
            const userID = user._id.toString();
            console.log("hasID: " + map.has(userID));
            if (userID && map.has(userID)) 
            {
                const ws = map.get(userID);
                ws.send(JSON.stringify({ type: 'teamUpdate' }));
            }
        } 
        catch (error) 
        {
            console.error(`Error notifying user ${username}:`, error);
        }
    }
}


//#endregion teams

// #region Websockets and server

// Create a WebSocket server detached from the HTTP server.
const wss = new WebSocketServer({ clientTracking: false, noServer: true });

/**
 * Upgrades HTTP connections to WebSocket connections if the user is authenticated.
 * This is triggered on receiving an 'upgrade' request from the client.
 */
server.on('upgrade', function (request, socket, head) 
{
    // Handle any errors on the socket.
    socket.on('error', onSocketError);
    // Parse the session from the request.
    sessionParser(request, {}, () => 
    {
        // If the user is not authenticated, deny the WebSocket connection.
        if (!request.session.userID) 
        {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }
        // If authenticated, upgrade the connection to WebSocket.
        wss.handleUpgrade(request, socket, head, ws => 
        {
            wss.emit('connection', ws, request);
        });
    });
});

/**
 * Handles WebSocket connection events.
 * This function is triggered when a new WebSocket connection is established.
 */
wss.on('connection', function (ws, request) 
{
    const userID = request.session.userID;
    console.log("connected userID: " + userID);
    map.set(userID, ws);
    // Handle any errors on the WebSocket.
    ws.on('error', console.error);
    // Handle incoming messages on the WebSocket.
    ws.on('message', function (message) 
    {
        let data = JSON.parse(message);
        console.log("Message from user ID " + userID + ": " + data.type);
        // Additional handling for different message types can be implemented here.
    });
    // Handle closure of the WebSocket connection.
    ws.on('close', function () 
    {
        map.delete(userID);
    });
});

//logs the socket error if it occurs
function onSocketError(err) 
{
    console.log(err);
}

/**
 * Handles the logout process by destroying the user's session and closing their WebSocket connection if it exists.
 * @param {express.Request} request - The request object.
 * @param {express.Response} response - The response object that details whether the logout was successful.
 */
app.delete('/logout', function (request, response) 
{
    const ws = map.get(request.session.userID);

    request.session.destroy(function () 
    {
        if (ws) ws.close();
        response.send({ result: 'OK', message: 'Session destroyed' });
    });
});

/**
 * Middleware to redirect users based on their authentication status.
 * If a user is not logged in and not on the login page, they are redirected to the login page.
 * If a user is logged in, they are redirected to the calendar page.
 */
router.use('/', (req, res, next) => 
{
    if (users.get(req.session.userID) == null && !req.url.startsWith("/login")) 
    {
        res.redirect('/login');
    } 
    else if (users.get(req.session.userID) != null) 
    {
        res.redirect('/calendar');
    } 
    else 
    {
        next();
    }
});

/**
 * Middleware to serve the login page.
 * When the '/login/' route is accessed, the login page is sent to the client.
 */
router.use('/login/', (req, res, next) => 
{
    res.sendFile(req.url, { root: path.join(__dirname, 'public/login') });
});

/**
 * Start the HTTP server on port 8080.
 */
server.listen(8080, function () 
{
    console.log('Listening on http://localhost:8080');
});

/**
 * Serves the main calendar page to the client.
 * When the root URL ('/') is accessed, the calendar HTML file is sent as a response.
 */
app.get('/', (req, res) => 
{
    res.sendFile('calendar.html', { root: 'public' });
});

// #endregion
