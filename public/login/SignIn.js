/*
Name: Kaelin Wang Hu and Jason Leech
Date: 11/21/2023
Last Edit: 12/6/2023
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

// Tests whether the username is valid (>3 characters, doesn't contain special characters except for underscore dash)
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

    // Validate username and password format
    if (!isValidUsername(username) || !isValidPassword(password, username)) 
    {
        updateStatus("Invalid username or password format.");
        return;
    }

    // Prepare and send login request
    sendRequest('/login', { _name: username, _password: password })
        .then(message => handleLoginResponse(message))
        .catch(error => console.error('Error:', error));
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
 * Handles the server response for the login request.
 * @param {Object} message - The server response message.
 */
function handleLoginResponse(message) 
{
    updateStatus(message.message);
    if (message.message === "OK") {
        localStorage.setItem('isLoggedIn', true);
        localStorage.setItem('userId', message.userId); // Assuming the server returns userId
        document.dispatchEvent(new CustomEvent('userLoggedIn'));
        window.location.href = '/calendar'; // Redirect to calendar page on successful login
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
    if (!isValidUsername(username) || !isValidPassword(password, username)) 
    {
        updateStatus("Invalid username or password format.");
        return;
    }
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
        console.log(response);
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


