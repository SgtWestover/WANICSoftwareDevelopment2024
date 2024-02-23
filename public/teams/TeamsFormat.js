/*
Name: Kaelin Wang Hu and Zach Rojas
Date: 1/16/2024
Last Edit: 1/16/2024
Description: Handles account settings and deletion
*/

//FUNCTION HEADER TEMPLATE
/**
 * Description
 * @param   {type} name - parameter description
 * @returns {type}
 */

let ws;
var addedPeople = {};
let teamsList;
const Roles = 
{
    VIEWER: 'Viewer',
    USER: 'User',
    ADMIN: 'Admin',
    OWNER: 'Owner'
};
var userID = localStorage.getItem('userID');
let modalState = 'add';
const teamHeight = 180;

document.addEventListener('DOMContentLoaded', function() 
{
    connectWebSocket();
    renderAllTeams();
});

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

// #region Teams create and join functions

/**
 * Start the process to create a new team, with a modal to enter the team name and users
 * @returns {void} - but opens a modal to create a team
 */
function teamsCreateStart() 
{
    var modal = document.getElementById('createTeamModal');
    var closeButton = document.querySelector('#createTeamModal .close');
    var form = document.getElementById('createTeamForm');
    // Show the modal
    modal.style.display = 'block';
    // When the user clicks on <span> (x), close the modal
    closeButton.onclick = function() 
    {
        modal.style.display = 'none';
        resetTeamsCreate();
    };
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = 'none';
            resetTeamsCreate();
        }
    };
    // Add People button inside modal
    document.getElementById('addPeople').onclick = function() 
    {
        modalState = 'add';
        configureAddPeopleModal();
        document.getElementById('addPeopleModal').style.display = 'block';
    };
    document.getElementById('removePeople').onclick = function() 
    {
        modalState = 'remove';
        configureAddPeopleModal();
        document.getElementById('addPeopleModal').style.display = 'block';
    };
    document.getElementById('closeAddPeopleModal').onclick = function()
    {
        resetAddPeopleModal();
        document.getElementById('addPeopleModal').style.display = 'none';
    }
    form.onsubmit = handleTeamCreation;
}

function configureAddPeopleModal() 
{
    const submitButton = document.getElementById('submitUsername');
    const removeButton = document.getElementById('removeUsername');
    const userRoles = document.getElementById('userRole');
    const userRolesLabel = document.getElementById('userRoleLabel');
    const modalHeader = document.getElementById('addPeopleModal').querySelector('h2');
    if (modalState === 'add') 
    {
        modalHeader.textContent = 'Add People';
        submitButton.style.display = 'block';
        removeButton.style.display = 'none';
        submitButton.textContent = 'Add';
        userRoles.style.display = 'block';
        userRolesLabel.style.display = 'block';
        resetAddPeopleModal();
    } 
    else 
    {
        modalHeader.textContent = 'Remove People';
        submitButton.style.display = 'none';
        removeButton.style.display = 'block';
        removeButton.textContent = 'Remove';
        userRoles.style.display = 'none';
        userRolesLabel.style.display = 'none';
        resetAddPeopleModal();
    }
}

document.getElementById('removeUsername').onclick = handleRemovePerson;

function handleRemovePerson() 
{
    var username = document.getElementById('usernameToAdd').value;
    sendRequest('/findUserName', { userID : userID })
    .then(response =>
    {
        if (response.result === "OK")
        {
            if (response.username === username)
            {
                document.getElementById('addPeopleError').textContent = 'User cannot be yourself.';
                return;
            }
            if (username && addedPeople[username])
            {
                delete addedPeople[username];
                updateAddedPeopleList();
                document.getElementById('addPeopleModal').style.display = 'none';    
            }
            else
            {
                document.getElementById('addPeopleError').textContent = 'User not found.';
            }
        }
    })
    .catch(error => 
    {
        console.error('Error fetching user:', error);
    });
}

