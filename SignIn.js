// script.js
let users = JSON.parse(localStorage.getItem('users')) || {};

window.addEventListener('load', clearFields); //clear fields on load or reload


//sets the action, whether sign up or sign in, based on which button is clicked
function setAction(action) 
{
    document.getElementById('action').value = action;
}


//clears the password field
function clearPassword()
{
    document.getElementById('password').value = '';
}

//clears both fields
function clearFields() 
{
    let usernameField = document.getElementById('username');
    let passwordField = document.getElementById('password');
    
    if (usernameField) 
    {
        usernameField.value = '';
    }
    if (passwordField) 
    {
        passwordField.value = '';
    }
}
//tests whether the username is valid (>3 characters, doesn't contain special characters except for underscore dash)
function isValidUsername(username) 
{
    const usernameRegex = /^[A-Za-z0-9_@.-]{4,}$/;
    return usernameRegex.test(username);
}

//tests whether the password is valid
function isValidPassword(password, username) 
{
    if (password.toLowerCase() === username.toLowerCase()) //failsafe in case future standards change
    {
        return false;
    }
    // Regex to check for at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

//sign in function
function signIn(username, password) 
{
    users = JSON.parse(localStorage.getItem('users')) || {};
    if (users[username]) 
    {
        //if successful, go to index.html
        if (users[username] === password)
        {
            clearFields();
            window.location.href = 'index.html';
        }
        //otherwise, if incorrect, alert and clear
        else 
        {
            alert("Incorrect password!");
            clearPassword(); // Clear fields if password is incorrect
        }
    }
    //if username does not exist, clear both fields
    else 
    {
        alert("Username does not exist!");
        clearFields(); // Clear fields if username does not exist
    }
}

//sign up function
function signUp(username, password) 
{
    users = JSON.parse(localStorage.getItem('users')) || {};
    //if username is not valid, alert
    if (!isValidUsername(username)) 
    {
        alert("Username must be at least 4 characters long and can only contain letters, numbers, underscores, and dashes.");
        return;
    }
    //if password is not valid, alert
    if (!isValidPassword(password, username)) 
    {
        alert("Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character. It cannot match your username");
        return;
    }
    //if the username is already occupied, alert
    if (users[username]) 
    {
        alert("Username already exists!");
    }
    //otherwise, sign up successfully
    else 
    {
        users[username] = password;
        localStorage.setItem('users', JSON.stringify(users));
        alert("Sign up successful!");
        clearFields(); // Clear fields after successful sign-up
    }
}

function logout() 
{
    // Redirect to the login/signup page
    window.location.href = 'test.html';
}
document.addEventListener('DOMContentLoaded', function() 
{
    // Check if authForm exists before attaching event listener
    let authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', function(event) 
        {
            event.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const action = document.getElementById('action').value;

            if (!username || !password) 
            {
                alert("Please enter both username and password!");
                return;
            }

            if (action === 'signIn') 
            {
                signIn(username, password);
            } 
            else if (action === 'signUp') 
            {
                signUp(username, password);
            }
        });
    }

    // Attach the event listener to the logout button, if it exists
    let logoutButton = document.getElementById('logout');
    if (logoutButton) 
    {
        logoutButton.addEventListener('click', logout);
    }
});
