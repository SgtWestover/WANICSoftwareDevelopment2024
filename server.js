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
const { User, CalendarEvent, CalendarTeam, CalendarTeamEvent} = require('./shared/CalendarClasses');
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
const uri = "mongodb://127.0.0.1/";
const dbclient = new MongoClient(uri);
//mongoose for schemas to store unique team codes to check against
const mongoose = require('mongoose');
const roleLevels = 
{
    'Viewer': 1,
    'User': 2,
    'Admin': 3,
    'Owner': 4
}
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
app.use(express.urlencoded({ extended: true }));
// Router for handling different routes
const router = express.Router();
// Create an HTTP server using the Express app.
const server = http.createServer(app);
// Function to log WebSocket errors
// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
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
const nameStatus = 
{
    "owner": "forbidden",
    "admin": "forbidden",
    "viewer": "forbidden",
    "user": "forbidden",
    "system": "forbidden",
    "team": "forbidden",
    "teams": "forbidden",
    "event": "forbidden",
    "events": "forbidden",
    "database": "forbidden",
    // "kwanghu": "reserved",
    // "zrojas": "reserved",
    // "willc": "reserved",
};

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
    const settings = { _changeNameTimes: 0, _ignoreTeamInvites: false, _rejectTeamInvites: false, _muteAllNotifs: false, _mutedTeams: [] };
    if (await findUserIgnoreCase(req.body._name) == null) //if there is no user with that name, create a new user
    {
        const newUser = new User(req.body._name, req.body._password, null, null, settings);
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
        return account;
    } 
    catch (error)
    {
        // Log any errors that occur during the database query
        console.log(error);
        return null;
    }
}

