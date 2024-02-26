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

let initialAutoJoinValue = false;
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
    generateManageQueue();
    generateRemoveUsers();
    generateUpdateDescription();
    generateManageAutoJoin();
    generateNotificationsClear();
}

function generateOwnerSettings()
{
    generateUpdateName();
    generateDeleteTeam();
}

function generateNotificationsClear() 
{
    const header = document.querySelector('header h1');
    const clearNotificationsDiv = document.createElement('div');
    clearNotificationsDiv.id = 'clear-notifications';
    clearNotificationsDiv.textContent = 'Clear Notifications';
    const modal = document.getElementById('confirmNotificationsClearModal');
    clearNotificationsDiv.onclick = function() 
    {
        modal.style.display = 'block';
    };
    document.getElementById('closeConfirmNotificationsClearModal').onclick = function() 
    {
        modal.style.display = 'none';
        document.getElementById('manageAutoJoinError').textContent = '';
    };
    window.addEventListener('click', function(event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = 'none';
            document.getElementById('manageAutoJoinError').textContent = '';
        }
    });
    header.appendChild(clearNotificationsDiv);
}

document.getElementById('confirmClearNotifications').onclick = async function() 
{
    try 
    {
        const response = await sendRequest('/clearAllNotifications', { teamCode : teamData._joinCode });
        if (response.result === 'OK') 
        {
            alert('Notifications cleared successfully.');
            document.getElementById('confirmNotificationsClearModal').style.display = 'none';
            document.getElementById('manageAutoJoinError').textContent = '';
        }
        else if (response.result === 'FAIL') 
        {
            document.getElementById('manageAutoJoinError').textContent = response.message;
        }
    }
    catch (error)
    {
        document.getElementById('manageAutoJoinError').textContent = 'An error occurred: ' + error;
    }
};

document.getElementById('denyClearNotifications').onclick = function() 
{
    document.getElementById('confirmNotificationsClearModal').style.display = 'none';
};

function generateManageAutoJoin() 
{
    const header = document.querySelector('header h1');
    const manageAutoJoinDiv = document.createElement('div');
    manageAutoJoinDiv.id = 'autojoin-manage';
    manageAutoJoinDiv.textContent = 'Manage AutoJoin';
    const modal = document.getElementById('manageAutoJoinModal');
    manageAutoJoinDiv.onclick = function() 
    {
        fillAutoJoin();
        modal.style.display = 'block';
    };
    document.getElementById('closeManageAutoJoinModal').onclick = function() 
    {
        modal.style.display = 'none';
    };
    window.addEventListener('click', function(event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = 'none';
        }
    });

    header.appendChild(manageAutoJoinDiv);
}

function fillAutoJoin()
{
    sendRequest('/getTeamWithJoinCode', { joinCode: teamData._joinCode })
    .then(response =>
    {
        if (response.result === 'OK')
        {
            initialAutoJoinValue = response.team._autoJoin;
            document.getElementById('autoJoinSelect').value = initialAutoJoinValue.toString();
        }
        else if (response.result === 'FAIL')
        {
            document.getElementById('manageAutoJoinError').textContent = response.message;
        }
    })
    .catch(error =>
    {
        document.getElementById('manageAutoJoinError').textContent = 'An error occurred: ' + error;
    });
}

document.getElementById('updateAutoJoin').onclick = async function() 
{
    const newAutoJoinValue = document.getElementById('autoJoinSelect').value === 'true';
    console.log(newAutoJoinValue);
    try
    {
        const response = await sendRequest('/updateAutoJoin', { newAutoJoin : newAutoJoinValue, teamCode : teamData._joinCode })
        if (response.result === 'OK')
        {
            alert("AutoJoin successfully updated");
            document.getElementById('manageAutoJoinModal').style.display = 'none';
        }
        else if (response.result === 'FAIL')
        {
            document.getElementById('manageAutoJoinError').textContent = response.message;
        }
    }
    catch (error)
    {
        document.getElementById('manageAutoJoinError').textContent = 'An error occurred: ' + error;
    }
};

