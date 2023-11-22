// script.js
let users = {};

function clearFields() {
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}


function isValidUsername(username) {
    const usernameRegex = /^[A-Za-z0-9_-]{4,}$/;
    return usernameRegex.test(username);
}

function isValidPassword(password) {
    // Regex to check for at least 8 characters, 1 uppercase, 1 number, and 1 special character
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}


function signIn(username, password) {
    if (users[username]) {
        if (users[username] === password) 
        {
            clearFields();
            window.location.href = 'index.html';
        } else {
            alert("Incorrect password!");
            clearFields(); // Clear fields if password is incorrect
        }
    } else {
        alert("Username does not exist!");
        clearFields(); // Clear fields if username does not exist
    }
}

function signUp(username, password) 
{
    if (!isValidUsername(username)) {
        alert("Username must be at least 4 characters long and can only contain letters, numbers, underscores, and dashes.");
        return;
    }
    if (!isValidPassword(password)) {
        alert("Password must be at least 8 characters long and include at least one uppercase letter, one number, and one special character.");
        return;
    }
    if (users[username]) {
        alert("Username already exists!");
    } else {
        users[username] = password;
        alert("Sign up successful!");
        clearFields(); // Clear fields after successful sign-up
    }
}

document.getElementById('authForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert("Please enter both username and password!");
        return;
    }

    signIn(username, password);
});

function handleSignUp() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert("Please enter both username and password for sign up!");
        return;
    }

    signUp(username, password);
}