function showUserList(event) 
{
    var descriptionModal= document.getElementById('descriptionModal');R
    descriptionModal.style.display = 'none';
    var modal = document.getElementById('userListModal');
    var closeButton = document.querySelector('#userListModal .close');
    var userlistContainer = document.getElementById("UserListModalContainer");
    var joinCode = event.target.parentElement.parentElement.childNodes[4].innerHTML;
    userlistContainer.innerHTML = "";
    // Fetch the user object from the backend
    sendRequest('/getUser', { userID: userID })
    .then(response => 
    {
        if (response.result === 'OK') 
        {
            var user = response.user; //render the user first
            teamsList.teams.forEach(team => 
            {
                if (team._joinCode === joinCode) 
                {
                    let thisUserElement = document.createElement("div");
                    thisUserElement.classList.add("modal-team-user");
                    thisUserElement.innerHTML = `${user._name} - ${team._users[user._name]}`; //render the viewing user first
                    userlistContainer.appendChild(thisUserElement);
                    for (const [username, role] of Object.entries(team._users)) 
                    {
                        if (username === user._name) continue; // Skip the current user
                        let userElement = document.createElement("div");
                        userElement.classList.add("modal-team-user");
                        userElement.innerHTML = `${username} - ${role}`;
                        userlistContainer.appendChild(userElement); // Append the user element to the user list container
                    }
                }
            });
            modal.style.display = 'block';
        } 
        else 
        {
            console.error('Failed to fetch user:', response.message);
        }
    })
    .catch(error => 
    {
        console.error('Error fetching user:', error);
    });
    // When the user clicks on <span> (x), close the modal
    closeButton.onclick = function() 
    {
        modal.style.display = 'none';
    };
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = 'none';
        }
    };
}

function showTeamDescription(event) 
{
    var userModal = document.getElementById('userListModal');
    userModal.style.display = 'none';
    var modal = document.getElementById('descriptionModal');
    var closeButton = document.querySelector('#descriptionModal .close');
    var descriptionContainer = document.getElementById("descriptionModalContainer");
    var joinCode = event.target.parentElement.childNodes[4].innerHTML;
    descriptionContainer.innerHTML = "";
    //Get description for the tean and show it
    teamsList.teams.forEach(team => 
    {
        if (team._joinCode === joinCode)
        {
            let descriptionElement = document.createElement("div");
            console.log(descriptionElement);
            descriptionElement.classList.add("modal-team-description");
            descriptionElement.innerHTML = `${team._description}`;
            descriptionContainer.appendChild(descriptionElement);
        }
    });
    // Show the modal
    modal.style.display = 'block';
    // When the user clicks on <span> (x), close the modal
    closeButton.onclick = function() 
    {
        modal.style.display = 'none';
    };
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function() 
    {
        if (event.target === modal) 
        {
            modal.style.display = 'none';
        }
    };
}

document.getElementById('submitUsername').onclick = async function() 
{
    var username = document.getElementById('usernameToAdd').value;
    var userRole = document.getElementById('userRole').value;
    if (username) 
    {
        try 
        {
            const response = await sendRequest('/findUser', { username: username });
            if (response.result === 'OK' && response.userID != userID)
            {
                addedPeople[username] = { role: userRole, status: "INVITE"};
                console.log("addedPeople: ", addedPeople);
                // Close the modal and reset
                document.getElementById('addPeopleModal').style.display = 'none';
                resetAddPeopleModal();
                updateAddedPeopleList();
            }
            else if (response.result === 'OK' && response.userID == userID)
            {
                document.getElementById('addPeopleError').textContent = 'User cannot be yourself.';
            }
            else 
            {
                document.getElementById('addPeopleError').textContent = 'User not found.';
            }
        } 
        catch (error) 
        {
            console.error('Error:', error.message);
            document.getElementById('addPeopleError').textContent = 'An error occurred.';
        }
    } 
    else 
    {
        // Display an error message if no username is entered
        document.getElementById('addPeopleError').textContent = 'Please enter a username.';
    }
};

function updateAddedPeopleList()
{
    const addedPeopleList = document.getElementById('addedPeopleList');
    addedPeopleList.innerHTML = '';
    for (const [username, info] of Object.entries(addedPeople)) 
    {
        const personElement = document.createElement('div');
        personElement.textContent = `${username} - ${info.role} (Status: ${info.status})`;
        addedPeopleList.appendChild(personElement);
    }
}

function resetAddPeopleModal()
{
    document.getElementById('usernameToAdd').value = '';
    // Clear any previous error message
    document.getElementById('addPeopleError').textContent = '';
    document.getElementById('userRole').value = 'Viewer';
}

