/*
Name: Kaelin Wang Hu and Jason Leech
Date: 11/21/2023
Last Edit: 12/6/2023
Desc: Handles log-ins
*/

// Sets the action, whether sign up or sign in, based on which button is clicked
function setAction(action)
{
    document.getElementById('action').value = action;
}

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
    const usernameRegex = /^[A-Za-z\d_-]{4,}$/; // Regex for username validation
    return usernameRegex.test(username);
}

// Tests whether the password is valid
function isValidPassword(password, username)
{
    if (password.toLowerCase() === username.toLowerCase())
    {
        return false;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ -\/:-@\[-`\{-~])[A-Za-z\d -\/:-@\[-`\{-~]{8,}$/;
    return passwordRegex.test(password);
}

// Sign in function
function signIn() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    if (!isValidUsername(username) || !isValidPassword(password, username))
    {
        document.getElementById("status").textContent = "Invalid username or password format.";
        return;
    }

    let json = JSON.stringify({ username: username, password: password });
    fetch('/login',
    {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: json
    })
    .then(response => response.json())
    .then(message =>
        {
        document.getElementById("status").textContent = message.message;
        if (message.message === "OK")
        {
            window.location.href = '/calendar'; // Redirect to calendar page on successful login
        }
    })
    .catch(error => console.error('Error:', error));
}

function pull()
{
    fetch('/pull', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }
    })
}

function restart()
{
    fetch('/restart', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }
    })
}

// Sign up function
function signUp()
{
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    if (!isValidUsername(username) || !isValidPassword(password, username))
    {
        document.getElementById("status").textContent = "Invalid username or password format.";
        return;
    }

    let json = JSON.stringify({ username: username, password: password });
    fetch('/signup', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: json
    })
    .then(response => response.json())
    .then(message => {
        document.getElementById("status").textContent = message.message;
    })
    .catch(error => console.error('Error:', error));
}

// Event listener for the authentication form
document.addEventListener('DOMContentLoaded', function()
{
    /*let authForm = document.getElementById('authForm');
    if (authForm)
    {
        authForm.addEventListener('submit', function(event)
        {
            event.preventDefault();
            const action = document.getElementById('action').value;

            if (action === 'signIn')
            {
                signIn();
            } else if (action === 'signUp')
            {
                signUp();
            }
        });
    }*/
    let logoutButton = document.getElementById('logout');
    if (logoutButton)
    {
        logoutButton.addEventListener('click', logout); //on click to the logout button (if it exists), log out
    }
});


