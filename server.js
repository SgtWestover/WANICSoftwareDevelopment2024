const session = require('express-session');
const express = require('express');
const http = require('http');
//const uuid = require('uuid');

const bcrypt = require("bcrypt")

const { WebSocketServer } = require('ws');

function onSocketError(err) {
    console.error(err);
}

const app = express();
const map = new Map();

//mongodb
const { MongoClient } = require("mongodb");

// Replace the uri string with your connection string.
const uri = "mongodb://127.0.0.1";

const dbclient = new MongoClient(uri);

//
// We need the same instance of the session parser in express and
// WebSocket server.
//
const sessionParser = session({
    saveUninitialized: false,
    secret: '$eCuRiTy',
    resave: false
});

//
// Serve static files from the 'public' folder.
//
app.use(express.static('public'));
app.use(sessionParser);
app.use(express.json())

app.post('/login', async function (req, res) {
    //
    // "Log in" user and set userId to session.
    //
    //const id = uuid.v4();

    console.log(req.body.username + " " + req.body.password);
    //req.session.userId = id;

    const user = await findUser(req.body.username, req.body.password);

    if (user == null)
    {
        console.log("account " + req.body.username + " does not exist");


        res.send({ result: 'OK', message: "ANF" });
        return;
    }
    else
    {
        res.send({ result: 'OK', message: "OK" });
        return;
    }
});

app.post('/signup', async function (req, res) {
    //
    // "Log in" user and set userId to session.
    //
    //const id = uuid.v4();

    console.log(req.body.username + " " + req.body.password);
    //req.session.userId = id;
    if (await findUser(req.body.username, req.body.password) == null)
    {
        const user = await addUser(req.body.username, req.body.password);

        res.send({ result: 'OK', message: "Account created" });
        return;



        if (user == null)
        {
            console.log("account " + req.body.username + " does not exist");
        }
        else
        {
            res.send({ result: 'OK', message: "OK" });
            return;
        }
    }

    res.send({ result: 'OK', message: "Account already exists" });

});

app.post('/deleteaccount', async function (req, res) {
    //
    // "Log in" user and set userId to session.
    //
    //const id = uuid.v4();

    console.log("deleting " + req.body.username + " " + req.body.password);

    deleteUser(req.body.username, req.body.password)
});

async function findUser(username, password)
{
    const calendar = dbclient.db("calendarApp");
    const userlist = calendar.collection("users");

    const query = {username: username};

    const account = await userlist.findOne(query);

    if (account != null)
    {
        const result =  await bcrypt.compare(password, account.password);

        if (result)
        {
            return account;
        }
    }
    else
    {
        return null;
    }

    return null;

}

async function addUser(username, password)
{
    const calendar = dbclient.db("calendarApp");
    const userlist = calendar.collection("users");

    const hash = await bcrypt.hash(password, 10);

    const user = {username: username, password: hash};



    const account = await userlist.insertOne(user);

    console.log(account.insertedId);

    return account;
}

async function deleteUser(username, password)
{
    const calendar = dbclient.db("calendarApp");
    const userlist = calendar.collection("users");

    const user = {username: username, password: password};

    const account = await userlist.deleteOne(user);

    console.log(account.insertedId);

    return account;
}

app.delete('/logout', function (request, response) {
    const ws = map.get(request.session.userId);

    console.log('Destroying session');
    request.session.destroy(function () {
        if (ws) ws.close();

        response.send({ result: 'OK', message: 'Session destroyed' });
    });
});

//
// Create an HTTP server.
//
const server = http.createServer(app);

//
// Create a WebSocket server completely detached from the HTTP server.
//
const wss = new WebSocketServer({ clientTracking: false, noServer: true });

server.on('upgrade', function (request, socket, head) {
    socket.on('error', onSocketError);

    console.log('Parsing session from request...');

    sessionParser(request, {}, () => {
        if (!request.session.userId) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        console.log('Session is parsed!');

        socket.removeListener('error', onSocketError);

        wss.handleUpgrade(request, socket, head, function (ws) {
            wss.emit('connection', ws, request);
        });
    });
});

wss.on('connection', function (ws, request) {
    const userId = request.session.userId;

    map.set(userId, ws);

    ws.on('error', console.error);

    ws.on('message', function (message) {
        //
        // Here we can now use session parameters.
        //
        console.log(`Received message ${message} from user ${userId}`);
    });

    ws.on('close', function () {
        map.delete(userId);
    });
});



//
// Start the server.
//
server.listen(8080, function () {
    console.log('Listening on http://localhost:8080');
});