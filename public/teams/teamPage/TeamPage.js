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
            console.log(teamEvents);
            //TODO: do it
            
        }        
    })
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