function fillAutoJoin() 
{
    sendRequest('/getTeamWithJoinCode', { joinCode: teamData._joinCode })
    .then(response => 
        {
        if (response.result === 'OK') 
        {
            initialAutoJoinValue = response.team._autoJoin;
            document.getElementById('autoJoinSelect').value = initialAutoJoinValue.toString();
        } 
        else if (response.result === 'FAIL') 
        {
            document.getElementById('manageAutoJoinError').textContent = response.message;
        }
    })
    .catch(error => 
    {
        document.getElementById('manageAutoJoinError').textContent = 'An error occurred: ' + error;
    });
}

function generateManageQueue() 
{
    const header = document.querySelector('header h1');
    const manageQueueDiv = document.createElement('div');
    manageQueueDiv.id = 'manage-queue';
    manageQueueDiv.textContent = 'Manage Queue';
    const modal = document.getElementById('manageQueueModal');
    manageQueueDiv.onclick = function() 
    {
        modal.style.display = 'block';
    };
    document.getElementById('closeManageQueueModal').onclick = function() 
    {
        modal.style.display = 'none';
        resetManageQueueModal();
    };
    window.addEventListener('click', function(event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = 'none';
            resetManageQueueModal();
        }
    });
    header.appendChild(manageQueueDiv);
}

function resetManageQueueModal()
{
    document.getElementById('queuedUser').value = '';
    document.getElementById('manageQueueError').textContent = '';
}

document.getElementById('admitUser').onclick = async function() 
{
    const username = document.getElementById('queuedUser').value;
    if (username)
    {
        try 
        {
            const response = await sendRequest('/admitUser', { username: username, teamCode: teamData._joinCode, senderID : userID});
            if (response.result === 'OK') 
            {
                alert("User admitted successfully");
                document.getElementById('manageQueueModal').style.display = 'none';
                resetManageQueueModal();        
            }
            else if (response.result === 'FAIL')
            {
                document.getElementById('manageQueueError').textContent = response.message;
            }
        } 
        catch (error) 
        {
            console.log(error);
            document.getElementById('manageQueueError').textContent = 'An error occurred: ' + error;
        }
    }
    else
    {
        document.getElementById('manageQueueError').textContent = "Please enter a username";
    }
};

document.getElementById('rejectUser').onclick = async function() 
{
    const username = document.getElementById('queuedUser').value;
    if (username)
    {
        try 
        {
            const response = await sendRequest('/rejectUser', { username: username, teamCode: teamData._joinCode, senderID : userID });
            if (response.result === 'OK') 
            {
                alert("User rejected successfully");
                document.getElementById('manageQueueModal').style.display = 'none';
                resetManageQueueModal();        
            }
            else if (response.result === 'FAIL')
            {
                document.getElementById('manageQueueError').textContent = response.message;
            }
        }
        catch (error) 
        {
            console.log(error);
            document.getElementById('manageQueueError').textContent = 'An error occurred: ' + error;
        }
    }
    else
    {
        document.getElementById('manageQueueError').textContent = 'Please enter a username';
    }
};

document.getElementById('blacklistUser').onclick = async function() 
{
    const username = document.getElementById('queuedUser').value;
    if (username)
    {
        try 
        {
            const response = await sendRequest('/blacklistUser', { username: username, teamCode: teamData._joinCode, senderID : userID });
            if (response.result === 'OK') 
            {
                alert("User blacklisted successfully");
                document.getElementById('manageQueueModal').style.display = 'none';
                resetManageQueueModal();        
            } 
            else if (response.result === 'FAIL')
            {
                document.getElementById('updateNameError').textContent = response.message;
            }
        } 
        catch (error) 
        {
            console.log(error);
            document.getElementById('updateNameError').textContent = 'An error occurred: ' + error;
        }
    }
    else
    {
        document.getElementById('manageQueueError').textContent = 'Enter a name you dipshit';
    }
};


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

