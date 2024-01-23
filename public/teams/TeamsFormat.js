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
    ADMIN: 'admin'
};


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
        resetAddPeople();
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
            if (response.result === 'OK' && response.userID != localStorage.getItem('userID')) 
            {
                addedPeople[username] = userRole;
                console.log("addedPeople: ", addedPeople);
                updateAddedPeopleList(); 
                // Close the modal and reset
                document.getElementById('addPeopleModal').style.display = 'none';
                resetAddPeople();   
            }
            else if (response.result === 'OK' && response.userID == localStorage.getItem('userID'))
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


function resetAddPeople()
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
    // Close the modal upon submission
    var modal = document.getElementById('createTeamModal');
    modal.style.display = 'none';
    var team = 
    {
        _name: teamName,
        _description: teamDescription,
        _users: addedPeople
    }
    addedPeople = [];
    return sendRequest('/createTeam', team)
    .then(response => 
    {
        if (response.result === 'OK') 
        {
            const createdTeam = new CalendarTeam(response.teamID, team._name, team._description, team._users, response.teamCode);
            console.log(team);
            console.log(response.teamID);
            console.log(response.teamCode);
            createTeamPanel(createdTeam);
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

/**
 * Start the process to join a team, with a modal to enter the team code
 * @returns {void} - but opens a modal to join a team
 */
function teamsJoinStart()
{

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

// #endregion Teams create and join functions

function createTeamPanel(team)
{
    let container = document.createElement("div");
    container.classList.add("team-container");
    let teamName = document.createElement("div");
    teamName.classList.add("team-name");
    teamName.innerHTML = team._name;
    let description = document.createElement("div");
    description.classList.add("team-description");
    description.innerHTML = team._description;
    let userList = document.createElement("div");
    userList.classList.add("team-userList-container");
    team._addedPeople.forEach(user => 
    {
        let userElement = document.createElement("div");
        userElement.classList.add("team-user");
        userElement.innerHTML = user;
    });
    let teamCode = document.createElement("div");
    teamCode.classList.add("team-code");
    teamCode.innerHTML = team._joinCode;
}