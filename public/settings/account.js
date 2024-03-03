/*
Name: Kaelin Wang Hu and Jason Leech
Date: 11/29/2023
Last Edit: 1/7/2023
Description: Handles account settings and deletion
*/

//FUNCTION HEADER TEMPLATE
/**
 * Description
 * @param   {type} name - parameter description
 * @returns {type}
 */

var pass; //Global variable set to entered password
const userID = localStorage.getItem('userID');

document.addEventListener('DOMContentLoaded', async function ()
{
    try
    {
        const response = await sendRequest('/getUser', { userID });
        if (response.result === 'OK')
        {
            const user = response.user;
            if (user._settings._changeNameTimes >= 3)
            {
                document.getElementById('change-name').disabled = true;
            }
            else
            {
                document.getElementById('change-name').addEventListener('click', function()
                {
                    changeNameStart();
                });
            }
        }
    }
    catch (error)
    {
        console.log(error);
    }
});

function changePasswordStart()
{
    let modal = document.getElementById('changePasswordModal');
    modal.style.display = 'block';
    document.getElementById('closeChangePasswordModal').onclick = function()
    {
        modal.style.display = 'none';
        resetChangePasswordModal();
    }
    window.onclick = function(event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = 'none';
            resetChangePasswordModal();
        }
    }    
    modal.style.display = 'block';
}

document.getElementById('submitCurrentPassword').onclick = async function() 
{
    const currentPassword = document.getElementById('currentPassword').value;
    if (currentPassword)
    {
        try
        {
            const response = await sendRequest('/checkpassword', { _password: currentPassword });
            if (response.result === 'OK' && response.message === 'CorrectPassword')
            {
                document.getElementById('currentPassword').style.display = 'none';
                document.getElementById('toggleCurrentPassword').style.display = 'none';
                document.getElementById('submitCurrentPassword').style.display = 'none';
                document.querySelector('#changePasswordModal p').style.display = 'none';
                document.getElementById('newPasswordSection').style.display = 'block';
                document.getElementById('changePasswordError').textContent = '';   
            }
            else
            {
                document.getElementById('changePasswordError').textContent = response.message;   
            }
        }
        catch (error)
        {
            document.getElementById('changePasswordError').textContent = error;   
        }
    }
    else
    {
        document.getElementById('changePasswordError').textContent = 'Hey dumbass you gotta have a password you stupid son a ';
    }
}

function resetChangePasswordModal() 
{
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPasswordSection').style.display = 'none';
    document.getElementById('currentPassword').style.display = 'block';
    document.getElementById('toggleCurrentPassword').style.display = 'block';
    document.getElementById('submitCurrentPassword').style.display = 'block';
    document.querySelector('#changePasswordModal p').style.display = 'block';
    document.getElementById('changePasswordError').textContent = '';
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) 
    {
        newPasswordInput.value = '';
    }
}

document.getElementById('submitNewPassword').onclick = async function() 
{
    const newPassword = document.getElementById('newPassword').value;
    if (newPassword)
    {
        if (isValidPassword(newPassword))
        {
            const response = await sendRequest('/changePassword', { userID, newPassword });
            if (response.result === 'OK')
            {
                alert("Password successfully changed!");
                document.getElementById('changePasswordModal').style.display = 'none';
                resetChangePasswordModal();
            }
            else if (response.result === 'FAIL')
            {
                document.getElementById('changePasswordError').textContent = response.message;
            }
        }
        else
        {
            document.getElementById('changePasswordError').textContent = "Invalid password format. Please enter a password 8 and 32 characters, containing at least one lowercase letter, one uppercase letter, one digit, and one special ASCII character.";
        }
    }
    else
    {
        document.getElementById('changePasswordError').textContent = "You must have a password";
    }
};

