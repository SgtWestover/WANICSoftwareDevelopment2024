/*
Name: Kaelin Wang Hu and Jason Leech
Date: 11/21/2023
Last Edit: 1/6/2023
Desc: Handles log-ins
*/


// Clears the password field
function clearPassword()
{
    document.getElementById('password').value = '';
}

// Clears both fields
function clearFields()
{
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Tests whether the username is valid (between 4 and 16 characters, doesn't contain spaces special characters except for underscore and dash)
function isValidUsername(username)
{
    const usernameRegex = /^[A-Za-z\d_-]{4,16}$/; // Regex for username validation
    return usernameRegex.test(username);
}

// Tests whether the password is valid
function isValidPassword(password, username)
{
    if (password.toLowerCase() === username.toLowerCase())
    {
        return false;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ -\/:-@\[-`\{-~])[A-Za-z\d -\/:-@\[-`\{-~]{8,32}$/;
    return passwordRegex.test(password);
}

/**
 * Attempts to sign in a user with provided credentials.
 * Validates username and password, and sends a request to the server.
 */
function signIn() 
{
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    if (checkFields(username, password) === false) return;
    // Prepare and send signin request
    sendRequest('/signin', { _name: username, _password: password })
        .then(message => handleSigninResponse(message))
        .catch(error => console.error('Error:', error));
}

function checkFields(username, password)
{
    if (username === '' || password === '') // If either field is empty, do nothing
    {
        updateStatus("Please enter a username and password.");
        return false;
    }
    if (!isValidUsername(username))
    {
        updateStatus("Invalid username format. Please enter a username between 4 and 16 characters long containing only letters, numbers, underscores, and dashes.");
        return false;
    }
    else if (!isValidPassword(password, username))
    {
        updateStatus("Invalid password format. Please enter a password 8 and 32 characters, containing at least one lowercase letter, one uppercase letter, one digit, and one special ASCII character.");
        return false;
    }
    return true;
}

/**
 * Updates the status message on the page.
 * @param {string} message - The message to display.
 */
function updateStatus(message) 
{
    document.getElementById("status").textContent = message;
}

/**
 * Handles the server response for the sign request.
 * @param {Object} message - The server response message.
 */
function handleSigninResponse(message) 
{
    updateStatus(message.message);
    if (message.message === "Sign In Successful") 
    {
        console.log("successfully signed in");
        localStorage.setItem('isSignedIn', true);
        localStorage.setItem('userID', message.userID);
        document.dispatchEvent(new CustomEvent('userLoggedIn'));
        window.location.href = '/calendar'; // Redirect to calendar page on successful signin
    }
}

/**
 * Attempts to sign up a new user with provided credentials.
 * Validates username and password, and sends a request to the server.
 */
function signUp() 
{
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    // Validate username and password format
    if (checkFields(username, password) === false) return;
    // Create new user object and send sign-up request
    let newUser = new User(username, password);
    console.log(newUser);
    sendRequest('/signup', newUser)
        .then(message => updateStatus(message.message))
        .catch(error => console.error('Error:', error));
}

/**
 * Sends an HTTP POST request to the specified endpoint with the provided data.
 * @param {string} endpoint - The endpoint to send the request to.
 * @param {Object} data - The data to send in the request.
 * @returns {Promise<Object>} The response from the server.
 */
function sendRequest(endpoint, data) 
{
    return fetch(endpoint, 
    {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => 
    {
        if (!response.ok) 
        {
            throw new Error('Network response was not ok');
        }
        return response.json();  // Assuming the response is always JSON.
    });
}

// Event listener for the authentication form
document.addEventListener('DOMContentLoaded', function()
{
    let logoutButton = document.getElementById('logout');
    if (logoutButton)
    {
        logoutButton.addEventListener('click', logout); //on click to the logout button (if it exists), log out
    }
});