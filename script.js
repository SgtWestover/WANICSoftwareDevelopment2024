// script.js
let users = {};

function clearFields() {
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function signIn(username, password) {
    if (users[username]) {
        if (users[username] === password) {
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

function signUp(username, password) {
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