function isValidPassword(password)
{
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ -\/:-@\[-`\{-~])[A-Za-z\d -\/:-@\[-`\{-~]{8,32}$/;
    return passwordRegex.test(password);
}

//#region Signout functions

/**
 * Handles signout with a server call
 * @returns {void}
 */
function signout() 
{
    //calls signout on the server
    fetch('/signout', 
    {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/json'}
    })
    .then(response => response.json())
    .then(message => 
    {
        if (message.result === 'OK') 
        {
            localStorage.removeItem('userID');
            localStorage.setItem('isSignedIn', false);
            // Clear any client-side storage or state that references the user
            window.location.href = "/login";
        } 
        else 
        {
            console.error('Logout failed:', message);
        }
    })
    .catch(error => console.error('Error:', error));
}

//#endregion Signout functions

//#region Account deletion functions

/**
 * Function to initiate account deletion process by showing the modal
 * @returns {void}
 */
async function deleteAccount() 
{
    var modal = document.getElementById("passwordModal");
    var span = document.getElementsByClassName("close")[0]; //ex
    var passwordError = document.getElementById("passwordError"); // Element to display error message

    // Show the modal
    modal.style.display = "block";
    passwordError.textContent = ''; // Clear any previous error messages

    // Close the modal when the 'x' is clicked
    span.onclick = function () 
    {
        modal.style.display = "none";
        passwordError.textContent = ''; // Clear error message when modal is closed
    };

    // Close the modal if clicked outside of it
    window.onclick = function (event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = "none";
            passwordError.textContent = ''; // Clear error message when modal is closed
        }
    };

    // Handles the password submission
    document.getElementById("submitPassword").onclick = async function () 
    {
        const password = document.getElementById("passwordInput").value;
        passwordError.textContent = ''; // Clear error message before validation
        const isValid = await validatePassword(password);
        if (isValid) 
        {
            modal.style.display = "none";
            confirmPassword(); // Proceed to confirmation if the password is correct
        } 
        else 
        {
            passwordError.textContent = "Your password is incorrect"; // Display error message if password is wrong
        }
    };
}

/**
 * Validates password with a serve call
 * @param   {string} password - the password to validate
 * @returns {bool}
 */
async function validatePassword(password) 
{
    pass = password;
    let isValid = false;
    try 
    {
        //Checks the password
        let response = await fetch('/checkpassword', 
        {
            method: 'POST',
            credentials: 'same-origin',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({_password: password})
        });

        // Assuming the response is always 200 OK
        let message = await response.json();
        if (message.result === 'OK') 
        {
            isValid = message.message === "CorrectPassword";
        } 
        else
        {
            console.log("Server Error");
        }
    } 
    catch (error) 
    {
        console.error('Error:', error);
    }
    return isValid;
}

/**
 * Handles the actual account deletion process once deletion is confirmed
 * @param   {string} password - the password to validate (again as a failsafe)
 * @returns {void}
 */
function deleteAccountConfirmed(password) 
{
    fetch('/deleteaccount', 
    {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userID, password })
    })
    .then(response => response.json())
    .then(message => 
    {
        if (message.result === 'OK') 
        {
            localStorage.removeItem('userID'); //removes the userID and redirects back to the login
            window.location.href = "/login";
        } 
        else 
        {
            alert("Failed to delete account");
        }
    })
    .catch(error => console.error('Error:', error));
}

//#endregion Account deletion functions

//#region Account deletion and modal helpers

/**
 * Toggles password (eye) icon visibility
 * @returns {void}
 */
document.getElementById("togglePassword").addEventListener('click', function () 
{
    var passwordInput = document.getElementById("passwordInput");
    var type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password'; //switch between text and password
    passwordInput.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash'); //toggle the icon
});

document.getElementById("toggleCurrentPassword").addEventListener('click', function () 
{
    var passwordInput = document.getElementById("currentPassword");
    var type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password'; //switch between text and password
    passwordInput.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash'); //toggle the icon
});

document.getElementById("toggleNewPassword").addEventListener('click', function () 
{
    var passwordInput = document.getElementById("newPassword");
    var type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password'; //switch between text and password
    passwordInput.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash'); //toggle the icon
});

/**
 * Shows confirmation modal for account deletion
 * @returns {void}
 */
function confirmPassword() 
{
    showModalConfirmation();
    document.getElementById("confirmDelete").onclick = function () 
    {
        closeModalConfirmation();
        deleteAccountConfirmed(pass);
    };
    document.getElementById("cancelDelete").onclick = function () 
    {
        closeModalConfirmation();
    };
}

/**
 * Displays the custom confirmation modal
 * @returns {void}
 */
function showModalConfirmation() 
{
    var modal = document.getElementById("confirmationModal");
    modal.style.display = "block";

    //if clicked on the close or clicked outside, close the modal
    var span = modal.getElementsByClassName("close")[0];
    span.onclick = function () 
    {
        modal.style.display = "none";
    };
    window.onclick = function (event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = "none";
        }
    };
}

/**
 * Close the custom confirmation modal
 * @returns {void}
 */
function closeModalConfirmation() 
{
    var modal = document.getElementById("confirmationModal");
    modal.style.display = "none";
}

function changeNameStart() 
{
    let modal = document.getElementById('changeNameModal');
    modal.style.display = 'block';
    document.getElementById('closeChangeNameModal').onclick = function()
    {
        document.getElementById('newName').value = '';
        document.getElementById('changeNameError').textContent = '';
        modal.style.display = 'none';
    }
    window.onclick = function(event) 
    {
        if (event.target === modal) 
        {
            document.getElementById('newName').value = '';
            document.getElementById('changeNameError').textContent = '';
            modal.style.display = 'none';
        }
    }
}