function handleTeamCreation(event) 
{
    event.preventDefault();
    var teamName = document.getElementById('teamName').value;
    var teamDescription = document.getElementById('teamDescription').value;
    var autoJoin = document.getElementById('autoJoin').value === 'true';
    var joinPerms = document.getElementById('joinPerms').value;
    var modal = document.getElementById('createTeamModal');
    var team;
    modal.style.display = 'none';
    sendRequest('/findUserName', { userID: userID })
    .then(response => 
    {
        if (response.result === 'OK') 
        {
            var teamCreatorName = response.username;
            addedPeople[teamCreatorName] = { role: Roles.OWNER, status: "JOINED" };
            team = 
            {
                _name: teamName,
                _description: teamDescription,
                _usersQueued: addedPeople,
                _autoJoin: autoJoin,
                _joinPerms: joinPerms
            };
            resetTeamsCreate();
            return sendRequest('/createTeam', team);
        }
        else 
        {
            throw new Error('Team creator not found');
        }
    })
    .then(response => 
    {
        if (response.result === 'OK') 
        {
            renderAllTeams();
        }
    })
    .catch(error => 
    {
        console.error('Error:', error);
        throw error;
    });
}

function resetTeamsCreate()
{
    // Get the form within the create team modal
    var form = document.getElementById('createTeamForm');
    // Reset the form fields to their default values
    form.reset();
    console.log("addedPeople: ", addedPeople);
    addedPeople = {};
    updateAddedPeopleList();
}

document.getElementById('joinTeamButton').onclick = async function() 
{
    var joinCode = document.getElementById('teamJoinCode').value;
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_~';
    // Check if the join code is valid
    if (joinCode.length === 9 && [...joinCode].every(char => characters.includes(char)) && 1) 
    {
        try
        {
            const response = await sendRequest('/joinTeam', { userID: userID, joinCode: joinCode });
            // Handle different responses
            if (response.result === 'OK') 
            {
                updateJoinTeamMessage('Successfully joined the team!', 'Green');
                closeTeamJoinModal();
                renderAllTeams();
            } 
            else if (response.result === 'QUEUED') 
            {
                updateJoinTeamMessage('You have been added to the queue.', 'White');
                closeTeamJoinModal();
            } 
            else 
            {
                updateJoinTeamMessage('Failed to join the team.', 'Red');
            }
        } 
        catch (error) 
        {
            console.error('Error:', error);
            updateJoinTeamMessage('An error occurred while trying to join the team.', 'Red');
        }
    } 
    else 
    {
        updateJoinTeamMessage('Invalid team join code.', 'Red');
    }
};

function updateJoinTeamMessage(message, color)
{
    messageElement = document.getElementById("joinTeamMessage");
    messageElement.innerHTML = message
    messageElement.style.color = color
}

/**
 * Start the process to join a team, with a modal to enter the team code
 * @returns {void} - but opens a modal to join a team
 */
function teamsJoinStart() 
{
    var joinTeamModal = document.getElementById('joinTeamModal');
    var closeButton = joinTeamModal.querySelector('.close');

    // Show the modal
    joinTeamModal.style.display = 'block';

    // Close the modal when the close button (x) is clicked
    closeButton.onclick = function() 
    {
        closeTeamJoinModal();
    };

    // Close the modal when clicking outside of it
    window.onclick = function(event) 
    {
        if (event.target === joinTeamModal) 
        {
            closeTeamJoinModal();
        }
    };
}

function closeTeamJoinModal()
{
    joinTeamModal.style.display = 'none';
    document.getElementById('teamJoinCode').value = '';
    document.getElementById('joinTeamMessage').value = '';
}

/**
 * Show a dropdown notification relating to any teams notifications
 * @returns {void} - but opens a dropdown notification menu
 */
