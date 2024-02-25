const roleLevels = 
{
    'Viewer': 1, 
    'User': 2,
    'Admin': 3,
    'Owner': 4
};

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


let userRole = localStorage.getItem('userRole');
let userID = localStorage.getItem('userID');
let teamData = JSON.parse(localStorage.getItem('teamData'));

document.addEventListener('DOMContentLoaded', function ()
{
    if (roleLevels[userRole] > roleLevels['User'])
    {
        generateAdminSettings();
    }
    if (roleLevels[userRole] > roleLevels['Admin'])
    {
        generateOwnerSettings();
    }
});

function generateAdminSettings()
{
    generateRemoveUsers();
}

function generateOwnerSettings()
{
    generateDeleteTeam();
}

function generateRemoveUsers() 
{
    const header = document.querySelector('header h1');
    const removeUserDiv = document.createElement('div');
    removeUserDiv.id = 'user-remove';
    removeUserDiv.textContent = 'Remove User';
    const modal = document.getElementById('removeUserModal');
    removeUserDiv.onclick = function() 
    {
        modal.style.display = 'block';
    }
    document.getElementById('closeRemoveUserModal').onclick = function() 
    {
        modal.style.display = 'none';
        resetRemoveUserModal();
    }
    window.addEventListener('click', function(event)
    {
        if (event.target === modal) 
        {
            modal.style.display = 'none';
            resetRemoveUserModal();
        }
    });
    header.appendChild(removeUserDiv);
}

document.getElementById('kickUser').onclick = async function()
{
    const username = document.getElementById('userToRemove').value;
    if (username)
    {
        try
        {
            const response = await sendRequest('/kickUser', { username : username, teamCode : teamData._joinCode , senderID : userID});
            if (response.result === 'OK')
            {
                alert("User kicked successfully.");
                resetRemoveUserModal();
                document.getElementById('removeUserModal').style.display = 'none';
            }
            else if (response.result === "FAIL")
            {
                document.getElementById('removeUserError').textContent = response.message;  
            }
        }
        catch (error)
        {
            document.getElementById('removeUserError').textContent = 'An error occured when kicking the user';  
        }
    }
    else
    {
        document.getElementById('removeUserError').textContent = 'Please enter a username.';
    }
}

document.getElementById('banUser').onclick = async function()
{
    const username = document.getElementById('userToRemove').value;
    if (username)
    {
        try
        {
            const response = await sendRequest('/banUser', { username : username, teamCode : teamData._joinCode , senderID : userID});
            if (response.result === 'OK')
            {
                alert("User banned successfully.");
                resetRemoveUserModal();
                document.getElementById('removeUserModal').style.display = 'none';
            }
            else if (response.result === "FAIL")
            {
                document.getElementById('removeUserError').textContent = response.message;  
            }
        }
        catch (error)
        {
            console.error('Error:', error);
            document.getElementById('removeUserError').textContent = 'An error occurred when banning the user.';
        }
    }
    else
    {
        document.getElementById('removeUserError').textContent = 'Please enter a username.';
    }
}

document.getElementById('unbanUser').onclick = async function()
{
    const username = document.getElementById('userToRemove').value;
    if (username)
    {
        try
        {
            const response = await sendRequest('/unbanUser', { username : username, teamCode : teamData._joinCode , senderID : userID});
            if (response.result === 'OK')
            {
                alert("User unbanned successfully.");
                resetRemoveUserModal();
                document.getElementById('removeUserModal').style.display = 'none';
            }
            else if (response.result === "FAIL")
            {
                document.getElementById('removeUserError').textContent = response.message;  
            }
        }
        catch (error)
        {
            console.error('Error:', error);
            document.getElementById('removeUserError').textContent = 'An error occurred when banning the user.';
        }
    }
    else
    {
        document.getElementById('removeUserError').textContent = 'Please enter a username.';
    }
}

function resetRemoveUserModal()
{
    document.getElementById('userToRemove').value = '';
    document.getElementById('removeUserError').textContent = '';
}

function generateDeleteTeam() 
{
    const header = document.querySelector('header h1');
    const deleteTeamDiv = document.createElement('div');
    deleteTeamDiv.id = 'team-delete';
    deleteTeamDiv.textContent = 'Delete Team';
    const modal = document.getElementById('deleteTeamModal');
    deleteTeamDiv.onclick = function() 
    {
        modal.style.display = 'block';
    };
    document.getElementById('closeDeleteTeamModal').onclick = function() 
    {
        resetDeleteTeamModal();
        modal.style.display = 'none';
    }
    window.addEventListener('click', function(event)    
    {
        if (event.target === modal) 
        {
            resetDeleteTeamModal();
            modal.style.display = 'none';
            document.getElementById('teamConfirmSection').style.display = 'none';
        }
    });
    header.appendChild(deleteTeamDiv);
}


