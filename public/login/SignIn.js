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
 * Updates the status message on the page with appropriate color based on result.
 * @param {string} message - The message to display.
 * @param {string} result - The result of the operation ('OK' or 'FAIL').
 */
function updateStatus(message, result) 
{
    const statusElement = document.getElementById("status");
    statusElement.textContent = message;
    if (result === 'OK') 
    {
        statusElement.style.color = 'green';
    } 
    else 
    {
        statusElement.style.color = 'red';
    }
}

/**
 * Handles the server response for the sign-in request.
 * @param {Object} message - The server response message.
 */
function handleSigninResponse(message) 
{
    // Use the message.result to determine the color of the status message
    updateStatus(message.message, message.result);
    if (message.result === "OK") 
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
    if (checkFields(username, password) === false) return;
    let newUser = { _name: username, _password: password };
    console.log(newUser);
    sendRequest('/signup', newUser)
        .then(message => {
            // Use the message.result to determine the color of the status message
            updateStatus(message.message, message.result);
        })
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
    var togglePassword = document.getElementById("togglePassword");
    var passwordInput = document.getElementById("password");
    
    togglePassword.addEventListener('click', function (e) {
        // Toggle the type attribute
        var type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        // Toggle the icon
        this.classList.toggle('fa-eye-slash');
        this.classList.toggle('fa-eye');
    });
});
