
var joinCode = localStorage.getItem("joinCode");
var teamData;
const roleLevels = 
{
    'Viewer': 1, 
    'User': 2,
    'Admin': 3,
    'Owner': 4
};

document.addEventListener('DOMContentLoaded', function() 
{
    (async () => 
    { 
        await fetchTeamData(joinCode);
        renderHeader();
        renderDescription();
        renderUserList();
        renderUpcomingEvents();
        renderNotifications()
        userRole = await getCurrentUserRole();
        if (userRole != null) localStorage.setItem("userRole", userRole);
    })();
});

// Make sure fetchTeamData, renderHeader, renderDescription, and renderUserList are defined properly

function connectWebSocket() 
{
    // Establish a WebSocket connection. Change when IP is different
    ws = new WebSocket('ws://192.168.73.235:8080');
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

function renderNotifications()
{
    let name = "";
    let description = "";
    sendRequest('/getTeamNotifications', {teamCode: joinCode, userID: localStorage.getItem('userID')})
    .then(response =>
    {
        if (response.result === "OK")
        {
            for(const [key, data] of Object.entries(response.notifications))
            {
                if (data.misc && data.misc._usersDismissed && data.misc._usersDismissed.includes(localStorage.getItem('userID'))) 
                {
                    continue;
                }
                //get name and description 
                switch (data.type) 
                {

                    /*
                    TEAM_INVITE
                    EVENT_CREATE
                    EVENT_EDIT
                    EVENT_DELETE
                    TEAM_JOIN
                    TEAM_DESC_UPDATE
                    TEAM_NAME_UPDATE
                    TEAM_KICK
                    TEAM_BAN
                    TEAM_UNBAN
                    TEAM_UPDATE_ROLE
                    TEAM_ADMIT
                    TEAM_REJECT
                    TEAM_BLACKLIST
                    */
                    case "TEAM_INVITE":
                        name = "User Invited To Team";
                        description = data.sender + " invited " + data.receiver + " to the team as " + notificationMessageCheckRole(data.message);
                        break;
                    case "EVENT_CREATE":
                        name = "New Event Created";
                        description = notificationDescriptionCreateEvent(data);
                        break;
                    case "EVENT_EDIT":
                        name = "Event Changed";
                        description = notificationDescriptionEditEvent(data);
                        break;
                    case "EVENT_DELETE":
                        name = "Event Deleted"; 
                        description = notificationDescriptionDeleteEvent(data);
                        break;
                    case "TEAM_JOIN":
                        name = "User Joined"
                        description = data.sender +" joined the team!";
                        break;
                    case "TEAM_DESC_UPDATE": 
                        name = "Team Description Changed";
                        description = notificationDescriptionDescUpdate(data);
                        break;
                    case "TEAM_NAME_UPDATE":
                        name = "Tame Name Changed";
                        description = data.message;
                        break;
                    case "TEAM_KiCK":
                        name = "User Kicked";
                        description = data.message;
                        break;
                    case "TEAM_BAN":
                        name = "User Banned";
                        description = data.message;
                        break;
                    case "TEAM_UNBAN":
                        name = "User Unbanned";
                        description = data.message;
                        break;
                    case "TEAM_UPDATE_ROLE":
                        name = "User Role Changed";
                        description = data.message
                        break;
                    case "TEAM_ADMIT":
                        name = "User Joined";
                        description = data.message
                        break;
                    case "TEAM_REJECT":
                        name = "User Rejected";
                        description = data.message;
                        break;
                    case "TEAM_BLACKLIST":
                        name = "User Blacklisted";
                        description = data.message;
                        break;
                    default:
                        console.error("INVALID NOTIFICATION TYPE: " + data.type);
                        break;
                }
                //create html
                let container = document.getElementById('teamNotifications');
                let notificationElement = document.createElement("div");
                notificationElement.classList.add("team-notifications-content-element");
                let menuIcon = document.createElement('div');
                menuIcon.classList.add('menu-icon');
                menuIcon.innerHTML = '...'; // Placeholder for an actual icon or image
                menuIcon.onclick = function() 
                {
                    if(1){}
                    showNotificationOptions(notificationElement, response.userRole, key);
                };
                notificationElement.appendChild(menuIcon);
                let nameElement = document.createElement('div');
                nameElement.classList.add('team-notifications-content-element-name');
                nameElement.innerText = name;
                notificationElement.appendChild(nameElement);
                let descriptionElement = document.createElement('div');
                descriptionElement.classList.add('team-notifications-content-element-description');
                descriptionElement.innerText = description;
                notificationElement.appendChild(descriptionElement);
                let timeElement = document.createElement('div');
                timeElement.classList.add('team-notifications-content-element-time');
                timeElement.innerText = formatDate(data.sendDate, true);
                notificationElement.appendChild(timeElement);
                container.insertBefore(notificationElement, container.firstChild);
            }
        }
    }).catch(error =>
    {
        console.error("Error rendering team notificiations: ", error);
    })
}

function showNotificationOptions(notificationElement, userRole, notificationID) 
{
    let existingOptions = notificationElement.querySelector('.notification-options');
    if (existingOptions != null) 
    {
        existingOptions.remove();
        return;
    }
    let optionsContainer = document.createElement('div');
    optionsContainer.classList.add('notification-options');
    let dismissButton = document.createElement('button');
    dismissButton.innerText = 'Dismiss';
    dismissButton.onclick = function() 
    {
        sendRequest('/dismissNotification', 
        {
            teamCode: joinCode, 
            userID: localStorage.getItem('userID'),
            notificationID: notificationID
        })
        .then(response => 
            {
            if (response.result === 'OK') 
            {
                notificationElement.remove();
            } 
            else 
            {
                console.error('Failed to dismiss notification:', response.message);
            }
        })
        .catch(error => 
        {
            console.error('Error during dismissal:', error);
        });
    };
    optionsContainer.appendChild(dismissButton);
    optionsContainer.appendChild(document.createElement('br'));
    if (roleLevels[userRole] >= roleLevels['Admin']) 
    {
        let deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.onclick = function() {
            sendRequest('/deleteTeamNotification', 
            {
                teamCode: joinCode,
                userID: localStorage.getItem('userID'),
                notificationID: notificationID
            })
            .then(response => 
            {
                if (response.result === 'OK') 
                {
                    notificationElement.remove();
                } 
                else 
                {
                    // Handle failure to delete here, e.g., show an error message
                    console.error('Failed to delete notification:', response.message);
                }
            })
            .catch(error => 
            {
                console.error('Error during deletion:', error);
            });
        };
        optionsContainer.appendChild(deleteButton);
    }
    
    notificationElement.appendChild(optionsContainer);
}

function notificationMessageCheckRole(message)
{
    if(message.split(" ").includes("Viewer")) return "a viewer";
    if(message.split(" ").includes("User")) return "a user";
    if(message.split(" ").includes("Admin")) return "an admin";
    if(message.split(" ").includes("Owner")) return "an owner";
    console.error("NOTIFICATION MESSAGE DID NOT INCLUDE VALID ROLE " + message);
}

function notificationDescriptionCreateEvent(data)
{
    let id = data.message.split("(ID: ")[1];
    let event;
    event = data.misc.currentEvent;
    
    let sameDay = false; 
    if (checkDateSameDay(event._startDate, event._endDate)) sameDay = true;
    const startDate = sameDay ? formatDate(event._startDate, false) : formatDate(event._startDate, true);
    //USER created an new event: EVENT_NAME from START_TIME to END_TIME.
    return data.sender + " created a new event: " + event._name + " from " + startDate + " to " + formatDate(event._endDate, true);
}

function formatDate(date, showDate)
{
    date = new Date(date);
    let hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    if (hours > 12) hours -= 12;
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);

    return showDate ? `${hours}:${minutes} ${ampm}, ${month}/${day}/${year}` : `${hours}:${minutes} ${ampm}`;
}

