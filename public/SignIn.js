/*
Name: Kaelin Wang Hu
Date: 11/21/2023
Last Edit: 11/22/2023
Desc: Handles log-ins
*/
let users = JSON.parse(localStorage.getItem('users')) || {}; //stored locally (unsafe) but saves throughout pages and the browser

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

    //null checks to avoid null errors where the script cannot get the fields
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
    const usernameRegex = /^[A-Za-z0-9_@.-]{4,}$/; //wizardry
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
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!-\/:-@\[-\`{-~]).{8,}$/;
    return passwordRegex.test(password);
}

//sign in function
function signIn()
{
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    console.log("login " + username + " " + password)
    var data = new FormData();
    var json = JSON.stringify({username: username, password: password});
    let response = fetch('/login', { method: 'POST', credentials: 'same-origin', headers:{
            'Content-Type': 'application/json'
        }, body: json})
    response.then(function (response) {
        return response.ok
            ? response.json().then((data))
            : Promise.reject(new Error('Unexpected response'));
    }).then(function (message) {
        console.log(message);

        if (message.message == "ANF")
        {
            document.getElementById("status").textContent = "Account does not exist";
            console.log("account not found");
        } else if (message.message == "WP")
        {
            console.log("wrong password");
            document.getElementById("status").textContent = "Password is incorrect";
        }
        else if (message.message == "OK")
        {
            window.location.href = '/calendar.html';
        }
    })
    /*users = JSON.parse(localStorage.getItem('users')) || {};
    if (users[username])
    {
        //if successful, go to calendar.html, where the actual calendar is
        if (users[username] === password)
        {
            clearFields(); //clear fields for security
            window.location.href = 'calendar.html';
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
    }*/
}

//sign up function
function signUp()
{
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    console.log("login " + username + " " + password)
    var data = new FormData();
    var json = JSON.stringify({username: username, password: password});
    let response = fetch('/signup', { method: 'POST', credentials: 'same-origin', headers:{
            'Content-Type': 'application/json'
        }, body: json})
    response.then(function (response) {
        return response.ok
            ? response.json().then((data))
            : Promise.reject(new Error('Unexpected response'));
    }).then(function (message) {
        console.log(message);
    })
return;

    users = JSON.parse(localStorage.getItem('users')) || {}; //get the saved list from local storage
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
    window.location.href = 'index.html';
}
document.addEventListener('DOMContentLoaded', function()
{
    // Check if authForm exists before attaching event listener
    let authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', function(event)
        {
            //forces you to fill in the fields
            event.preventDefault();
            const username = document.getElementById('username').value.trim(); //trims to avoid whitespaces afterwards
            const password = document.getElementById('password').value;
            const action = document.getElementById('action').value; //specified action of whether to sign in or up.

            if (!username || !password) //safety check
            {
                alert("Please enter both username and password!");
                return;
            }
            //signs in or signs up based on the action of the button clicked
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
        logoutButton.addEventListener('click', logout); //on click to the logout button (if it exists), log out
    }
});