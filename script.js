// script.js
let users = {};

function signIn(username, password) {
    if (users[username] && users[username] === password) 
    {
        alert("Sign in successful!");
    } else {
        alert("Invalid username or password!");
    }
}

function signUp(username, password) {
    if (users[username]) {
        alert("Username already exists!");
    } else {
        users[username] = password;
        alert("Sign up successful!");
    }
}

document.getElementById('authForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    signIn(username, password);
});