function showTeamsNotifs() 
{
    var dropdown = document.getElementById('notificationDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    sendRequest('/getUserNotifications', { userID: userID })
    .then(response => 
    {
        if (response.result === 'OK') 
        {
            renderNotifications(response.notifications);
        }
    })
    .catch(error => console.error('Error fetching notifications:', error));
}

function renderNotifications(notifications) 
{
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.innerHTML = ''; // Clear the HTML first
    notifications.forEach(notification => 
    {
        const notificationDiv = document.createElement('div');
        notificationDiv.className = 'notification-item';
        // Create and append the time element
        const timeElement = document.createElement('span');
        timeElement.className = 'notification-time';
        timeElement.textContent = new Date(notification.sendDate).toLocaleTimeString();
        notificationDiv.appendChild(timeElement);
        const messageElement = document.createElement('span');
        messageElement.className = 'notification-message';
        messageElement.textContent = `${notification.type}: ${notification.message}`;
        notificationDiv.appendChild(messageElement);
        const deleteButton = document.createElement('button');
        deleteButton.className = 'notification-delete';
        deleteButton.textContent = '×';
        deleteButton.onclick = (event) => 
        {
            event.stopPropagation(); //Stop it from popping up the notif
            deleteNotification(notification.id, notificationDiv);
        };
        notificationDiv.appendChild(deleteButton);
        // Set the click event for the entire notification div
        notificationDiv.onclick = () => openNotificationModal(notification, notificationDiv);

        dropdown.appendChild(notificationDiv);
    });
}

function deleteNotification(notificationId, notificationDiv) 
{
    // Call backend to delete the notification, with global userID
    sendRequest('/deleteNotification', { userID: userID, notificationID: notificationId })
    .then(response => 
    {
        if (response.result === 'OK') 
        {
            notificationDiv.remove();
        } 
        else 
        {
            console.error('Failed to delete notification:', response.message);
        }
    })
    .catch(error => 
    {
        console.error('Error deleting notification:', error);
    });
}

function openNotificationModal(notification, notificationDiv) 
{
    const modal = document.getElementById('notificationInteractionModal');
    const messageElement = document.getElementById('notificationMessage');
    const actionsElement = document.getElementById('notificationActions');
    messageElement.textContent = `${notification.type}: ${notification.message}`;
    actionsElement.innerHTML = '';
    if (notification.type === 'TEAM_INVITE') 
    {
        const acceptButton = createActionButton('Accept', () => handleTeamInvite(notification.id, 'accept', notificationDiv));
        const rejectButton = createActionButton('Reject', () => handleTeamInvite(notification.id, 'reject', notificationDiv));
        actionsElement.appendChild(acceptButton);
        actionsElement.appendChild(rejectButton);
    }
    else if (notification.type === "EVENT_CREATE") 
    {
        const dismissButton = createActionButton('Dismiss', () => 
        {
            closeNotificationModal();
            deleteNotification(notification.id, notificationDiv);
        });
        const goToTeamButton = createActionButton('Go To Team', () => goToTeamPage(notification.id));
        actionsElement.appendChild(dismissButton);
        actionsElement.appendChild(goToTeamButton);
    }
    else if (notification.type === "EVENT_DELETE")
    {
        const dismissButton = createActionButton('Dismiss', () => 
        {
            closeNotificationModal();
            deleteNotification(notification.id, notificationDiv);
        });
        const goToTeamButton = createActionButton('Go To Team', () => goToTeamPage(notification.id));
        actionsElement.appendChild(dismissButton);
        actionsElement.appendChild(goToTeamButton);
    }
    modal.style.display = 'block';
}

function goToTeamPage(notifID) 
{
    // Fetch team data using eventID, then navigate to the team's homepage
    sendRequest('/findTeamWithNotifID', { notifID: notifID })
    .then(response => 
    {
        if (response.result === 'OK' && response.team) 
        {
            window.location.href = `teamPage/TeamPage.html`;
            localStorage.setItem("joinCode", response.team._joinCode);    
        }
    })
    .catch(error => console.error('Error finding team with eventID:', error));
}

function createActionButton(text, onClick) 
{
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
}

function closeNotificationModal() 
{
    const modal = document.getElementById('notificationInteractionModal');
    modal.style.display = 'none';
}

function handleTeamInvite(notificationId, action, notificationDiv) 
{
    sendRequest('/handleTeamInvite', { userID: userID, notificationID: notificationId, action: action })
    .then(response =>   
    {
        if (response.result === 'OK') 
        {
            alert(`Team invite ${action}ed.`);
            closeNotificationModal();
            notificationDiv.remove(); // Remove the notification div from the dropdown
        } 
        else 
        {
            alert(`Failed to ${action} team invite.`);
        }
    })
    .catch(error => 
    {
        console.error(`Error ${action}ing team invite:`, error);
        alert(`An error occurred while ${action}ing team invite.`);
    });
}
document.addEventListener('click', function(event) 
{
    var dropdown = document.getElementById('notificationDropdown');
    var iconButton = document.querySelector('.icon-button');
    // Check if the clicked target is not the dropdown and not the button
    if (!dropdown.contains(event.target) && !iconButton.contains(event.target)) 
    {
        dropdown.style.display = 'none';
    }
});

function teamsSort()
{

}

//creates the html elements to display the team panel
function renderTeamsPanel(team, teamCount)
{
    const teamPadding = 30;
    const teamListVertOffset = 82 /*Height of header*/ + teamPadding;
    const teamVerticalSpacing = teamHeight + teamPadding;
    let container = document.createElement("div");
    container.classList.add("team-container");
    container.style.top = `${teamVerticalSpacing * (teamCount - 1) + teamListVertOffset}px`;
    let teamName = document.createElement("div"); 
    teamName.classList.add("team-name");
    teamName.innerHTML = team._name;
    let description = document.createElement("div");
    description.classList.add("team-description");
    description.innerHTML = team._description;
    description.onclick = function(event)
    {
        showTeamDescription(event);
    };
    let userList = document.createElement("div");
    userList.classList.add("team-userList-container");
    let teamViewButton = document.createElement("div");
    teamViewButton.classList.add("button");
    teamViewButton.classList.add("team-viewButton");
    teamViewButton.onclick = function(event)
    {
        window.location.href = `teamPage/TeamPage.html`;
        localStorage.setItem("joinCode", team._joinCode);
    };
    let teamViewButtonIcon = document.createElement("i");
    //teamViewButtonIcon.classList.add("button");
    teamViewButtonIcon.classList.add("fa", "fa-arrow-right");
    teamViewButtonIcon.classList.add("team-viewButton-icon");
    sendRequest('/getUser', { userID: userID })
    .then(response =>
    {
        if (response.result === 'OK')
        {
            let user = response.user;
            let thisUserElement = document.createElement("div");
            thisUserElement.classList.add("modal-team-user");
            thisUserElement.innerHTML = `${user._name} - ${team._users[user._name]}`; //render the viewing user first
            thisUserElement.onclick = function(event)
            {
                showUserList(event);
            };
            userList.appendChild(thisUserElement);
            for (const [username, role] of Object.entries(team._users)) 
            {
                if (username === user._name) continue; // Skip the current user
                let userElement = document.createElement("div");
                userElement.classList.add("team-user");
                userElement.innerHTML = `${username} - ${role}`;
                userElement.onclick = function(event)
                {
                    showUserList(event);
                };
                userList.appendChild(userElement); // Append the user element to the user list container
            }        
        }
    })
    .catch(error =>
    {
        console.error('Error fetching user:', error);
    });
    let teamCode = document.createElement("div");
    teamCode.classList.add("team-code");
    teamCode.innerHTML = team._joinCode;
    let teamNotification = document.createElement("div");
    teamNotification.classList.add("team-notification");
    // Append all created elements to the container. That's a lotta appends
    teamViewButton.appendChild(teamViewButtonIcon);
    container.appendChild(teamViewButton);
    container.appendChild(description);
    container.appendChild(teamName);
    container.appendChild(userList);
    container.appendChild(teamCode);
    document.body.append(container);
}

async function GetTeamList() 
{
    try 
    {
        const response = sendRequest("/getUserTeams", {userID: userID});
        return response;
    } 
    catch (error) 
    {
        console.error('Error:', error.message);
    }
};

async function renderAllTeams() 
{
    try 
    {
        teamsList = await GetTeamList();
        console.log(JSON.stringify(teamsList));
        let teamCount = 0;
        // Clear existing teams before rendering new ones
        document.querySelectorAll('.team-container').forEach(container => container.remove());
        teamsList.teams.forEach(team => 
        {
            teamCount++;
            renderTeamsPanel(team, teamCount);
        });
        repositionTeams();
    } 
    catch (error) 
    {
        console.error('Error:', error.message);
    }
}

//resize so its centered
window.addEventListener("resize", function(event) 
{
    repositionTeams();
});

function repositionTeams()
{
    const sidebarWidth = 200;
    const widthPadding = 50;
    var teamContainers = document.getElementsByClassName("team-container");
    for (const container of teamContainers) 
    {
        // Center element
        container.style.height = `${teamHeight}px`;
        container.style.width = `${window.innerWidth - sidebarWidth - widthPadding}px`;
        container.style.left = `${((window.innerWidth / 2) - (parseInt(container.offsetWidth) / 2) + sidebarWidth / 2)}px`;
    }
}

function handleWebSocketMessage(data) 
{
    try
    {
        console.log("handle web socket message");
        const message = JSON.parse(data);
        if (message.type === 'teamUpdate') 
        {
            // Call function to update teams
            renderAllTeams();
        }
        // Handle other message types as needed
    } 
    catch (error) 
    {
        console.error("Error handling WebSocket message:", error);
    }
}

// #endregion Teams create and join functions

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