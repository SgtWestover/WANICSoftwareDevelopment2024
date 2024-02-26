/*
Name: Kaelin Wang Hu and Zach Rojas
Date: 2/8/2024
Last Edit: 2/8/2024
Description: Handles the rendering of the team page
*/

var joinCode = localStorage.getItem("joinCode");
var teamData;


document.addEventListener('DOMContentLoaded', function() 
{
    (async () => 
    { 
        await fetchTeamData(joinCode);
        renderHeader();
        renderDescription();
        renderUserList();
        renderUpcomingEvents();
        //renderNotifications("a")
        userRole = await getCurrentUserRole();
        if (userRole != null) localStorage.setItem("userRole", userRole);
    })();
});

// Make sure fetchTeamData, renderHeader, renderDescription, and renderUserList are defined properly

function connectWebSocket() 
{
    // Establish a WebSocket connection. Change when IP is different
    ws = new WebSocket('ws://192.168.50.42:8080');
    ws.onopen = function()
    {
        console.log("WebSocket connection established.");
    };
    ws.onmessage = function(event) 
    {
        console.log("message received");
        handleWebSocketMessage(event.data);
    };
    ws.onerror = function(error) 
    {
        console.error("WebSocket error:", error);
    };
    ws.onclose = function(event) 
    {
        console.log("WebSocket connection closed:", event);
        setTimeout(connectWebSocket, 3000); // Reconnect after 3 seconds
    };
}

async function fetchTeamData(joinCode) 
{
    try 
    {
        const response = await sendRequest('/getTeamWithJoinCode', { joinCode: joinCode });
        if (response.result === "OK") 
        {
            teamData = response.team;
            localStorage.setItem("teamData", JSON.stringify(teamData));
        }
    } 
    catch (error) 
    {
        console.error('Failed to fetch team data:', error);
    }
}

async function fetchUsername(id) 
{
    try 
    {
        const response = await sendRequest('/findUserName', { userID: id });
        if (response.result === "OK") 
        {
            return response.username;
        }
    } 
    catch (error) 
    {
        console.error('Failed to fetch team data:', error);
    }
}

function renderHeader()
{
    document.getElementById("teamName").innerText = teamData._name;
}

function renderDescription()
{
    let description = document.getElementById("teamDescription");
    description.innerText = teamData._description;
}

function renderUserList()
{ 
    for (const [username, role] of Object.entries(teamData._users)) 
    {
        let userElement = document.createElement("div");
        userElement.classList.add("team-user-name");
        userElement.innerHTML = `${username} - ${role}`;
        switch (role) 
        {
            case "Owner":
                var container = document.getElementById("ownerContainer");
                container.appendChild(userElement);
                break;
            case "Admin":
                var container = document.getElementById("adminContainer");
                container.appendChild(userElement);
                break;
            case "User":
                var container = document.getElementById("userContainer");
                container.appendChild(userElement);
                break;
            case "Viewer":
                var container = document.getElementById("viewerContainer");
                container.appendChild(userElement);
                break;
            default:
                console.error("User role: " + role + " is not correct");
                break;
        }
    }

    if(document.getElementById("adminContainer").childElementCount === 0)
    {
        document.getElementById("adminContainer").remove();
    }
    if(document.getElementById("userContainer").childElementCount === 0)
    {
        document.getElementById("userContainer").remove();
    }
    if(document.getElementById("viewerContainer").childElementCount === 0)
    {
        document.getElementById("viewerContainer").remove();
    }
}

function renderUpcomingEvents()
{
    let teamEvents;
    sendRequest('/getTeamEvents', {teamCode: teamData._joinCode})
    .then(response =>
    {
        if (response.result === "OK")
        {
            teamEvents = response.teamEvents;
            teamEvents.sort((a,b)=>Date.parse(a._startDate) - Date.parse(b._startDate));
            for (let i = 0; i < teamEvents.length; i++) 
            {
                createUpcomingEventElement(teamEvents[i]);
            }
            
        }        
    })
}

function createUpcomingEventElement(event)
{
    let container = document.createElement('div');
    container.classList.add("team-upcomingEvents-content-container");
    
    let name = document.createElement('div');
    name.classList.add("team-upcomingEvents-content-container-name", "team-upcomingEvents-content-container-content");
    name.innerText = event._name;
    container.append(name);

    let description = document.createElement('div');
    description.classList.add("team-upcomingEvents-content-container-description", "team-upcomingEvents-content-container-content");
    description.innerText = event._description;
    container.append(description);

    let users = document.createElement("div");
    users.classList.add("team-upcomingEvents-content-container-users", "team-upcomingEvents-content-container-content");
    console.log(event._users[0]);
    event._users.forEach(user => 
    {
        let userElement = document.createElement('div');
        sendRequest('/findUserName', { userID : user})
        .then(response => 
        {
            if (response.result === "OK")
            {
                userElement.innerHTML = response.username;
                console.log(response.username);
            }
        })
        .catch(error =>
        {
            console.error("screw you there's no way this can activate: ", error);
        })
        users.appendChild(userElement)
    });
    container.append(users);

    let startTime = document.createElement("div");
    startTime.classList.add("team-upcomingEvents-content-container-startTime", "team-upcomingEvents-content-container-content");
    startTime.innerHTML = "Start Time: ".bold() + new Date(event._startDate).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
    container.append(startTime);

    let endTime = document.createElement("div");
    endTime.classList.add("team-upcomingEvents-content-container-endTime", "team-upcomingEvents-content-container-content");
    endTime.innerHTML = "End Time: ".bold() + new Date(event._endDate).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
    container.append(endTime);

    document.getElementById("teamEvents").append(container);
}

