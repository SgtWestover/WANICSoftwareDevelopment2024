/*
Name: Kaelin Wang Hu and Jason Leech
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

var addedPeople = {};
const Roles = 
{
    VIEWER: 'viewer',
    USER: 'user',
    ADMIN: 'admin',
    OWNER: 'owner'
};
var userID = localStorage.getItem('userID');

document.addEventListener('DOMContentLoaded', function() 
{
    renderAllTeams(userID);
});

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
        // Show the Add People modal
        document.getElementById('addPeopleModal').style.display = 'block';
    };
    document.getElementById('closeAddPeopleModal').onclick = function() 
    {
        document.getElementById('addPeopleModal').style.display = 'none';
        resetAddPeopleModal();
    };    
    form.onsubmit = handleTeamCreation;
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
                addedPeople[username] = userRole;
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
    const addedPeopleList = document.getElementById('addedPeopleList'); // Make sure this element exists in your HTML
    addedPeopleList.innerHTML = ''; // Clear the current list
    // Iterate over the addedPeople object
    for (const [username, role] of Object.entries(addedPeople)) 
    {
        const personElement = document.createElement('div');
        personElement.textContent = `${username} - ${role}`;
        addedPeopleList.appendChild(personElement);
    }
}


function resetAddPeopleModal()
{
    document.getElementById('usernameToAdd').value = '';
    // Clear any previous error message
    document.getElementById('addPeopleError').textContent = '';
}

function handleTeamCreation(event) 
{
    event.preventDefault();
    // Collect form data
    var teamName = document.getElementById('teamName').value;
    var teamDescription = document.getElementById('teamDescription').value;
    var autoJoin = document.getElementById('autoJoin').value === 'true';
    var autoJoinPerms = document.getElementById('autoJoinPerms').value;
    // Close the modal upon submission
    var modal = document.getElementById('createTeamModal');
    var team;
    modal.style.display = 'none';
    // Assuming teamCreatorID is available in the scope
    sendRequest('/findUserName', { userID: userID })
    .then(response => 
    {
        if (response.result === 'OK') 
        {
            var teamCreatorName = response.username;
            addedPeople[teamCreatorName] = Roles.OWNER;
            team = 
            {
                _name: teamName,
                _description: teamDescription,
                _users: addedPeople,
                _autoJoin: autoJoin,
                _autoJoinPerms: autoJoinPerms
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
    if (joinCode.length === 9 && [...joinCode].every(char => characters.includes(char))) 
    {
        try 
        {
            const response = await sendRequest('/joinTeam', { userID: userID, joinCode: joinCode });
            // Handle different responses
            if (response.result === 'OK') 
            {
                alert('Successfully joined the team!');
                closeTeamJoinModal();
                renderAllTeams();
            } 
            else if (response.result === 'QUEUED') 
            {
                alert('You have been added to the queue.');
                closeTeamJoinModal();
            } 
            else 
            {
                alert('Failed to join the team.');
            }
        } 
        catch (error) 
        {
            console.error('Error:', error);
            alert('An error occurred while trying to join the team.');
        }
    } 
    else 
    {
        alert('Invalid team join code.');
    }
};

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

}

/**
 * Show a dropdown notification relating to any teams notifications
 * @returns {void} - but opens a dropdown notification menu
 */
function teamsNotifs()
{

}

function teamsSort()
{

}

//creates the html elements to display the team panel
function renderTeamPanel(team, teamCount)
{
    let container = document.createElement("div");
    container.classList.add("team-container");
    container.style.top = `${140 * teamCount}px`
    let teamName = document.createElement("div");
    teamName.classList.add("team-name");
    teamName.innerHTML = team._name;
    let description = document.createElement("div");
    description.classList.add("team-description");
    description.innerHTML = team._description;
    let userList = document.createElement("div");
    userList.classList.add("team-userList-container");
    // Iterate over the team._users object
    for (const [username, role] of Object.entries(team._users)) 
    {
        let userElement = document.createElement("div");
        userElement.classList.add("team-user");
        userElement.innerHTML = `${username} - ${role}`;
        userList.appendChild(userElement); // Append the user element to the user list container
    }
    let teamCode = document.createElement("div");
    teamCode.classList.add("team-code");
    teamCode.innerHTML = team._joinCode;

    // Append all created elements to the container
    container.appendChild(teamName);
    container.appendChild(description);
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
    //get list of all teams
    let teamList = await GetTeamList(userID);
    console.log(JSON.stringify(teamList));
    let teamCount = 0;
    
    teamList.teams.forEach(team => 
    {
        teamCount++;
        renderTeamPanel(team, teamCount);
    });
}

//resize so its centered
window.addEventListener("resize", function(event) 
{
    teamContainers = this.document.getElementsByClassName("team-container");
    console.log(teamContainers);
    if (teamContainers.length != 0)
    {
        teamContainers.forEach(container => 
        {
            //center element
            container.style.left = `${((this.window.innerWidth / 2) - (parseInt(container.offsetWidth) / 2))}px`;  
        });
    }
});

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