document.getElementById('verifyPassword').onclick = async function() 
{
    const password = document.getElementById('passwordForDeletion').value;
    try 
    {
        const response = await sendRequest('/checkpassword', { _password: password });
        if (response.result === 'OK' && response.message === 'CorrectPassword') 
        {
            document.getElementById('teamConfirmSection').style.display = 'block';
        } 
        else 
        {
            document.getElementById('deleteTeamError').textContent = 'Password verification failed.';
            document.getElementById('teamConfirmSection').style.display = 'none';
        }
    } 
    catch (error) 
    {
        console.error('Error:', error);
        document.getElementById('deleteTeamError').textContent = 'An error occurred during password verification.';
    }
}

document.getElementById('confirmDeleteTeam').onclick = async function() 
{
    try 
    {
        const response = await sendRequest('/deleteTeam', { teamCode: teamData._joinCode, userID : userID });
        if (response.result === 'OK') 
        {
            alert("Team deleted successfully.");
            window.location.href = "../../";
        } 
        else 
        {
            document.getElementById('deleteTeamError').textContent = 'Failed to delete team.';
        }
    } 
    catch (error) 
    {
        console.error('Error:', error);
        document.getElementById('deleteTeamError').textContent = 'An error occurred trying to delete the team.';
    }
}

function resetDeleteTeamModal()
{
    document.getElementById('passwordForDeletion').innerHTML = '';
    document.getElementById('teamConfirmSection').style.display = 'none';
}


function invitePeopleStart() 
{
    let modal = document.getElementById('addPeopleModal');
    modal.style.display = 'block';
    const userRoleSelect = document.getElementById('userRole');
    userRoleSelect.innerHTML = '';
    for (const [role, level] of Object.entries(roleLevels)) 
    {
        if (level <= roleLevels[userRole]) 
        {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role.charAt(0).toUpperCase() + role.slice(1);
            option.className = 'button';
            userRoleSelect.appendChild(option);
        }
    }
    document.getElementById('closeAddPeopleModal').onclick = function()
    {
        resetAddPeopleModal();
        document.getElementById('addPeopleModal').style.display = 'none';
    }
    window.onclick = function(event) 
    {
        if (event.target === modal) 
        {
            resetAddPeopleModal();
            modal.style.display = 'none';
        }
    }
}

function resetAddPeopleModal()
{
    document.getElementById('usernameToAdd').value = '';
    // Clear any previous error message
    document.getElementById('addPeopleError').textContent = '';
}

document.getElementById('submitUsername').onclick = async function() 
{
    var username = document.getElementById('usernameToAdd').value;
    var userRole = document.getElementById('userRole').value;
    let joinCode = localStorage.getItem('joinCode');
    if (username)
    {
        try 
        {
            const response = await sendRequest('/findUser', { username: username });
            if (response.result === 'OK' && response.userID != userID)
            {
                sendRequest('/inviteUser', {teamCode: joinCode, userID : userID, receiver: username, role: userRole, status: "INVITE"})
                .then((response) =>
                {
                    if (response.result === 'OK')
                    {
                        alert('User invited successfully.');
                    }
                    else if (response.result === 'FAIL')
                    {
                        document.getElementById('addPeopleError').textContent = response.message;
                    }
                });
                document.getElementById('addPeopleModal').style.display = 'none';
                resetAddPeopleModal();
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

function teamLeaveStart()
{
    let modal = document.getElementById('teamLeaveModal');
    modal.style.display = 'block';
    document.getElementById('closeTeamLeaveModal').onclick = function()
    {
        document.getElementById('closeTeamLeaveModal').style.display = 'none';
        modal.style.display = 'none';
    }
    window.onclick = function(event)
    {
        if (event.target === modal) 
        {
            modal.style.display = 'none';
        }
    };
}

document.getElementById('leaveTeam').onclick = async function()
{
    try
    {
        const response = await sendRequest('/leaveTeam', { userID : userID, teamCode : teamData._joinCode } )
        if (response.result === 'OK')
        {
            alert("You have left the team");
            window.location.href = '../../';
        }
        else
        {
            document.getElementById('leaveTeamError').textContent = response.message || "Failed to leave the team.";
        }
    }
    catch (error)
    {
        console.error('Error: ', error);
        document.getElementById('leaveTeamError').textContent = "An error occurred while trying to leave the team.";
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