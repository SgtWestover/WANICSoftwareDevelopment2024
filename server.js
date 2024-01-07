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
const { User, CalendarEvent } = require('./shared/UserData');
const { ObjectId } = require('mongodb');
const { Console } = require('console');

// Initialize Express application
const app = express();

// Map to track active WebSocket connections
const map = new Map();

//Map for tracking users
const users = new Map();

//Map for tracking events
const events = new Map();

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
    if (!req.session.userID && !['/signin', '/signup'].includes(req.path)) 
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
 * POST /signin - Handles user login and session creation. I still don't fully understand the ID stuff but whatever
 */
router.post('/signin', async (req, res) => 
{
    const user = await findUser(req.body._name, req.body._password);
    if (user == null) 
    {
        res.send({ result: 'OK', message: "Account Not Found" });
    } 
    else 
    {
        req.session.userID = user._id; // Use MongoDB's unique ID and sets it for the session for authorization
        console.log("signing in " + user._name);
        res.send({ result: 'OK', message: "Sign In Successful", userID: user._id }); // Send back user ID
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
 * POST /createEvent - Handles event creation. It creates a new event.
 */
router.post('/createEvent', async (req, res) => 
{
    // Check if all information is provided
    if (!req.body._users || !req.body._name || !req.body._startDate || !req.body._endDate)
    {
        res.send({ result: 'OK', message: "Missing information" });
        return;
    }
    // Check if event already exists
    if (await findEvent(req.body._users, req.body._name, req.body._startDate, req.body._endDate, req.body._description) == null) 
    {
        // Create a new event instance and add to database
        const newEvent = new CalendarEvent(null, req.body._users, req.body._name, req.body._startDate, req.body._endDate, req.body._description);
        const result = await addEvent(newEvent);
        res.status(201).send({ result: 'OK', message: "Event Created", eventID: result.insertedId });
    }
    else 
    {
        res.send({ result: 'OK', message: "Event Duplicate" });
    }
});

router.post('/findEvent', async (req, res) => 
{
    // Check if all necessary information is provided
    if (!req.body._users || !req.body._name || !req.body._startDate || !req.body._endDate)
    {
        res.send({ result: 'ERROR', message: "Missing information" });
        return;
    }
    // Find the event
    const foundEventID = await findEvent(req.body._users, req.body._name, req.body._startDate, req.body._endDate, req.body._description);
    // If an event is found, return its ID; otherwise, indicate it was not found
    if (foundEventID) 
    {
        res.send({ result: 'OK', eventID: foundEventID });
    } 
    else 
    {
        res.send({ result: 'ERROR', message: "Event not found" });
    }
});

router.post('/deleteEvent', async (req, res) => 
{
    const eventID = req.body.eventID;
    if (!eventID) 
    {
        res.send({ result: 'ERROR', message: "Missing event ID" });
        return;
    }
    try 
    {
        // Retrieve event details before deletion
        const eventDetails = await findEventDetails(eventID);
        console.log("deleting event: " + JSON.stringify(eventDetails));
        if (!eventDetails) 
        {
            res.send({ result: 'ERROR', message: "Event not found" });
            return;
        }
        // Delete the event
        await deleteEvent(eventID);

        // Send back the details of the deleted event
        res.send
        ({ 
            result: 'OK', 
            message: "Event deleted successfully", 
        });
    } 
    catch (error) 
    {
        console.error("Error deleting event: ", error);
        res.status(500).send({ result: 'ERROR', message: "Internal Server Error" });
    }
});

/**
 * POST /logout - Handles user logout. It removes the user's session.
 */
router.post('/signout', async (req, res) => 
{
    if (req.session.userID) 
    {
        // Remove the user's session and send response
        req.session.destroy();
        res.send({ result: 'OK', message: "signed out successfully" });
    }
});

/**
 * POST /deleteaccount - Allows a user to delete their account after verifying their password.
 */
//TODO: Retarded function that needs to have the password stuff removed cuz it's already being checked in Account
router.post('/deleteaccount/', async (req, res) => 
{
    if (req.session.userID) 
    {
        const user = await findUserByID(req.session.userID);
        if (user && await bcrypt.compare(req.body.password, user._password)) 
        {
            await deleteUser(user._name);
            await deleteUserEvents(req.session.userID); //can only use req.session.userID because user._id is the mongoDB objectID which it expropriated
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
 * GET /getIserEvemts - Retrieves all events for a user ID.
 */
router.get('/getUserEvents/:userID', async (req, res) => 
{
    try 
    {
        const userID = req.params.userID;
        const events = await findEventsByUserID(userID);
        res.json(events); // Sends the array of events as a JSON response
    } catch (error) 
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

    // // Console log each event
    // userEvents.forEach(event => 
    // {
    //     console.log(event);
    // });

    return userEvents;
}


/**
 * POST /checkpassword - Verifies if the provided password is correct for the logged-in user.
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


/**
 * POST /getData - Retrieves data for the logged-in user.
 */
router.post('/getData/', async (req, res) => 
{
    if (req.session.userID) 
    {
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
        try 
        {
            const result = await bcrypt.compare(password, account._password);
            if (result)
            {
                return account;
            }
        } 
        catch (error)
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
//TODO: PORT OVER TO USERID INSTEAD OF USERNAME. THIS IS A TEMPORARY FIX BECUZ IM TIRED LMAO
async function deleteUser(username) 
{
    const calendarDB = dbclient.db("calendarApp");
    const userCollection = calendarDB.collection("users");
    await userCollection.deleteOne({ _name: username });
}

async function deleteEvent(eventID)
{
    const calendarDB = dbclient.db("calendarApp");
    const eventsCollection = calendarDB.collection("events");
    const eventObjectID = new ObjectId(eventID);
    await eventsCollection.deleteOne({ _id: eventObjectID });
}

/**
 * Deletes a user by their username.
 * @param {string} userID - The user ID of the user to delete.
 * @returns {Promise<void>}
 */
//TODO: Make it so that if userID is the only person it can delete it, otherwise its gonna delete the functions of others
async function deleteUserEvents(userID)
{
    const calendarDB = dbclient.db("calendarApp");
    const eventsCollection = calendarDB.collection("events");
    await eventsCollection.deleteMany({ _users: { $in: [userID] } });
}

app.delete('/logout', function (request, response) 
{
    const ws = map.get(request.session.userID);

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

router.post('/updateEvent', async (req, res) => {
    const { eventID, ...eventDetails } = req.body;

    if (!eventID || !eventDetails) {
        res.status(400).send({ result: 'ERROR', message: "Missing event ID or details" });
        return;
    }

    try {
        const updatedEvent = await updateEvent(eventID, eventDetails);
        if (updatedEvent) {
            res.send({ result: 'OK', message: "Event updated successfully" });
        } else {
            res.status(404).send({ result: 'ERROR', message: "Event not found" });
        }
    } catch (error) {
        console.error("Error updating event: ", error);
        res.status(500).send({ result: 'ERROR', message: "Internal Server Error" });
    }
});

async function updateEvent(eventID, eventDetails) {
    const calendarDB = dbclient.db("calendarApp");
    const eventsCollection = calendarDB.collection("events");
    const eventObjectID = new ObjectId(eventID);

    const updateResult = await eventsCollection.updateOne(
        { _id: eventObjectID },
        { $set: eventDetails }
    );

    return updateResult.matchedCount > 0;
}

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
 * Adds a new event to the database.
 * @param {Object} eventData - The event data to add. Expected to have _name, _startDate, _endDate and _description.
 * @returns {Promise<Object>} The result of the insertion operation.
 */
async function addEvent(eventData) {
    const calendarDB = dbclient.db("calendarApp");
    const eventsCollection = calendarDB.collection("events");
    const result = await eventsCollection.insertOne(eventData);
    return result;
}


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