async function findUserIgnoreCase(username)
{
    // Define the calendar database and users collection
    const calendar = dbclient.db("calendarApp");
    const userlist = calendar.collection("users");
    // Create a query object for the username
    const query = { _name: { $regex: new RegExp(`^${username}$`, 'i') } };
    try 
    {
        // Find the user document in the database
        const account = await userlist.findOne(query);
        return account;
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
            await deleteUserTeamEvents(req.session.userID);
            await deleteUserTeams(user._name);
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
 */
async function deleteUser(username) 
{
    const calendarDB = dbclient.db("calendarApp");
    const userCollection = calendarDB.collection("users");
    await userCollection.deleteOne({ _name: username });
}

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

async function deleteUserTeamEvents(userID)
{
    const calendarDB = dbclient.db("calendarApp");
    const eventsCollection = calendarDB.collection("teamEvents");
    const userEvents = await eventsCollection.find({ "_users": userID }).toArray();
    for (const event of userEvents)
    {
        if (event._users.length > 1)
        {
            // Remove userID from the event's _users array
            await eventsCollection.updateOne
            (
                { _id: event._id },
                { $pull: { _users: userID } }
            );
        }
        else
        {
            await eventsCollection.deleteOne({ _id: event._id });
            const teamData = await getTeamData(event._team);
            if (teamData)
            {
                const teamID = teamData._id;
                const user = await findUserByID(userID);
                const username = user ? user._name : "A user";
                const notifID = new ObjectId().toString();
                const type = "EVENT_DELETE";
                const message = `${username} deleted their account, and the event ${event._name} with it`;
                const sender = username;
                const receiver = null;
                const viewable = "User";
                const sendDate = new Date();
                const misc = null;
                await addNotificationToTeam(teamID, notifID, type, message, sender, receiver, viewable, sendDate, misc);
            }
        }
    }
}

/**
 * Deletes the user from a specific team they are associated with using the username
 * @param {string} username - The name of the user to be removed
 * @returns {Promise<void>}
 */
async function deleteUserTeams(username)
{
    const calendarDB = dbclient.db("calendarApp");
    const teamsCollection = calendarDB.collection("teams");
    // Find all teams where the user is a member or queued
    const teams = await teamsCollection.find
    (
        {
            $or: 
            [
                { [`_users.${username}`]: { $exists: true } },
                { [`_usersQueued.${username}`]: { $exists: true } }
            ]
        }
    ).toArray();
    for (const team of teams)
    {
        if (team._users[username])
        {
            // If user is the only member, delete the team
            if (Object.keys(team._users).length === 1)
            {
                await teamsCollection.deleteOne({ _id: team._id });
            }
            else
            {
                // If user is the owner, transfer ownership
                if (team._users[username] === "Owner")
                {
                    const newOwner = findNewOwner(team._users);
                    if (newOwner)
                    {
                        team._users[newOwner] = "Owner";
                    }
                }
                // Remove user from _users
                delete team._users[username];
                // Update the team in the database
                await teamsCollection.updateOne({ _id: team._id }, { $set: { _users: team._users } });
            }
        }
        else if (team._usersQueued[username])
        {
            // Remove user from _usersQueued
            delete team._usersQueued[username];
            // Update the team in the database
            await teamsCollection.updateOne({ _id: team._id }, { $set: { _usersQueued: team._usersQueued } });
        }
    }
}

// Finds the new owner based on role priority and also implicitly join order
function findNewOwner(users)
{
    const rolesPriority = ["Owner", "Admin", "User", "Viewer"];
    for (const role of rolesPriority)
    {
        for (const [username, userRole] of Object.entries(users))
        {
            if (userRole === role)
            {
                return username;
            }
        }
    }
    return null;
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

router.post('/findTeamEventByID', async (req, res) => 
{
    const { teamEventID } = req.body;
    if (!teamEventID) 
    {
        return res.status(400).send({ message: "Missing teamEventID in request" });
    }
    try 
    {
        const event = await findTeamEventDetails(teamEventID);
        if (event) 
        {
            res.status(200).send({ result: 'OK', event });
        } 
        else 
        {
            res.status(404).send({ result: 'FAIL', message: "Event not found" });
        }
    } 
    catch (error) 
    {
        console.error("Error in finding team events: ", error);
        res.status(500).send({ result: 'ERROR', message: "Internal Server Error" });
    }
});

async function findTeamEventDetails(eventID) 
{
    try 
    {
        const calendar = dbclient.db("calendarApp");
        const eventList = calendar.collection("teamEvents");
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
    if (!req.body.team._name || !req.body.team._usersQueued || !req.body.creatorName) 
    {
        return res.status(400).send({ result: 'FAIL', message: "Missing information" });
    }
    let user;
    try 
    {
        const teamJoinCode = await getNewCode();
        let users = {};
        let usersQueued = {};
        const currentDate = new Date();
        let notificationIDs = {}; // Store notification IDs for each user added
        for (const [username, info] of Object.entries(req.body.team._usersQueued)) 
        {
            if (info.status === 'JOINED') 
            {
                users[username] = info.role;
            } 
            else if (info.status === 'INVITE') 
            {
                user = await findUser(username);
                if (user && !user._settings._rejectTeamInvites) //TODO: Maybe message team if user rejects team invites?
                {
                    usersQueued[username] = { role: info.role, status: info.status };
                    const notifID = new ObjectId().toString();
                    const userMessage = `${req.body.creatorName} invited you to join their team ${req.body.team._name} as a(n) ${info.role}`;
                    await addNotificationToUser(username, notifID, "TEAM_INVITE", userMessage, req.body.creatorName, currentDate, null);
                    notificationIDs[username] = { notifID: notifID, role: info.role };    
                }
            }
        }
        const newTeam = new CalendarTeam(null, req.body.team._name, req.body.team._description, users, teamJoinCode, usersQueued, req.body.team._autoJoin, req.body.team._joinPerms);
        const result = await addTeam(newTeam);
        if (result.insertedId) 
        {
            for (const [username, { notifID, role }] of Object.entries(notificationIDs)) 
            {
                const teamMessage = `${req.body.creatorName} invited ${username} to join the team as a(n) ${role}`;
                await addNotificationToTeam(result.insertedId, notifID, "TEAM_INVITE", teamMessage, req.body.creatorName, username, role, currentDate, null);
            }
            await notifyTeamUpdate(newTeam);
            res.status(201).send({ result: 'OK', message: "Team Created", teamID: result.insertedId, teamJoinCode: teamJoinCode });
        } 
        else 
        {
            throw new Error("Team creation failed");
        }
    } 
    catch (error) 
    {
        console.error('Error creating team:', error);
        res.status(500).send({ result: 'FAIL', message: error.message });
    }
});
async function addTeam(teamData) 
{
    const calendarDB = dbclient.db("calendarApp");
    const teamsCollection = calendarDB.collection("teams");
    return await teamsCollection.insertOne(teamData);
}

async function addNotificationToUser(username, notifID, type, message, sender, sendDate, misc)
{
    const calendarDB = dbclient.db("calendarApp");
    const usersCollection = calendarDB.collection("users");
    const user = await findUser(username);
    if (type === "TEAM_INVITE" && user._settings._ignoreTeamInvites)
    {
        return;
    }
    const notification = { type, message, sender, sendDate, misc };
    const updateQuery = { $set: { [`_notifications.${notifID}`]: notification } };
    await usersCollection.updateOne({ _name: username }, updateQuery);
}

async function addNotificationToTeam(teamID, notifID, type, message, sender, receiver, viewable, sendDate, misc)
{
    const calendarDB = dbclient.db("calendarApp");
    const teamsCollection = calendarDB.collection("teams");
    const notification = { type, message, sender, receiver, viewable, sendDate, misc };
    const updateQuery = { $set: { [`_notifications.${notifID}`]: notification } };
    await teamsCollection.updateOne({ _id: teamID }, updateQuery);
}

router.post('/notificationEditEvent', async (req, res) =>
{
    try
    {
        const { teamCode, userID, receivers, eventID, prevEvent } = req.body;
        if (!teamCode || !userID || !receivers || receivers.length === 0 || !eventID || !prevEvent)
        {
            return res.status(400).send({ result: 'FAIL', message: "Missing required information" });
        }
        const teamData = await getTeamData(teamCode);
        if (!teamData)
        {
            return res.status(404).send({ result: 'FAIL', message: "Team not found" });
        }
        const user = await findUserByID(userID);
        if (!user)
        {
            return res.status(404).send({ result: 'FAIL', message: "User not found" });
        }
        const event = await findTeamEventDetails(eventID);
        if (!event)
        {
            return res.status(404).send({ result: 'FAIL', message: "Event not found" });
        }
        const receiverNames = await Promise.all(receivers.map(async (id) => 
        {
            const receiverUser = await findUserByID(id);
            return receiverUser ? receiverUser._name : null;
        })).then(names => names.filter(Boolean));
        const notifID = new ObjectId().toString();
        const sendDate = new Date();
        const message = `Event details have been edited (ID: ${eventID})`;
        const notifExtras = { prevEvent : prevEvent, currentEvent: event};
        await addNotificationToTeam(teamData._id, notifID, "EVENT_EDIT", message, user._name, receiverNames, "Viewer", sendDate, notifExtras);
        res.status(200).send({ result: 'OK', message: "Notification added successfully" });
    }
    catch (error)
    {
        console.error("Error processing notificationEditEvent:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

router.post('/notificationCreateEvent', async (req, res) =>
{
    try
    {
        const { teamCode, userID, receivers, eventID } = req.body;
        if (!teamCode || !userID || !receivers || receivers.length === 0 || !eventID)
        {
            return res.status(400).send({ result: 'FAIL', message: "Missing required information" });
        }
        const teamData = await getTeamData(teamCode);
        if (!teamData)
        {
            return res.status(404).send({ result: 'FAIL', message: "Team not found" });
        }
        const user = await findUserByID(userID);
        if (!user)
        {
            return res.status(404).send({ result: 'FAIL', message: "User not found" });
        }
        const event = await findTeamEventDetails(eventID);
        if (!event)
        {
            return res.status(404).send({ result: 'FAIL', message: "Event not found" });
        }
        const receiverNames = await Promise.all(receivers.map(async (id) => 
        {
            const receiverUser = await findUserByID(id);
            return receiverUser ? receiverUser._name : null;
        })).then(names => names.filter(Boolean));
        const notifID = new ObjectId().toString();
        console.log(notifID);
        const sendDate = new Date();
        const userMessage = `A new event has been created in the ${teamData._name} team (ID: ${eventID})`;
        const teamMessage = `A new event has been created in the team (ID: ${eventID})`;
        const notifExtras = { currentEvent: event };
        for (username of receiverNames)
        {
            if (username !== user._name) await addNotificationToUser(username, notifID, "EVENT_CREATE", userMessage, user._name, sendDate, notifExtras);
        }
        await addNotificationToTeam(teamData._id, notifID, "EVENT_CREATE", teamMessage, user._name, receiverNames, "Viewer", sendDate, notifExtras);
        res.status(200).send({ result: 'OK', message: "Notification added successfully" });
    }
    catch (error)
    {
        console.error("Error processing notificationCreateEvent:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

router.post('/notificationDeleteEvent', async (req, res) => 
{
    try
    {
        console.log("started function here");
        const { teamCode, userID, receivers, eventID, deletedEvent } = req.body;
        if (!teamCode || !userID || !receivers || receivers.length === 0 || !eventID || !deletedEvent) 
        {
            return res.status(400).send({ result: 'FAIL', message: "Missing required information" });
        }
        const teamData = await getTeamData(teamCode);
        if (!teamData) 
        {
            return res.status(404).send({ result: 'FAIL', message: "Team not found" });
        }
        const user = await findUserByID(userID);
        if (!user) 
        {
            return res.status(404).send({ result: 'FAIL', message: "User not found" });
        }
        const receiverNames = await Promise.all(receivers.map(async (id) => 
        {
            const receiverUser = await findUserByID(id);
            return receiverUser ? receiverUser._name : null;
        })).then(names => names.filter(Boolean));
        const notifExtras = { deletedEvent : deletedEvent};
        const notifID = new ObjectId().toString();
        const sendDate = new Date();
        const message = `An event has been deleted (ID: ${eventID})`;
        for (const username of receiverNames) 
        {
            if (username !== user._name) 
            {
                await addNotificationToUser(username, notifID, "EVENT_DELETE", message, user._name, sendDate, notifExtras);
            }
        }
        await addNotificationToTeam(teamData._id, notifID, "EVENT_DELETE", message, user._name, receiverNames, "Viewer", sendDate, notifExtras);
        res.status(200).send({ result: 'OK', message: "Notification sent successfully" });
    } 
    catch (error) 
    {
        console.error("Error processing notificationDeleteEvent:", error);
        res.status(500).send({ message: "Internal Server Error" });
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

router.post('/getTeamWithJoinCode', async (req, res) => 
{
    const joinCode = req.body.joinCode;
    if (!joinCode)
    {
        res.status(400).send({ result: 'FAIL', message: "Missing joinCode"});
        return;
    }
    const teamData = await getTeamData(joinCode);
    if(!teamData)
    {
        res.status(404).send({result: 'FAIL', message: "Team not found"});
        return;
    }
    else
    {
        res.send({result: 'OK', team: teamData});
    }
});

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

router.post('/updateAutoJoin', async (req, res) => 
{
    const { newAutoJoin, teamCode, senderID } = req.body;

    if (!teamCode || newAutoJoin === undefined)
    {
        return res.status(400).send({ result: 'FAIL', message: "Missing required information" });
    }
    try
    {
        const calendarDB = dbclient.db("calendarApp");
        const teamsCollection = calendarDB.collection("teams");
        const team = await teamsCollection.findOne({ _joinCode: teamCode });
        let senderUser = await findUserByID(senderID);
        senderUser = senderUser ? senderUser : { _name: "system"};
        const notifID = new ObjectId().toString();
        const sendDate = new Date();
        const teamMessage = `${senderUser._name} updated the team AutoJoin to ${newAutoJoin}`;
        if (!team)
        {
            return res.status(404).send({ result: 'FAIL', message: "Team not found" });
        }
        const userMessage = `${senderUser._name} has admitted you to ${team._name} by updating the AutoJoin to true`;
        if (newAutoJoin === team._autoJoin)
        {
            return res.status(206).send({ result: 'FAIL', message: "AutoJoin did not change" });
        }
        await teamsCollection.updateOne({ _joinCode: teamCode }, { $set: { _autoJoin: newAutoJoin } });
        if (newAutoJoin)
        {
            const queuedUsers = team._usersQueued || {};
            let usersToAdmit = {};
            for (const [username, {role, status}] of Object.entries(queuedUsers))
            {
                if (status === 'QUEUED')
                {
                    usersToAdmit[username] = role ; // Prepare users to admit
                }
            }
            Object.keys(usersToAdmit).forEach(username => 
            {
                delete queuedUsers[username];
            });
            await teamsCollection.updateOne({ _joinCode: teamCode }, { $set: { _usersQueued: queuedUsers } });
            Object.entries(usersToAdmit).forEach(async ([username, role]) =>
            {
                await addNotificationToUser(username, notifID, 'TEAM_AUTOJOIN_UPDATE', userMessage, senderUser._name, sendDate, null);
                await teamsCollection.updateOne({ _joinCode: teamCode }, { $set: { [`_users.${username}`]: role } });
            });
        }
        await addNotificationToTeam(teamCode, notifID, "TEAM_AUTOJOIN_UPDATE", teamMessage, senderUser._name, null, "Viewer", sendDate, null);
        res.status(200).send({ result: 'OK', message: "Auto-join setting updated successfully" });
    } 
    catch (error)
    {
        console.error("Error updating auto-join setting and admitting users:", error);
        res.status(500).send({ result: 'ERROR', message: "Internal Server Error" });
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
        if (team._usersQueued && team._usersQueued[userName] && team._usersQueued[userName].status === 'BANNED')
        {
            return res.send({ result: 'FAIL', message: 'User is banned' });
        }
        else if (team._users[userName] || (team._usersQueued && team._usersQueued[userName] && team._usersQueued[userName].status === 'QUEUED')) 
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
            team._usersQueued[userName] = { role: team._joinPerms, status: 'QUEUED' };
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

router.post('/clearAllNotifications', async (req, res) => 
{
    const { teamCode } = req.body;
    if (!teamCode)
    {
        return res.status(400).send({ result: 'FAIL', message: "Missing team code" });
    }
    try
    {
        const calendarDB = dbclient.db("calendarApp");
        const teamsCollection = calendarDB.collection("teams");
        const team = await teamsCollection.findOne({ _joinCode: teamCode });
        if (!team)
        {
            return res.status(404).send({ result: 'FAIL', message: "Team not found" });
        }
        await teamsCollection.updateOne
        (
            { _joinCode: teamCode },
            { $set: { _notifications: {} } }
        );
        res.status(200).send({ result: 'OK', message: "Notifications cleared successfully" });
    } 
    catch (error)
    {
        console.error("Error clearing notifications:", error);
        res.status(500).send({ result: 'ERROR', message: "Internal Server Error" });
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

async function notifyTeamEventUpdate(teamEvent)
{
    const usersToUpdate = teamEvent._users;
    let userID;
    for (i in usersToUpdate)
    {
        userID = usersToUpdate[i];
        if (userID && map.has(usersToUpdate[i]))
        {
            const ws = map.get(userID);
            ws.send(JSON.stringify({type: 'teamEventUpdate'}));
        }
    }
}

router.post('/getUserNotifications', async (req, res) => 
{
    const userID = req.body.userID;
    if (!userID) 
    {
        return res.status(400).send({ result: 'FAIL', message: 'UserID is required' });
    }
    try 
    {
        const user = await findUserByID(userID);
        const calendarDB = dbclient.db("calendarApp");
        const teamsCollection = calendarDB.collection("teams");

        if (user && user._notifications) 
        {
            const notificationsArrayPromises = Object.entries(user._notifications).map(async ([id, notification]) => 
            {
                const query = { [`_notifications.${id}`]: { $exists: true } };
                const team = await teamsCollection.findOne(query);        
                const teamCode = team ? team._joinCode : null;
                return {
                    id,
                    ...notification,
                    teamCode };
            });
            const notificationsArray = await Promise.all(notificationsArrayPromises);
            res.send({ result: 'OK', notifications: notificationsArray, userSettings: user._settings });
        } 
        else 
        {
            res.status(404).send({ result: 'FAIL', message: 'User not found or no notifications' });
        }
    } 
    catch (error) 
    {
        console.error('Error retrieving user notifications:', error);
        res.status(500).send({ result: 'ERROR', message: 'An error occurred' });
    }
});


router.post('/handleTeamInvite', async (req, res) => 
{
    const { userID, notificationID, action } = req.body; // action can be 'accept' or 'reject'
    if (!userID || !notificationID || !action) 
    {
        return res.status(400).send({ result: 'FAIL', message: 'UserID, NotificationID, and action are required' });
    }
    try 
    {
        const calendarDB = dbclient.db("calendarApp");
        const usersCollection = calendarDB.collection("users");
        const teamsCollection = calendarDB.collection("teams");
        const team = await teamsCollection.findOne({ [`_notifications.${notificationID}`]: { $exists: true } });
        if (!team) 
        {
            return res.status(404).send({ result: 'FAIL', message: 'Team not found' });
        }
        const user = await findUserByID(userID);
        if (!user) 
        {
            return res.status(404).send({ result: 'FAIL', message: 'User not found' });
        }
        if (action === 'accept') 
        {   
            team._users[user._name] = team._usersQueued[user._name].role;
            let newNotifID = new ObjectId().toString();
            await addNotificationToTeam(team._id, newNotifID, "TEAM_JOIN", `${user._name} joined the team as a ${team._users[user._name]}`, user._name, null, "Viewer", new Date(), null);
            delete team._usersQueued[user._name];
        } 
        else if (action === 'reject') 
        {
            delete team._usersQueued[user._name];
        }
        await teamsCollection.updateOne({ _id: team._id }, { $set: { _users: team._users, _usersQueued: team._usersQueued } });
        const notificationRemovalQuery = { $unset: { [`_notifications.${notificationID}`]: "" } };
        await usersCollection.updateOne({ _id: user._id }, notificationRemovalQuery);
        await notifyTeamUpdate(team);
        res.send({ result: 'OK', message: `Team invite ${action}ed` });
    } 
    catch (error) 
    {
        console.error(`Error ${action}ing team invite:`, error);
        res.status(500).send({ result: 'ERROR', message: 'An error occurred' });
    }
});

router.post('/deleteNotification', async (req, res) => 
{
    const { userID, notificationID } = req.body;
    if (!userID || !notificationID) 
    {
        return res.status(400).send({ result: 'FAIL', message: 'how did this even happen' });
    }
    try 
    {
        const calendarDB = dbclient.db("calendarApp");
        const usersCollection = calendarDB.collection("users");
        const teamsCollection = calendarDB.collection("teams");
        //remove the notification from the user's notifications
        const userNotificationRemovalQuery = { $unset: { [`_notifications.${notificationID}`]: "" } };
        await usersCollection.updateOne({ _id: new ObjectId(userID) }, userNotificationRemovalQuery);
        const teamNotificationRemovalQuery = { $unset: { [`_notifications.${notificationID}`]: "" } };
        await teamsCollection.updateMany({}, teamNotificationRemovalQuery);
        res.send({ result: 'OK', message: 'Notification deleted' });
    } 
    catch (error) 
    {
        console.error('Error deleting notification:', error);
        res.status(500).send({ result: 'ERROR', message: 'An error occurred' });
    }
});

router.post('/getUser', async (req, res) =>
{
    try
    {
        const userID = req.body.userID;
        if (!userID)
        {
            return res.send({ result: 'FAIL', message: 'UserID is required' });
        }
        const user = await findUserByID(userID);
        if (user)
        {
            res.send({ result: 'OK', user: user });
        }
    }
    catch(error)
    {
        console.error('Error finding user:', error);
        res.send({ result: 'ERROR', message: 'An error occurred' });
    }
});

router.post('/createTeamEvent', async (req, res) =>
{
    // Validate required information
    if (!req.body._team || !req.body._users || !req.body._permissions || !req.body._viewable || !req.body._name || !req.body._startDate || !req.body._endDate) 
    {
        res.send({ result: 'OK', message: "Missing information" });
        return;
    }
    // Check for event duplication
    if (await findTeamEvent(req.body._team, req.body._users, req.body._permissions, req.body._viewable, null, req.body._name, req.body._startDate, req.body._endDate, req.body._description) == null) 
    {
        const newEvent = new CalendarTeamEvent(null, req.body._team, req.body._users, req.body._permissions, req.body._viewable, null, req.body._name, req.body._startDate, req.body._endDate, req.body._description);
        const result = await addTeamEvent(newEvent);
        res.status(201).send({ result: 'OK', message: "Event Created", eventID: result.insertedId });
    } 
    else 
    {
        res.send({ result: 'OK', message: "Event Duplicate" });
    }
});

router.post('/findTeamEvent', async (req, res) => 
{
    // Validate required information
    if (!req.body._team || !req.body._users || !req.body._permissions || !req.body._viewable || !req.body._name || !req.body._startDate || !req.body._endDate) 
    {
        res.send({ result: 'ERROR', message: "Missing information" });
        return;
    }
    // Find the event
    const foundEventID = await findTeamEvent(req.body._team, req.body._users, req.body._permissions, req.body._viewable, req.body._history, req.body._name, req.body._startDate, req.body._endDate, req.body._description);
    if (foundEventID) 
    {
        res.send({ result: 'OK', eventID: foundEventID });
    } 
    else 
    {
        res.send({ result: 'ERROR', message: "Event not found" });
    }
});

async function findTeamEvent(team, users, permissions, viewable, history, name, startDate, endDate, description) 
{
    try 
    {
        const calendar = dbclient.db("calendarApp");
        const eventList = calendar.collection("teamEvents");
        // Create a query to find an event matching all the given criteria
        const query = 
        {
            _team: team,
            _users: users,
            _permissions: permissions,
            _viewable: viewable,
            _history: history,
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

async function addTeamEvent(eventData) 
{
    try
    {
        const calendarDB = dbclient.db("calendarApp");
        const eventsCollection = calendarDB.collection("teamEvents");
        const result = await eventsCollection.insertOne(eventData);
        await notifyTeamEventUpdate(eventData);
        return result;
    }
    catch(error)
    {
        console.log("addTeamEvent Error: ", error);
        return null;
    }
}

router.post('/deleteTeamEvent', async (req, res) => 
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
        const eventDetails = await findTeamEventDetails(eventID);
        if (!eventDetails) 
        {
            res.send({ result: 'ERROR', message: "Event not found" });
            return;
        }
        await deleteTeamEvent(eventID);
        res.send({ result: 'OK', deletedEvent: eventDetails, message: "Event deleted successfully" });
    } 
    catch (error) 
    {
        console.error("Error deleting event: ", error);
        res.status(500).send({ result: 'ERROR', message: "Internal Server Error" });
    }
});

async function findTeamEventDetails(eventID) 
{
    try 
    {
        const calendar = dbclient.db("calendarApp");
        const eventList = calendar.collection("teamEvents");
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

async function deleteTeamEvent(eventID) 
{
    try 
    {
        const calendarDB = dbclient.db("calendarApp");
        const eventsCollection = calendarDB.collection("teamEvents");
        const eventObjectID = new ObjectId(eventID);
        let teamEvent = await findTeamEventDetails(eventID);
        await eventsCollection.deleteOne({ _id: eventObjectID });
        await notifyTeamEventUpdate(teamEvent);
    } 
    catch (error)
    {
        console.log("Error with the websocket: ", error);
    }
}

router.get('/getTeamUserEvents/:userID', async (req, res) => 
{
    try 
    {
        const userID = req.params.userID;
        const events = await findTeamEventsByUserID(userID);
        res.json(events);
    } 
    catch (error) 
    {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

async function findTeamEventsByUserID(userID) 
{
    const calendarDB = dbclient.db("calendarApp");
    const eventsCollection = calendarDB.collection("teamEvents");
    // Use the $in operator to find events where the _users array contains the userID, using the mongodb array accessors
    const eventsCursor = eventsCollection.find({ _users: { $in: [userID] } });
    const userEvents = await eventsCursor.toArray();
    return userEvents;
}

router.post('/getTeamNotifications', async (req, res) => 
{
    const { teamCode, userID } = req.body;
    if (!teamCode || !userID) 
    {
        return res.status(400).send({ message: "Missing teamCode in request" });
    }
    try 
    {
        const calendarDB = dbclient.db("calendarApp");
        const teamsCollection = calendarDB.collection("teams");
        const team = await teamsCollection.findOne({ _joinCode: teamCode });
        if (!team) 
        {
            return res.status(404).send({ result: 'FAIL', message: "Team not found" });
        }
        const user = await findUserByID(userID);
        if (!user) 
        {
            return res.status(500).send({ result: 'FAIL', message: "Internal Server Error" });
        }
        const userRole = team._users[user._name];
        const notifications = team._notifications || {};
        res.status(200).send({ result: 'OK', notifications : notifications, userRole : userRole });
    } 
    catch (error) 
    {
        console.error("Error getting team notifications:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

router.post('/getTeamEvents', async (req, res) => 
{
    try
    {
        const calendarDB = dbclient.db("calendarApp");
        const eventsCollection = calendarDB.collection("teamEvents");
        const teamCode = req.body.teamCode;
        if (!teamCode) 
        {
            return res.status(500).send({ result: 'ERROR', message: "No Team Code!" });
        }
        const teamEvents = await eventsCollection.find({ _team: teamCode }).toArray();
        res.status(200).send({ result: 'OK', teamEvents: teamEvents});
    }
    catch (error)
    {
        console.error("Failed to fetch team events:", error);
        res.status(500).send({ message: "Failed to fetch team events" });
    }
});

router.post('/inviteUser', async (req, res) =>
{
    try
    {
        const calendarDB = dbclient.db("calendarApp");
        const teamsCollection = calendarDB.collection("teams");
        const { teamCode, userID, receiver, role, status } = req.body;
        if (!teamCode || !userID || !receiver || !role || !status)
        {
            return res.status(400).send({ result: 'FAIL', message: "Missing required information" });
        }
        const teamData = await getTeamData(teamCode);
        if (!teamData)
        {
            return res.status(404).send({ result: 'FAIL', message: "Team not found" });
        }
        const user = await findUserByID(userID);
        if (!user)
        {
            return res.status(404).send({ result: 'FAIL', message: "User not found" });
        }
        const receiverUser = await findUser(receiver);
        if (!receiverUser)
        {
            return res.status(404).send({ result: 'FAIL', message: "Receiver not found" });
        }
        if (receiverUser._settings._rejectTeamInvites)
        {
            return res.status(206).send({ result: 'FAIL', message: "Receiver is not accepting team invites" });
        }
        if (teamData._usersQueued[receiver] && teamData._usersQueued[receiver].status === 'BANNED')
        {
            return res.status(403).send({ result: 'FAIL', message: "User is banned"});
        }
        if (teamData._usersQueued[receiver] && teamData._usersQueued[receiver].status === 'INVITE')
        {
            return res.status(206).send({ result: 'FAIL', message: "User has already been invited" })
        }
        const notifID = new ObjectId().toString();
        const sendDate = new Date();
        const userMessage = `${user._name} invited you to join their team ${teamData._name} as a ${role}`;
        const teamMessage = `${user._name} invited ${receiver} to join the as a ${role}`;
        teamsCollection.updateOne({ _id: teamData._id }, { $set: { [`_usersQueued.${receiver}`]: { role, status: "INVITE" } } })
        await addNotificationToUser(receiver, notifID, "TEAM_INVITE", userMessage, user._name, sendDate, null);
        await addNotificationToTeam(teamData._id, notifID, "TEAM_INVITE", teamMessage, user._name, receiver, "Admin", sendDate, null);
        res.status(200).send({ result: 'OK', message: "Invitation sent successfully" });
    }
    catch (error)
    {
        console.error("Error processing team invite:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
})


//#endregion teams

router.post('/leaveTeam', async (req, res) => 
{
    try 
    {
        const { userID, teamCode } = req.body;
        if (!userID || !teamCode) 
        {
            return res.status(400).send({ result: 'FAIL', message: "Missing userID or teamCode" });
        }
        const user = await findUserByID(userID);
        if (!user) 
        {
            return res.status(404).send({ result: 'FAIL', message: "User not found" });
        }
        const calendarDB = dbclient.db("calendarApp");
        const teamsCollection = calendarDB.collection("teams");
        const team = await teamsCollection.findOne({ _joinCode: teamCode });
        if (!team) 
        {
            return res.status(404).send({ result: 'FAIL', message: "Team not found" });
        }
        if (!team._users[user._name]) 
        {
            return res.status(404).send({ result: 'FAIL', message: "User not part of the team" });
        }
        delete team._users[user._name];
        if (Object.keys(team._users).length === 0)
        {
            await teamsCollection.deleteOne({ _id: team._id });
        }
        else
        {
            let newOwner = findNewOwner(team._users)
            if (newOwner)
            {
                team._users[newOwner] = "Owner";
            }
            else
            {
                return res.status(206).send({ result: 'OK', message: "No New Owner Found" });
            }
            await teamsCollection.updateOne({ _joinCode: teamCode }, { $set: { _users: team._users }});
        }
        res.status(200).send({ result: 'OK', message: "User removed from team successfully" });
    } 
    catch (error) 
    {
        console.error("Error leaving team:", error);
        res.status(500).send({ result: 'ERROR', message: "Internal Server Error" });
    }
});


async function getTeamData(teamCode) 
{
    try 
    {
        const calendarDB = dbclient.db("calendarApp");
        const teamsCollection = calendarDB.collection("teams");
        // Find the team by its code
        const teamData = await teamsCollection.findOne({ _joinCode: teamCode });
        return teamData;
    } 
    catch (error) 
    {
        console.error('Error fetching team data:', error);
        return null;
    }
}

router.post('/findTeamWithNotifID', async (req, res) => 
{
    try 
    {
        const { notifID } = req.body;
        const calendarDB = dbclient.db("calendarApp");
        const teamsCollection = calendarDB.collection("teams");
        const query = { [`_notifications.${notifID}`]: { $exists: true } };
        const team = await teamsCollection.findOne(query);
        if (team) 
        {
            res.send({ result: 'OK', team: team });
        } 
        else 
        {
            res.status(404).send({ result: 'FAIL', message: 'Team not found with the provided event ID' });
        }
    } 
    catch (error) 
    {
        console.error('Error finding team with eventID:', error);
        res.status(500).send({ result: 'ERROR', message: 'An error occurred while searching for the team' });
    }
});

router.post('/updateTeamDescription', async (req, res) => 
{
    const { newDesc, teamCode, senderID } = req.body;

    if (!teamCode)
    {
        return res.status(400).send({ result: 'FAIL', message: "Missing required information" });
    }
    try
    {
        const calendarDB = dbclient.db("calendarApp");
        const teamsCollection = calendarDB.collection("teams");
        const team = await teamsCollection.findOne({ _joinCode: teamCode });
        let senderUser = await findUserByID(senderID);
        senderUser = senderUser ? senderUser : { _name: "system"} ;
        if (!team)
        {
            return res.status(404).send({ result: 'FAIL', message: "Team not found" });
        }
        if (team._description === newDesc)
        {
            return res.status(206).send({ result: 'FAIL', message: "Description unchanged" });
        }
        const notifID = new ObjectId().toString();
        const sendDate = new Date();
        const message = `${senderUser._name} updated the team description to ${newDesc}`;
        await addNotificationToTeam(teamCode, notifID, "TEAM_DESC_UPDATE", message, senderUser._name, null, "Viewer", sendDate, null);
        await teamsCollection.updateOne({ _joinCode: teamCode }, { $set: { _description: newDesc } });
        res.status(200).send({ result: 'OK', message: "Description updated successfully" });
    } 
    catch (error)
    {
        console.error("Error updating team description:", error);
        res.status(500).send({ result: 'ERROR', message: "Internal Server Error" });
    }
});


router.post('/updateTeamName', async (req, res) => 
{
    const { newName, teamCode, senderID } = req.body;
    if (!newName || !teamCode || !senderID)
    {
        return res.status(400).send({ result: 'FAIL', message: "Missing required information" });
    }
    try
    {
        const calendarDB = dbclient.db("calendarApp");
        const teamsCollection = calendarDB.collection("teams");
        const team = await teamsCollection.findOne({ _joinCode: teamCode });
        let senderUser = await findUserByID(senderID);
        senderUser = senderUser ? senderUser : { _name: "system"} ;
        if (!team)
        {
            return res.status(404).send({ result: 'FAIL', message: "Team not found" });
        }
        if (team._name === newName)
        {
            return res.status(206).send({ result: 'FAIL', message: "Name unchanged" });
        }
        const notifID = new ObjectId().toString();
        const sendDate = new Date();
        const message = `${senderUser._name} updated the team name to ${newName}`;
        await addNotificationToTeam(teamCode, notifID, "TEAM_NAME_UPDATE", message, senderUser._name, null, "Viewer", sendDate, null);
        await teamsCollection.updateOne({ _joinCode: teamCode }, { $set: { _name: newName } });
        res.status(200).send({ result: 'OK', message: "Name updated successfully" });
    } 
    catch (error)
    {
        console.error("Error updating team name:", error);
        res.status(500).send({ result: 'ERROR', message: "Internal Server Error" });
    }
});

router.post('/deleteTeam', async (req, res) => 
{
    try 
    {
        const { teamCode, userID } = req.body;
        if (!teamCode || !userID)
        {
            res.status(404).send({ result: 'FAIL', message: 'Team code or userID not' });
        }
        const calendarDB = dbclient.db("calendarApp");
        const teamsCollection = calendarDB.collection("teams");
        const team = await teamsCollection.findOne({ _joinCode: teamCode });
        if (!team) 
        {
            return res.status(404).send({ result: 'FAIL', message: "Team not found" });
        }
        await teamsCollection.deleteOne({ _joinCode: teamCode });
        const notifID = new ObjectId().toString();
        const sendDate = new Date();
        let senderUser = await findUserByID(userID);
        const message = `${senderUser._name} has deleted the team ${team._name}`;
        await Promise.all(Object.keys(team._users).map(async (username) => 
        {
            await addNotificationToUser(username, notifID, "TEAM_DELETE", message, senderUser._name, sendDate, null);
        }));
        res.status(200).send({ result: 'OK', message: "Team deleted successfully and notifications sent" });
    } 
    catch (error) 
    {
        console.error("Error deleting team:", error);
        res.status(500).send({ result: 'ERROR', message: "Internal Server Error" });
    }
});

router.post('/kickUser', async (req, res) =>
{
    const { username, teamCode, senderID } = req.body;
    if (!username || !teamCode || !senderID) 
    {
        return res.status(400).send({ message: "Missing required information" });
    }
    try 
    {
        const calendarDB = dbclient.db("calendarApp");
        const teamsCollection = calendarDB.collection("teams");
        const team = await teamsCollection.findOne({ _joinCode: teamCode });
        if (!team) 
        {
            return res.status(404).send({result: 'FAIL', message: "Team not found" });
        }
        if (!team._users[username]) 
        {
            return res.status(200).send({result: 'FAIL', message: "User not part of the team" });
        }
        let senderUser = await findUserByID(senderID);
        senderUser = senderUser ? senderUser : { _name: "system"} ;
        if (senderUser._name === username)
        {
            return res.status(206).send({result: 'FAIL', message: "Cannot kick yourself" });
        }
        delete team._users[username];
        await teamsCollection.updateOne({ _joinCode: teamCode }, { $set: { _users: team._users }});
        const notifID = new ObjectId().toString();
        const sendDate = new Date();
        const userMessage = `You have been kicked from the team ${team._name} by ${senderUser._name}`;
        const teamMessage = `${senderUser._name} kicked ${username} from the team`;
        await addNotificationToUser(username, notifID, "TEAM_KICK", userMessage, senderUser._name, sendDate, null);
        await addNotificationToTeam(teamCode, notifID, "TEAM_KICK", teamMessage, senderUser._name, null, "User", sendDate, null);
        res.status(200).send({ result: 'OK', message: "User kicked successfully and notified" });
    } 
    catch (error) 
    {
        console.error("Error kicking user:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

router.post('/banUser', async (req, res) => 
{
    const { username, teamCode, senderID } = req.body;
    if (!username || !teamCode || !senderID) 
    {
        return res.status(400).send({ message: "Missing required information" });
    }
    try 
    {
        const calendarDB = dbclient.db("calendarApp");
        const teamsCollection = calendarDB.collection("teams");
        const team = await teamsCollection.findOne({ _joinCode: teamCode });
        if (!team) 
        {
            return res.status(206).send({result: 'FAIL', message: "Team not found" });
        }
        if (!team._users[username]) 
        {
            return res.status(206).send({result: 'FAIL', message: "User not part of the team" });
        }
        let senderUser = await findUserByID(senderID);
        senderUser = senderUser ? senderUser : { _name: "system"} ;
        if (senderUser._name === username)
        {
            return res.status(206).send({result: 'FAIL', message: "Cannot ban yourself" });
        }
        delete team._users[username];
        team._usersQueued[username] = { role : null, status : 'BANNED'};
        await teamsCollection.updateOne({ _joinCode: teamCode }, { $set: { _users: team._users , _usersQueued : team._usersQueued}});
        const notifID = new ObjectId().toString();
        const sendDate = new Date();
        const userMessage = `You have been banned from the team ${team._name} by ${senderUser._name}`;
        const teamMessage = `${senderUser._name} banned ${username} from the team`;
        await addNotificationToUser(username, notifID, "TEAM_BAN", userMessage, senderUser._name, sendDate, null);
        await addNotificationToTeam(teamCode, notifID, "TEAM_BAN", teamMessage, senderUser._name, null, "User", sendDate, null);
        res.status(200).send({ result: 'OK', message: "User banned successfully and notified" });
    } 
    catch (error) 
    {
        console.error("Error kicking user:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

router.post('/unbanUser', async (req, res) =>
{
    const { username, teamCode, senderID } = req.body;
    if (!username || !teamCode || !senderID) 
    {
        return res.status(400).send({ message: "Missing required information" });
    }
    try 
    {
        const calendarDB = dbclient.db("calendarApp");
        const teamsCollection = calendarDB.collection("teams");
        const team = await teamsCollection.findOne({ _joinCode: teamCode });
        if (!team) 
        {
            return res.status(404).send({ result: 'FAIL', message: "Team not found" });
        }
        if (!team._usersQueued[username] || team._usersQueued[username].status !== 'BANNED') 
        {
            return res.status(206).send({ result: 'FAIL', message: "User not banned from team" });
        }
        let senderUser = await findUserByID(senderID);
        senderUser = senderUser ? senderUser : { _name: "system"} ;
        delete team._usersQueued[username];
        await teamsCollection.updateOne({ _joinCode: teamCode }, { $set: { _usersQueued : team._usersQueued}});
        const notifID = new ObjectId().toString();
        const sendDate = new Date();
        const userMessage = `You have been unbanned from the team ${team._name}`;
        const teamMessage = `${senderUser._name} has unbanned ${username} from the team ${team._name}`
        await addNotificationToUser(username, notifID, "TEAM_UNBAN", userMessage, senderUser._name, sendDate, null);
        await addNotificationToTeam(teamCode, notifID, "TEAM_UNBAN", teamMessage, senderUser._name, null, "User", sendDate, null);
        res.status(200).send({ result: 'OK', message: "User unbanned successfully and notified" });
    } 
    catch (error) 
    {
        console.error("Error kicking user:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

router.post('/updateUserRoles', async (req, res) => 
{
    const { username, newUserRole, teamCode, senderID } = req.body;

    if (!username || !newUserRole || !teamCode) 
    {
        return res.status(400).send({ result: 'FAIL', message: "Missing required information" });
    }
    try 
    {
        let isOriginalOwner = false;;
        const calendarDB = dbclient.db("calendarApp");
        const teamsCollection = calendarDB.collection("teams");
        const team = await getTeamData(teamCode);
        let senderUser = await findUserByID(senderID);
        if (!team) 
        {
            return res.status(404).send({ result: 'FAIL', message: "Team not found" });
        }
        const user = await findUser(username);
        if (!user) 
        {
            return res.status(404).send({ result: 'FAIL', message: "User not found" });
        }
        if (!team._users[username] && !team._usersQueued[username]) 
        {
            return res.status(404).send({ result: 'FAIL', message: "User not part of the team" });
        }
        const prevRole = team._users[username];
        if (roleLevels[team._users[username]] >= roleLevels[team._users[senderUser]])
        {
            if (roleLevels[team._users[username]] === 4 && roleLevels[team._users[senderUser]] === 4)
            {
                for ([username, role] of Object.entries(team._users))
                {
                    if (role === 'Owner' && username === senderUser._name)
                    {
                        isOriginalOwner = true;
                        break;
                    }
                }
            }
            if (!isOriginalOwner) return res.status(206).send({ result: 'FAIL', message: "Cannot change the role of an equal or higher user" });
        }
        if (newUserRole === prevRole)
        {
            return res.status(206).send({ result: 'FAIL', message: "Role is the same as before" });
        }
        if (team._users[username])
        {
            team._users[username] = newUserRole;
        }
        else if (team._usersQueued[username])
        {
            team._usersQueued[username].role = newUserRole;
        }
        const notifID = new ObjectId().toString();
        const sendDate = new Date();
        senderUser = senderUser ? senderUser : { _name: "system"} ;
        let userMessage;
        let teamMessage;
        if (roleLevels[newUserRole] > roleLevels[prevRole])
        {
            userMessage = `You have been promoted to ${newUserRole} in the team ${team._name}`;
            teamMessage = `${senderUser._name} has promoted ${username} to ${newUserRole}`;
        }
        else
        {
            userMessage = `You have been demoted to ${newUserRole} in the team ${team._name}`;
            teamMessage = `${senderUser._name} has demoted ${username} to ${newUserRole}`;
        } 
        let receiverNames = [username];
        await addNotificationToUser(username, notifID, "TEAM_UPDATE_ROLE", userMessage, senderUser._name, sendDate, null);
        await addNotificationToTeam(team._id, notifID, "TEAM_UPDATE_ROLE", teamMessage, senderUser._name, receiverNames, "User", sendDate, null);
        await teamsCollection.updateOne({ _joinCode: teamCode }, { $set: { _users: team._users, _usersQueued: team._usersQueued}});
        return res.status(200).send({ result: 'OK', message: "User role updated successfully in team" });
    } 
    catch (error) 
    {
        console.error('Error updating user role in team:', error);
        return res.status(500).send({ result: 'FAIL', message: error.message });
    }
});

router.post('/admitUser', async (req, res) => 
{
    const { username, teamCode, senderID } = req.body;
    const calendarDB = dbclient.db("calendarApp");
    const teamsCollection = calendarDB.collection("teams");
    const sender = await findUserByID(senderID);
    const team = await teamsCollection.findOne({ _joinCode: teamCode });
    if (!team || !team._usersQueued[username] || team._usersQueued[username].status !== 'QUEUED')
    {
        return res.status(206).send({ result: 'FAIL', message: "No user in queue found" });
    }
    if (!sender || sender._name === username)
    {
        return res.status(206).send({ result: 'FAIL', message: "Cannot admit yourself" });
    }
    const role = team._usersQueued[username].role;
    delete team._usersQueued[username];
    team._users[username] = role;
    const notifID = new ObjectId().toString();
    const sendDate = new Date();
    let senderUser = await findUserByID(senderID);
    senderUser = senderUser ? senderUser : { _name: "system"};
    const userMessage = `You have been admitted to the the team ${team._name} with the role ${role}`;
    const teamMessage = `${senderUser._name} has admitted ${username} to the the team with the role ${role}`;
    let receiverNames = [username];
    await addNotificationToUser(username, notifID, "TEAM_ADMIT", userMessage, senderUser._name, sendDate, null);
    await addNotificationToTeam(teamCode, notifID, "TEAM_ADMIT", teamMessage, senderUser._name, receiverNames, "Viewer", sendDate, null);
    await teamsCollection.updateOne({ _joinCode: teamCode }, { $set: { _usersQueued: team._usersQueued, _users: team._users } });
    res.status(200).send({ result: 'OK', message: "User admitted successfully" });
});

router.post('/rejectUser', async (req, res) => 
{
    const { username, teamCode, senderID } = req.body;
    const calendarDB = dbclient.db("calendarApp");
    const teamsCollection = calendarDB.collection("teams");
    const sender = await findUserByID(senderID);
    const team = await teamsCollection.findOne({ _joinCode: teamCode });
    if (!team || !team._usersQueued[username] || team._usersQueued[username].status !== 'QUEUED')
    {
        return res.status(206).send({ result: 'FAIL', message: "No user in queue found" });
    }
    if (!sender || sender._name === username)
    {
        return res.status(206).send({ result: 'FAIL', message: "Cannot reject yourself" });
    }
    delete team._usersQueued[username];
    const notifID = new ObjectId().toString();
    const sendDate = new Date();
    let senderUser = await findUserByID(senderID);
    senderUser = senderUser ? senderUser : { _name: "system"};
    const userMessage = `You have been rejected from the the team ${team._name}`;
    const teamMessage = `${senderUser._name} has rejected ${username} from the team`
    let receiverNames = [username];
    await addNotificationToUser(username, notifID, "TEAM_REJECT", userMessage, senderUser._name, sendDate, null);
    await addNotificationToTeam(teamCode, notifID, "TEAM_REJECT", teamMessage, senderUser._name, receiverNames, "Admin", sendDate, null);
    await teamsCollection.updateOne({ _joinCode: teamCode }, { $set: { _usersQueued: team._usersQueued } });
    res.status(200).send({ result: 'OK', message: "User rejected successfully" });
});

router.post('/blacklistUser', async (req, res) => 
{
    const { username, teamCode, senderID } = req.body;
    const calendarDB = dbclient.db("calendarApp");
    const sender = await findUserByID(senderID);
    const teamsCollection = calendarDB.collection("teams");
    const team = await teamsCollection.findOne({ _joinCode: teamCode });
    if (!team || !team._usersQueued[username] || team._usersQueued[username].status !== 'QUEUED')
    {
        return res.status(206).send({ result: 'FAIL', message: "No user in queue found" });
    }
    if (!sender || sender._name === username)
    {
        return res.status(206).send({ result: 'FAIL', message: "Cannot ban yourself" });
    }
    team._usersQueued[username] = { role: null, status: 'BANNED' };
    const notifID = new ObjectId().toString();
    const sendDate = new Date();
    let senderUser = await findUserByID(senderID);
    senderUser = senderUser ? senderUser : { _name: "system"};
    const userMessage = `You have been blacklisted from the the team ${team._name} by ${senderUser._name}`;
    const teamMessage = `${senderUser._name} has blacklisted ${username} from the team`;
    let receiverNames = [username];
    await addNotificationToUser(username, notifID, "TEAM_BLACKLIST", userMessage, senderUser._name, sendDate, null);
    await addNotificationToTeam(teamCode, notifID, "TEAM_BLACKLIST", teamMessage, senderUser._name, receiverNames, "Admin", sendDate, null);
    await teamsCollection.updateOne({ _joinCode: teamCode }, { $set: { _usersQueued: team._usersQueued } });
    res.status(200).send({ result: 'OK', message: "User blacklisted successfully" });
});

router.post('/changeName', async (req, res) => 
{
    const { userID, newName } = req.body;
    const calendarDB = dbclient.db("calendarApp");
    const usersCollection = calendarDB.collection("users");
    const teamsCollection = calendarDB.collection("teams");
    if (!userID || !newName) 
    {
        return res.status(400).send({ result: 'FAIL', message: "Missing required information" });
    }
    const user = await findUserByID(userID);
    if (!user) 
    {
        return res.status(404).send({ result: 'FAIL', message: "User not found" });
    }
    if (user._settings._changeNameTimes < 3)
    {
        const currentName = user._name;
        user._settings._changeNameTimes++;
        if (currentName === newName)
        {
            return res.status(206).send({ result: 'FAIL', message: "Name unchanged" });
        }
        if (newName.length < 4 || newName.length > 24)
        {
            return res.status(206).send({ result: 'FAIL', message: "Name must be between 4 and 24 characters" });
        }
        if (nameStatus[newName.toLowerCase()]) 
        {
            const statusMessage = nameStatus[newName.toLowerCase()] === "forbidden" ? "Name is forbidden" : "Name is reserved";
            return res.status(206).send({ result: 'FAIL', message: statusMessage });
        }
        const otherUser = await findUserIgnoreCase(newName);
        if (otherUser && otherUser._name.toLowerCase() !== currentName.toLowerCase())
        {
            return res.status(206).send({ result: 'FAIL', message: "Name already taken" });
        }
        if (nameStatus[newName.toLowerCase()]) 
        {
            const statusMessage = nameStatus[newName.toLowerCase()] === "forbidden" ? "Name is forbidden" : "Name is reserved";
            return res.status(206).send({ result: 'FAIL', message: statusMessage });
        }
        user._name = newName;
        usersCollection.updateOne
        (
            { _id: new ObjectId(userID) },
            { $set: {_name: user._name, _settings: user._settings } }
        );
        const teamsWithUser = await teamsCollection.find({ [`_users.${currentName}`]: { $exists: true } }).toArray();
        for (const team of teamsWithUser) // I have to reconstruct the entire object because the retarded ass mongodb doesn't maintain key orderings
        {
            const newUsers = {};
            for (const [name, role] of Object.entries(team._users)) 
            {
                if (name === currentName) 
                {
                    newUsers[newName] = role;
                } 
                else 
                {
                    newUsers[name] = role;
                }
            }
            const updateResult = await teamsCollection.updateOne
            (
                { _id: team._id },
                { $set: { _users: newUsers } }
            );
        }
        res.status(200).send({ result: 'OK', message: "Name changed successfully" });
    }
    else
    {
        return res.status(206).send({ result: 'FAIL', message: "Cannot change name more than once" });
    }
});

router.post('/changePassword', async (req, res) => 
{
    const { userID, newPassword } = req.body;
    const calendarDB = dbclient.db("calendarApp");
    const usersCollection = calendarDB.collection("users");
    if (!userID || !newPassword)
    {
        return res.status(400).send({ result: 'FAIL', message: "Missing required information" });
    }
    try
    {
        const user = await findUserByID(userID);
        if (!user)
        {
            return res.status(400).send({ result: 'FAIL', message: "Cannot Find User" });
        }
        const same = await bcrypt.compare(newPassword, user._password)
        if (same)
        {
            return res.status(206).send({ result: 'FAIL', message: "Same Password as Before!" });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10); // magic number... tf does it do???
        await usersCollection.updateOne
        (
            { _id: new ObjectId(userID) },
            { $set : { _password: hashedPassword } }
        );
        res.status(200).send({ result: 'OK', message: "Password changed successfully" });    
    }
    catch (error)
    {
        return res.status(500).send({ result: 'FAIL', message: "Internal Server Error fuckso" });
    }
});

router.post('/exportUserEvents', async (req, res) => 
{
    const { userID } = req.body;
    if (!userID) 
    {
        // Immediately return to prevent further execution
        return res.status(400).send({ result: 'FAIL', message: "Missing userID" });
    }
    try 
    {
        const events = await findEventsByUserID(userID);
        const filename = "userEvents.json";
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(JSON.stringify(events));
    } 
    catch (error) 
    {
        console.log(error);
        if (!res.headersSent) 
        {
            res.status(500).send({ result: 'FAIL', message: "An error occurred while fetching events" });
        }
    }
});

router.post('/importUserEvents', async (req, res) => 
{
    const { userID, events } = req.body;
    if (!userID || events.length === 0) 
    {
        return res.status(400).send({ result: 'FAIL', message: "Missing userID or events" });
    }
    const calendarDB = dbclient.db("calendarApp");
    const eventsCollection = calendarDB.collection("events");
    const uniqueEvents = [];
    for (const event of events) 
    {
        const idExists = event._id && await eventsCollection.findOne({ _id: event._id });
        const eventExists = await findEvent(event._users, event._name, event._startDate, event._endDate, event._description);
        if (!idExists && !eventExists) 
        {
            uniqueEvents.push
            ({
                ...event,
            });
        }
    }
    try 
    {
        if (uniqueEvents.length > 0) 
        {
            await eventsCollection.insertMany(uniqueEvents);
            res.status(200).send({ result: 'OK', message: `${uniqueEvents.length} events imported successfully` });
        }
        else 
        {
            res.status(200).send({ result: 'OK', message: "No new events to import" });
        }
    } 
    catch (error) 
    {
        console.log(error);
        res.status(500).send({ result: 'FAIL', message: "An error occurred while importing events" });
    }
});

router.post('/clearUserEvents', async (req, res) => 
{
    const { userID } = req.body;
    if (!userID) 
    {
        return res.status(400).send({ result: 'FAIL', message: "Missing userID" });
    }
    try 
    {
        const calendarDB = dbclient.db("calendarApp");
        const eventsCollection = calendarDB.collection("events");
        const deleteResult = await eventsCollection.deleteMany({ "_users": userID });
        res.status(200).send({ result: 'OK', message: `${deleteResult.deletedCount} event(s) were deleted.` });
    } 
    catch (error)
    {
        console.log(error);
        res.status(500).send({ result: 'FAIL', message: "An error occurred while clearing events" });
    }
});

router.post('/fillNotificationsSettings', async (req, res) => 
{
    const { userID } = req.body;
    try 
    {
        const user = await findUserByID(userID);
        if (!user) 
        {
            return res.status(404).send({ result: 'FAIL', message: "User not found." });
        }
        const settings = 
        {
            _ignoreTeamInvites: user._settings._ignoreTeamInvites,
            _rejectTeamInvites: user._settings._rejectTeamInvites,
            _muteAllNotifs: user._settings._muteAllNotifs,
            _mutedTeams: user._settings._mutedTeams || []
        };
        res.send({ result: 'OK', settings });
    } 
    catch (error) 
    {
        console.error(error);
        res.status(500).send({ result: 'FAIL', message: "An error occurred while fetching notification settings." });
    }
});


router.post('/checkUserTeams', async (req, res) => 
{
    const { teamCode, userID, action } = req.body;

    try 
    {
        const team = await getTeamData(teamCode);
        if (!team) 
        {
            return res.status(206).send({ result: 'FAIL', message: "Team not found." });
        }
        const user = await findUserByID(userID);
        if (!user) 
        {
            return res.status(206).send({ result: 'FAIL', message: "User not found." });
        }
        if (!team._users[user._name]) 
        {
            return res.status(206).send({ result: 'FAIL', message: "User is not part of the team." });
        }
        if (action === 'mute' && !user._settings._mutedTeams.includes(teamCode)) 
        {
            return res.send({ result: 'OK', action: 'addMutedTeam', message: "Proceed with muting the team." });
        }
        else if (action === 'mute' && user._settings._mutedTeams.includes(teamCode))
        {
            return res.send({ result: 'FAIL', message: "Already muted team." });
        }
        if (action === 'unmute' && user._settings._mutedTeams.includes(teamCode)) 
        {
            return res.send({ result: 'OK', action: 'removeMutedTeam', message: "Proceed with unmuting the team." });
        }
        else if (action === 'unmute' && !user._settings._mutedTeams.includes(teamCode))
        {
            return res.send({ result: 'FAIL', message: "Team is not muted." });
        }
        else 
        {
            return res.status(400).send({ result: 'FAIL', message: "Invalid request or no action needed." });
        }
    } 
    catch (error) 
    {
        console.error(error);
        res.status(500).send({ result: 'FAIL', message: "An error occurred during the operation." });
    }
});

router.post('/updateNotificationSettings', async (req, res) => 
{
    const { userID, settings } = req.body;
    if (!userID || !settings) 
    {
        return res.status(400).send({ result: 'FAIL', message: "Missing userID or settings" });
    }
    try 
    {
        const calendarDB = dbclient.db("calendarApp");
        const usersCollection = calendarDB.collection("users");
        const currentUser = await findUserByID(userID);
        if (!currentUser) 
        {
            return res.status(404).send({ result: 'FAIL', message: "User not found." });
        }
        const settingsChanged = settings._ignoreTeamInvites !== currentUser._settings._ignoreTeamInvites ||
                                settings._rejectTeamInvites !== currentUser._settings._rejectTeamInvites ||
                                settings._muteAllNotifs !== currentUser._settings._muteAllNotifs ||
                                JSON.stringify(settings._mutedTeams.sort()) !== JSON.stringify((currentUser._settings._mutedTeams || []).sort());
        if (!settingsChanged)
        {
            return res.send({ result: 'FAIL', message: "No changes to the current settings." });
        }
        await usersCollection.updateOne
        (
            { _id: new ObjectId(userID) },
            {
                $set: 
                {
                    "_settings._ignoreTeamInvites": settings._ignoreTeamInvites,
                    "_settings._rejectTeamInvites": settings._rejectTeamInvites,
                    "_settings._muteAllNotifs": settings._muteAllNotifs,
                    "_settings._mutedTeams": settings._mutedTeams
                }
            }
        );
        res.send({ result: 'OK', message: "Notification settings updated successfully." });
    } 
    catch (error) 
    {
        console.error("An error occurred during the operation:", error);
        res.status(500).send({ result: 'FAIL', message: "An error occurred while updating notification settings." });
    }
});

router.post('/dismissNotification', async (req, res) => 
{
    const { teamCode, userID, notificationID } = req.body;

    if (!teamCode || !userID || !notificationID)
    {
        return res.status(400).send({ message: "Missing required fields" });
    }
    try 
    {
        const calendarDB = dbclient.db("calendarApp");
        const teamsCollection = calendarDB.collection("teams");
        const team = await getTeamData(teamCode);
        if (!team)
        {
            return res.status(404).send({ result: 'FAIL', message: "Team not found" });
        }
        const user = await findUserByID(userID);
        if (!user)
        {
            return res.status(404).send({ result: 'FAIL', message: "User not found" });
        }
        const notification = team._notifications[notificationID];
        if (!notification)
        {
            return res.status(404).send({ result: 'FAIL', message: "Notification not found" });
        }
        const usersDismissed = notification.misc && notification.misc._usersDismissed ? notification.misc._usersDismissed : [];
        if (usersDismissed.includes(user._name))
        {
            return res.status(400).send({ result: 'FAIL', message: "Notification already dismissed by this user" });
        }
        usersDismissed.push(userID);
        const updateQuery = { $set: {} };
        updateQuery.$set[`_notifications.${notificationID}.misc`] = { ...notification.misc, _usersDismissed: usersDismissed };
        const updateResult = await teamsCollection.updateOne
        (
            { _joinCode: teamCode, [`_notifications.${notificationID}`]: { $exists: true } },
            updateQuery
        );
        if (updateResult.modifiedCount === 1)
        {
            return res.send({ result: 'OK', message: "Notification dismissed successfully" });
        } 
        else 
        {
            return res.status(400).send({ result: 'FAIL', message: "Could not dismiss notification" });
        }
    } 
    catch (error) 
    {
        console.error("Error dismissing notification:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

router.post('/deleteTeamNotification', async (req, res) => 
{
    const { teamCode, userID, notificationID } = req.body;
    if (!teamCode || !userID || !notificationID)
    {
        return res.status(400).send({ message: "Missing required fields" });
    }
    try 
    {
        const calendarDB = dbclient.db("calendarApp");
        const teamsCollection = calendarDB.collection("teams");
        const team = await getTeamData(teamCode);
        if (!team)
        {
            return res.status(404).send({ result: 'FAIL', message: "Team not found" });
        }
        const user = await findUserByID(userID);
        if (!user)
        {
            return res.status(404).send({ result: 'FAIL', message: "User not found" });
        }
        const userRole = team._users[user._name];
        if (!userRole || roleLevels[userRole] < roleLevels['Admin'])
        {
            return res.status(403).send({ result: 'FAIL', message: "User does not have permission to delete notifications" });
        }
        const updateResult = await teamsCollection.updateOne
        (
            { _joinCode: teamCode },
            { $unset: { [`_notifications.${notificationID}`]: "" } } // Use $unset to remove the notification
        );
        if (updateResult.modifiedCount === 1)
        {
            return res.send({ result: 'OK', message: "Notification deleted successfully" });
        }
        else
        {
            return res.status(400).send({ result: 'FAIL', message: "Could not delete notification" });
        }
    } 
    catch (error) 
    {
        console.error("Error deleting team notification:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});


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