document.getElementById('newNameSubmit').onclick = async function() 
{
    const newName = document.getElementById('newName').value;
    try
    {
        const response = await sendRequest('/changeName', { userID, newName });
        if (response.result === 'OK')
        {
            alert(`Name changed successfully to ${newName}!`);
            document.getElementById('change-name').style.opacity = 0.5;
            document.getElementById('change-name').disabled = true;
            document.getElementById('changeNameModal').style.display = 'none';
            document.getElementById('newName').value = '';
            document.getElementById('changeNameError').textContent = '';
        }
        else if (response.result === 'FAIL')
        {
            document.getElementById('changeNameError').textContent = response.message;
        }
    }
    catch (error)
    {
        document.getElementById('changeNameError').textContent = error;
    }
}

function exportEventsStart() 
{
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", "/exportUserEvents");
    form.setAttribute("target", "hiddenDownloader");
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", "userID");
    hiddenField.setAttribute("value", userID);
    form.appendChild(hiddenField);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}

function importEventsStart() 
{
    document.getElementById('fileInput').click();
}

async function handleFileImport(files) 
{
    if (files.length === 0) 
    {
        console.log("No file selected.");
        return;
    }

    const file = files[0];
    const reader = new FileReader();

    reader.onload = async function(event) 
    {
        try 
        {
            const events = JSON.parse(event.target.result);
            console.log("Imported Events:", events);
            const response = await sendRequest('/importUserEvents', 
            {
                userID: userID,
                events: events
            });
            if (response.result === 'OK') 
            {
                alert(`${response.message}`);
            } 
            else 
            {
                alert('Failed to import events:', response.message);
            }
        } 
        catch (error) 
        {
            console.error("Error reading or sending file:", error);
        }
    };
    reader.readAsText(file);
}

function clearEventsStart()
{
    let modal = document.getElementById('clearEventsModal');
    modal.style.display = 'block';
    document.getElementById('closeClearEventsModal').onclick = function()
    {
        modal.style.display = 'none';
        document.getElementById('clearEventsError').textContent = '';
    }
    window.onclick = function(event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = 'none';
            document.getElementById('clearEventsError').textContent = '';
        }
    }    
    modal.style.display = 'block';
}

document.getElementById('clearEventsConfirm').onclick = async function()
{
    try
    {
        const response = await sendRequest('/clearUserEvents', { userID });
        if (response.result === 'OK')
        {
            alert(`${response.message}`);
            document.getElementById('clearEventsModal').style.display = 'none';
        }
        else if (response.result === 'FAIL')
        {
            document.getElementById('clearEventsError').textContent = response.message;
        }
    }
    catch (error)
    {
        document.getElementById('clearEventsError').textContent = error;
    }
}

document.getElementById('clearEventsDeny').onclick = async function()
{
    document.getElementById('clearEventsModal').style.display = 'none';
    document.getElementById('clearEventsError').textContent = '';
}

function changeNotificationsStart() 
{
    sendRequest('/fillNotificationsSettings', { userID })
    .then(response => 
    {
        if (response.result === 'OK') 
        {
            const { _ignoreTeamInvites, _rejectTeamInvites, _muteAllNotifs, _mutedTeams } = response.settings;
            document.getElementById('ignoreTeamInvites').checked = _ignoreTeamInvites;
            document.getElementById('rejectTeamInvites').checked = _rejectTeamInvites;
            document.getElementById('muteAllNotifs').checked = _muteAllNotifs;
            const mutedTeamsContainer = document.getElementById('mutedTeamsContainer') || createMutedTeamsContainer();
            fillMutedTeams(mutedTeamsContainer, _mutedTeams);
            let modal = document.getElementById('manageNotifsModal');
            modal.style.display = 'block';
            setupModalCloseEvents(modal);
            document.getElementById('muteSpecificTeam').addEventListener('click', function() 
            {
                showTeamCodeModal('Mute');
            });
            document.getElementById('unmuteSpecificTeam').addEventListener('click', function() 
            {
                showTeamCodeModal('Unmute');
            });
        } 
        else 
        {
            document.getElementById('manageNotifsError').textContent = response.message;
        }
    }).catch(error => 
    {
        document.getElementById('manageNotifsError').textContent = `An error occurred: ${error}`;
    });
}

function setupModalCloseEvents(modal) 
{
    const closeModal = () => 
    {
        document.getElementById('manageNotifsError').textContent = '';
        modal.style.display = 'none';
    };
    document.getElementById('closeManageNotifsModal').onclick = closeModal;
    const outsideClickListener = (event) => 
    {
        if (event.target === modal) 
        {
            closeModal();
            window.removeEventListener('click', outsideClickListener);
        }
    };
    window.addEventListener('click', outsideClickListener);
}


