function getUserId(username, dbclient)
{
    return dbclient.db("calendarApp").collection("users").findOne({username: username})._id;
}

function addEvent(data, dbclient)
{

}

async function getEventsForUser(user) {
    let events = await dbclient.db("calendarApp").collection("users").findOne({_id: user})
}