function generateUpdateDescription() 
{
    const header = document.querySelector('header h1');
    const updateDescriptionDiv = document.createElement('div');
    updateDescriptionDiv.id = 'description-update';
    updateDescriptionDiv.textContent = 'Update Description';
    const modal = document.getElementById('updateDescriptionModal');
    updateDescriptionDiv.onclick = function() 
    {
        fillTeamDescription();
        modal.style.display = 'block';
    };
    document.getElementById('closeUpdateDescriptionModal').onclick = function() 
    {
        modal.style.display = 'none';
        resetUpdateDescriptionModal();
    };
    window.addEventListener('click', function(event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = 'none';
            resetUpdateDescriptionModal();
        }
    });
    header.appendChild(updateDescriptionDiv);
}

function fillTeamDescription()
{
    sendRequest('/getTeamWithJoinCode', { joinCode : teamData._joinCode })
    .then(response =>
    {
        if (response.result === "OK")
        {
            document.getElementById('updatedDescription').value = response.team._description;
        }
    })
    .catch(error =>
    {
        document.getElementById('updateDescriptionError').textContent = error;
    })
}


function generateUpdateName()
{
    const header = document.querySelector('header h1');
    const updateNameDiv = document.createElement('div');
    updateNameDiv.id = 'name-update';
    updateNameDiv.textContent = 'Update Name';
    const modal = document.getElementById('updateNameModal');
    updateNameDiv.onclick = function() 
    {
        fillTeamName();
        modal.style.display = 'block';
    };
    document.getElementById('closeUpdateNameModal').onclick = function() 
    {
        modal.style.display = 'none';
        resetUpdateNameModal();
    };
    window.addEventListener('click', function(event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = 'none';
            resetUpdateNameModal();
        }
    });

    header.appendChild(updateNameDiv);
}

function resetUpdateNameModal()
{
    document.getElementById('updatedName').value = '';
    document.getElementById('updateNameError').textContent = '';
}

function resetUpdateDescriptionModal()
{
    document.getElementById('updatedDescription').value = '';
    document.getElementById('updateDescriptionError').textContent = '';
}

function fillTeamName()
{
    sendRequest('/getTeamWithJoinCode', { joinCode : teamData._joinCode })
    .then(response =>
    {
        if (response.result === "OK")
        {
            document.getElementById('updatedName').value = response.team._name;
        }
    })
    .catch(error =>
    {
        document.getElementById('updateNameError').textContent = error;
    })
}

document.getElementById('updateDescription').onclick = async function()
{
    const newDesc = document.getElementById('updatedDescription').value;
    try
    {
        const response = await sendRequest('/updateTeamDescription', { newDesc : newDesc, teamCode : teamData._joinCode })
        if (response.result === 'OK')
        {
            alert("Description Updated Successfully");
            resetUpdateDescriptionModal();
            document.getElementById('updateDescriptionModal').style.display = 'none';
        }
        else if (response.result === "FAIL")
        {
            document.getElementById('updateDescriptionError').textContent = response.message;
        }
    }
    catch (error)
    {
        document.getElementById('updateDescriptionError').textContent = 'An error occurred when updating the description: ' + error;
    }
}

document.getElementById('updateName').onclick = async function()
{
    const newName = document.getElementById('updatedName').value;
    if (newName)
    {
        try
        {
            const response = await sendRequest('/updateTeamName', { newName : newName , teamCode : teamData._joinCode })
            if (response.result === 'OK')
            {
                alert("Name Updated Successfully");
                resetUpdateNameModal();
                document.getElementById('updateNameModal').style.display = 'none';
            }
            else if (response.result === "FAIL")
            {
                document.getElementById('updateNameError').textContent = response.message;
            }
        }
        catch (error)
        {
            document.getElementById('updateNameError').textContent = 'An error occurred when updating the name: ' + error;
        }
    }
    else
    {
        document.getElementById('updateNameError').textContent = "Please enter a name";
    }
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