function renderNotifications(data)
{
    let name = "";
    let descripion = "";
    sendRequest('/getTeamNotifications', {teamCode: teamData._joinCode})
    .then(response =>
    {
        if (response.result === "OK")
        {
            //get name and description 
            switch (data._type) 
            {
                case "TEAM_INVITE":
                    name = "Received Team Invite";
                    descripion = data._sender + "invited " + data._receiver + " to the team as " + notificationMessageCheckRole(data._message);
                    break;
                case "EVENT_CREATE":
                    name = "New Event Created";
                    description = notificationCreateEventDescription(data._message);
                    break;
                case "EVENT_EDIT":
                    name = "Event Changed";
                    descripion = notificationEditEventDescription(data._message);
                    break;
                case "EVENT_DELETE":
                    name = "Event Deleted"; 
                    description = notificationDeleteEventDescription(data._message);
                    break;
                default:
                    console.error("INVALID NOTIFICATION TYPE: " + data._type);
                    break;
            }
            //create html

            let container = document.getElementById('teamNotifications');

            let noficationElement = document.createElement("div");
            noficationElement.classList.add("team-notifications-content-element");
            container.append(noficationElement);

            let nameElement = document.createElement('div');
            nameElement.classList.add('team-notifications-content-element-name');
            container.append(nameElement);

            let descriptionElement = document.createElement(`div`);
            descriptionElement.classList.add('team-notifications-content-element-descripion');
            container.append(descriptionElement);
        }
    }).catch(error =>
    {
        console.error("Error rendering team notificiations: ", error);
    })
}

function notificationMessageCheckRole(message)
{
    if(message.split(" ").includes("Viewer")) return "a viewer";
    if(message.split(" ").includes("User")) return "an user";
    if(message.split(" ").includes("Admin")) return "an admin";
    if(message.split(" ").includes("Owner")) return "an owner";
    console.error("NOTIFICATION MESSAGE DID NOT INCLUDE VALID ROLE " + message);
}

function notificationCreateEventDescription(data)
{
    let id = data._message.split("(ID: ")[1];
    let event;
    sendRequest('/findTeamEventByID', { teamEventID : id})
    .then(response => 
    {
        if (response.result === "OK")
        {
            userElement.innerHTML = response.username;
            console.log(response.username);
        }
    })
    .catch(error =>
    {
        console.error("screw you there's no way this can activate: ", error);
    })
    //USER created an new event: EVENT_NAME from START_TIME to END_TIME. 
    return data._sender + " created a new event: " + event._name + " from " + event._startDate + " to " + event._startDate;
}

// notificationEditEventDescription(data._message)
// {

// }

// notificationDeleteEventDescription(data._message)
// {

// }

async function getCurrentUserRole() 
{
    const userID = localStorage.getItem('userID');
    const response = await sendRequest('/getUser', { userID: userID });
    if (response.result === "OK") 
    {
        const userRole = teamData._users[response.user._name];
        return userRole;
    } 
    else 
    {
        // Handle error or invalid response
        console.error('Failed to retrieve user role');
        return null;
    }
}

function handleWebSocketMessage(data) 
{
    try
    {
        console.log("handle web socket message");
        const message = JSON.parse(data);
        // Handle other message types as needed
    } 
    catch (error) 
    {
        console.error("Error handling WebSocket message:", error);
    }
}

function handleWebSocketMessage(data) 
{
    try
    {
        console.log("handle web socket message");
        const message = JSON.parse(data);
        
    } 
    catch (error) 
    {
        console.error("Error handling WebSocket message:", error);
    }
}

/**
 * Sends an HTTP POST request to the specified endpoint with the provided data.
 * @param {string} endpoint - The endpoint to send the request to.
 * @param {Object} data - The data to send in the request.
 * @returns {Promise<Object>} The response from the server.
 */
async function sendRequest(endpoint, data) 
{
    const response = await fetch(endpoint,
        {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    if (!response.ok) 
    {
        throw new Error('Network response was not ok');
    }
    return await response.json();
}