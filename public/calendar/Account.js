// Function to handle logout
function logout() {
    let response = fetch('/logout', {
        method: 'POST', 
        credentials: 'same-origin', 
        headers: {'Content-Type': 'application/json'}
    });
    response.then(function (response) {
        return response.ok
            ? response.json().then()
            : Promise.reject(new Error('Unexpected response'));
    }).then(function (message) {
        window.location.href = "/login";
    });
}

// Function to initiate account deletion process
function deleteAccount() {
    showModal();
}

// Function to show modal for password confirmation
function showModal() {
    var modal = document.getElementById("passwordModal");
    var span = document.getElementsByClassName("close")[0];

    modal.style.display = "block";

    span.onclick = function() {
        modal.style.display = "none";
    };

    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };

    document.getElementById("submitPassword").onclick = function() {
        const password = document.getElementById("passwordInput").value;
        modal.style.display = "none";
        confirmPassword(password);
    };
}

// Function to show confirmation modal for account deletion
function confirmPassword(password) {
    showModalConfirmation();
    document.getElementById("confirmDelete").onclick = function() {
        closeModalConfirmation();
        deleteAccountConfirmed(password);
    };
    document.getElementById("cancelDelete").onclick = function() {
        closeModalConfirmation();
    };
}

// Function to display the custom confirmation modal
function showModalConfirmation() {
    var modal = document.getElementById("confirmationModal");
    modal.style.display = "block";

    var span = modal.getElementsByClassName("close")[0];
    span.onclick = function() {
        modal.style.display = "none";
    };

    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };
}

// Function to close the custom confirmation modal
function closeModalConfirmation() {
    var modal = document.getElementById("confirmationModal");
    modal.style.display = "none";
}

// Function handling the actual account deletion process
function deleteAccountConfirmed(password) {
    let response = fetch('/deleteaccount', {
        method: 'POST', 
        credentials: 'same-origin', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({password: password})
    });
    response.then(function (response) {
        return response.ok
            ? response.json().then()
            : Promise.reject(new Error('Unexpected response'));
    }).then(function (message) {
        if (message.message == "OK") {
            window.location.href = "/login";
        } else {
            alert("Your password is wrong");
        }
    });
}

// Function to toggle password visibility
document.getElementById("togglePassword").addEventListener('click', function (e) {
    var passwordInput = document.getElementById("passwordInput");
    var type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash');
});
