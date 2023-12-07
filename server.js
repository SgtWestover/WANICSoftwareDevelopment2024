const session = require('express-session');
const express = require('express');
const http = require('http');
const uuid = require('uuid');

const bcrypt = require("bcrypt")

const { WebSocketServer } = require('ws');

function onSocketError(err) {
    console.error(err);
}

const app = express();
const map = new Map();

const users = new Map();

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
// Don't serve static files from the 'public' folder.
//

const cookieParser = require("cookie-parser");
app.use(sessionParser);
app.use(express.json())
app.use(cookieParser())

const router = express.Router()

router.post('/login', async (req, res, next) => {
    //
    // "Log in" user and set userId to session.
    //
    const id = uuid.v4();
    req.session.userId = id;

    const user = await findUser(req.body.username, req.body.password);

    if (user == null)
    {
        console.log("account " + req.body.username + " does not exist");


        res.send({ result: 'OK', message: "ANF" });
        return;
    }
    else
    {
        console.log("logging in " + user.username)
        users.set(id, user.username);
        res.send({ result: 'OK', message: "OK" });
        //res.send({ result: 'OK', message: "OK" });
        return;
    }
})

router.post('/signup', async (req, res, next) => {
    //
    // "Log in" user and set userId to session.
    //
    //const id = uuid.v4();
    //req.session.userId = id;
    if (await findUser(req.body.username, req.body.password) == null)
    {
        const user = await addUser(req.body.username, req.body.password);

        console.log("creating " + user.username)

        res.send({ result: 'OK', message: "Account created" });
        return;



        if (user == null)
        {

        }
        else
        {
            res.send({ result: 'OK', message: "OK" });
            return;
        }
    }

    res.send({ result: 'OK', message: "Account already exists" });

});

router.post('/logout', async (req, res, next) => {
    if (users.get(req.session.userId) != null) {

        console.log("logging out " + users.get(req.session.userId))
        users.delete(req.session.userId);
        req.session.userId = null;
        res.send({ result: 'OK', message: "OK" });
    }
})

router.post('/deleteaccount/', async (req, res, next) => {
    if (users.get(req.session.userId) != null) {

        if ((await findUser(users.get(req.session.userId), req.body.password)) != null)
        {
            console.log("deleting " + users.get(req.session.userId))

            await deleteUser(users.get(req.session.userId));
            users.delete(req.session.userId);
            res.send({result: 'OK', message: "OK"});

            req.session.userId = null;
            return;
        }

    }
    res.send({result: 'OK', message: "NOT_OK"});
});

router.post('/checkpassword/', async (req, res, next) => {
    if (users.get(req.session.userId) != null) {

        if ((await findUser(users.get(req.session.userId), req.body.password)) != null) {
            res.send({result: 'OK', message: "OK"});
        }
        else
        {
            res.send({result: 'OK', message: "NOT_OK"});
        }
    }
})

const { exec } = require('child_process');

router.post('/pull/', async (req, res, next) => {
    console.log("git pull")
    exec('git pull', (error, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        if (error) {
            console.log(`exec error: ${error}`);
            if (stderr.includes('CONFLICT')) {
                res.send({ result: 'ERROR', message: 'Merge error occurred' });
            } else {
                res.send({ result: 'ERROR', message: 'Git pull failed' });
            }
        } else {
            res.send({ result: 'OK', message: 'Git pull successful' });
        }
    });
});

router.post('/restart/', async (req, res, next) => {
    res.send({result: 'OK', message: "OK"});
    process.exit()
})

const path = require('path')

const options = {root: path.join(__dirname, 'public')}

const readFile = require('fs')
const util = require('util')
const {readFileSync} = require("fs");

router.use('/calendar', async (req, res, next) => {
    if (users.get(req.session.userId) != null)
    {
        res.sendFile(req.url, {root: path.join(__dirname, 'public/calendar')})
    }
    else
    {
        next()
    }
})

router.use('/', (req, res, next) => {
    //console.log(req.cookies.session_id)

    /*if(req.cookies.session_id != null && users.get(req.cookies.session_id) != null && req.session.userId == null)
    {
        req.session.userId = req.cookies.userId;
    }*/

    if(users.get(req.session.userId) == null && !req.url.startsWith("/login")) //if user is not logged in and not on login page redirect to login page
    {
        res.redirect('/login')
    }
    else if (users.get(req.session.userId) != null)
    {
        res.redirect('/calendar')
    }
    else
    {
        next()
    }
})

router.use('/login/', (req, res, next) => {
    res.sendFile(req.url, {root: path.join(__dirname, 'public/login')})
})

async function findUser(username, password)
{
    const calendar = dbclient.db("calendarApp");
    const userlist = calendar.collection("users");

    const query = {username: username};

    const account = await userlist.findOne(query);

    if (account != null) {
        //console.log(username + " " + password + " " + account.password)
        try {

            const result = await bcrypt.compare(password, account.password);

            if (result)
            {
                return account;
            }
        } catch (error)
        {
            console.log("Idk what went wrong")
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

    return account;
}

async function deleteUser(username)
{
    const calendar = dbclient.db("calendarApp");
    const userlist = calendar.collection("users");

    const user = {username: username};

    await userlist.deleteOne(user);
}

app.delete('/logout', function (request, response) {
    const ws = map.get(request.session.userId);

    console.log('Destroying session');
    request.session.destroy(function () {
        if (ws) ws.close();

        response.send({ result: 'OK', message: 'Session destroyed' });
    });
});




app.use('/', router);
//app.use(express.static('public'));

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

app.get('/', (req, res) =>
{
    res.sendFile('calendar.html', { root: 'public' });
  });