function createMutedTeamsContainer() 
{
    const container = document.createElement('div');
    container.id = 'mutedTeamsContainer';
    const modalContent = document.querySelector('#manageNotifsModal .modal-content');
    if (modalContent) 
    {
        modalContent.appendChild(container);
    }
    return container;
}


function fillMutedTeams(container, teams) 
{
    container.innerHTML = '';
    teams.forEach(teamCode => 
    {
        const teamDiv = document.createElement('div');
        teamDiv.textContent = `Muted Team: ${teamCode}`;
        container.appendChild(teamDiv);
    });
}

function showTeamCodeModal(action) 
{
    let modal = document.getElementById('teamCodeModal');
    modal.style.display = 'block';
    document.getElementById('submitTeamCode').textContent = action + " Team";
    document.getElementById('closeTeamCodeModal').onclick = function()
    {
        modal.style.display = 'none';
        clearTeamCodeModal();
    };
    window.onclick = function(event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = 'none';
            clearTeamCodeModal();
        }
    };
    document.getElementById('submitTeamCode').onclick = function() 
    {
        submitTeamCode(action.toLowerCase());
    };
}

function clearTeamCodeModal()
{
    document.getElementById('teamCodeInput').value = '';
    document.getElementById('teamCodeError').textContent = '';
}

function submitTeamCode(action) 
{
    const teamCode = document.getElementById('teamCodeInput').value;
    if (!teamCode) 
    {
        document.getElementById('teamCodeError').textContent = 'Please enter a team code.';
        return;
    }
    if (action === 'unmute') 
    {
        const wasRemoved = removeFromMutedTeamsList(teamCode);
        if (wasRemoved) 
        {
            document.getElementById('teamCodeModal').style.display = 'none';
            document.getElementById('teamCodeInput').value = '';
            document.getElementById('teamCodeError').textContent = '';
        } 
        else 
        {
            document.getElementById('teamCodeError').textContent = 'Team code not found in muted list.';
        }
        return;
    }
    if (action === 'mute') 
    {
        sendRequest('/checkUserTeams', { teamCode, userID, action })
        .then(response => 
        {
            if (response.result === 'OK') 
            {
                addToMutedTeamsList(teamCode);
                document.getElementById('teamCodeModal').style.display = 'none';
                document.getElementById('teamCodeInput').value = '';
                document.getElementById('teamCodeError').textContent = '';
            } 
            else 
            {
                document.getElementById('teamCodeError').textContent = response.message;
            }
        })
        .catch(error => 
        {
            document.getElementById('teamCodeError').textContent = `An error occurred: ${error}`;
        });
    }
}

function removeFromMutedTeamsList(teamCode) 
{
    const container = document.getElementById('mutedTeamsContainer');
    let foundAndRemoved = false;
    if (!container) return foundAndRemoved;
    Array.from(container.children).forEach(child => 
    {
        if (child.textContent.includes(teamCode)) 
        {
            container.removeChild(child);
            foundAndRemoved = true;
        }
    });
    return foundAndRemoved;
}

function addToMutedTeamsList(teamCode) 
{
    const container = document.getElementById('mutedTeamsContainer') || createMutedTeamsContainer();
    const teamDiv = document.createElement('div');
    teamDiv.textContent = `Muted Team: ${teamCode}`;
    container.appendChild(teamDiv);
}

// Add event listener to the submit button
document.getElementById('submitNotificationSettings').addEventListener('click', function ()
{
    const _ignoreTeamInvites = document.getElementById('ignoreTeamInvites').checked;
    const _rejectTeamInvites = document.getElementById('rejectTeamInvites').checked;
    const _muteAllNotifs = document.getElementById('muteAllNotifs').checked;
    const mutedTeamsContainer = document.getElementById('mutedTeamsContainer');
    let _mutedTeams = [];
    if (mutedTeamsContainer) 
    {
        _mutedTeams = Array.from(mutedTeamsContainer.children).map(child => 
        {
            return child.textContent.replace('Muted Team: ', '');
        });
    }

    // Package the settings
    const settings = 
    {
        _ignoreTeamInvites,
        _rejectTeamInvites,
        _muteAllNotifs,
        _mutedTeams
    };
    sendRequest('/updateNotificationSettings', { userID, settings })
    .then(response => 
    {
        if (response.result === 'OK') 
        {
            alert('Notification settings updated successfully.');
            document.getElementById('manageNotifsModal').style.display = 'none';
            document.getElementById('manageNotifsError').textContent = '';
        } 
        else 
        {
            document.getElementById('manageNotifsError').textContent = response.message;
        }
    })
    .catch(error => 
    {
        document.getElementById('manageNotifsError').textContent = `An error occurred: ${error}`;
    });
});


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

//#endregion Account deletion and modal helpers