function checkDateSameDay(date1, date2)
{
    date1 = new Date(date1);
    date2 = new Date(date2);
    return (date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate());
}

function notificationDescriptionEditEvent(data)
{
    let id = data.message.split("(ID: ")[1];
    let event = data.misc.currentEvent;

    //check what was changed
    let changeCount = 0;
    let description = data.sender + " edited the event " + event._name + ", ";
    console.log("currenct start: " + event._startDate)
    console.log("prev end: " + data.misc.prevEvent._startTime)
    if(event._startDate === data.misc.prevEvent._startTime) console.log("They are the same!")
    //users
    if (JSON.stringify(event._users) !== JSON.stringify(data.misc.prevEvent._users))
    {
        description = description + "users list was changed, ";
        changeCount++;
    }

    //permissions
    if (event._permissions !== data.misc.prevEvent._permissions)
    {
        description = description + "edit permissions changed to " + event._permissions + ", ";
        changeCount++;
    }
    
    //viewable
    if (event._viewable !== data.misc.prevEvent._viewable)
    {
        description = description + "now viewable by " + event._viewable + ", "; 
        changeCount++;
    }

    //name
    if (event._name !== data.misc.prevEvent._name)
    {
        console.log("name diff")
        description = description + "name changed to " + event._name + ", "; 
        changeCount++;
    }

    //start time / end time
    if (event._startDate !== data.misc.prevEvent._startTime)
    {
        description = description + "start time changed to " + formatDate(event._startDate, true) + ", ";
        changeCount++; 
    }
    if (event._endDate !== data.misc.prevEvent._endTime)
    {
        description = description + "end time changed to " + formatDate(event._endDate, true) + ", "; 
        changeCount++;
    }

    // description
    if (event._description !== data.misc.prevEvent._description)
    {
        description = description + "description changed, ";
        changeCount++;
    }

    //description[description.lenth - 2] = " ";
    return description;
}

function notificationDescriptionDeleteEvent(data)
{
    //USER deleted the event: EVENT_NAME 
    return data.sender + " deleted the event: " + data.misc.deletedEvent._name;
}

function notificationDescriptionDescUpdate(data)
{
    if(data.message.length() > 132/* number of characters that fits */) return data.sender + "changed the team description";
    return data.message;
}

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