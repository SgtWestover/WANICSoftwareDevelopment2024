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
    })();
});

// Make sure fetchTeamData, renderHeader, renderDescription, and renderUserList are defined properly

//38 characters max for name


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
            case "owner":
                var container = document.getElementById("ownerContainer");
                container.appendChild(userElement);
                break;
            case "admin":
                var container = document.getElementById("adminContainer");
                container.appendChild(userElement);
                break;
            case "user":
                var container = document.getElementById("userContainer");
                container.appendChild(userElement);
                break;
            case "viewer":
                var container = document.getElementById("viewerContainer");
                container.appendChild(userElement);
                break;
            default:
                console.logError("User role: " + role + " is not correct");
                break;
        }
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
            console.log([...teamEvents]);
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
    startTime.innerHTML = new Date(event._startDate).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
    container.append(startTime);

    let endTime = document.createElement("div");
    endTime.classList.add("team-upcomingEvents-content-container-endTime", "team-upcomingEvents-content-container-content");
    endTime.innerHTML = new Date(event._endDate).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
    container.append(endTime);

    document.getElementById("teamEvents").append(container);
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