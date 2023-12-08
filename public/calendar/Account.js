// Function to handle logout
function logout() {
    fetch('/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/json'}
    })
    .then(response => response.json())
    .then(message => {
        if (message.result === 'OK') {
            // Clear any client-side storage or state that references the user
            localStorage.removeItem('userId');
            window.location.href = "/login";
        } else {
            console.error('Logout failed:', message);
        }
    })
    .catch(error => console.error('Error:', error));
}

// Function to initiate account deletion process
function deleteAccount() 
{
    showModal();
}

// Function to show modal for password confirmation
async function showModal() 
{
    var modal = document.getElementById("passwordModal");
    var span = document.getElementsByClassName("close")[0];
    var passwordError = document.getElementById("passwordError"); // Element to display error message

    // Show the modal
    modal.style.display = "block";
    passwordError.textContent = ''; // Clear any previous error messages

    // Close the modal when the 'x' is clicked
    span.onclick = function () 
    {
        modal.style.display = "none";
        passwordError.textContent = ''; // Clear error message when modal is closed
    };

    // Close the modal if clicked outside of it
    window.onclick = function (event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = "none";
            passwordError.textContent = ''; // Clear error message when modal is closed
        }
    };

    // Handling the password submission
    document.getElementById("submitPassword").onclick = async function () 
    {
        const password = document.getElementById("passwordInput").value;
        passwordError.textContent = ''; // Clear error message before validation
        const isValid = await validatePassword(password);
        console.log("input validated");
        if (isValid) 
        {
            modal.style.display = "none";
            confirmPassword(); // Proceed to confirmation if the password is correct
        } 
        else 
        {
            passwordError.textContent = "Your password is incorrect"; // Display error message if password is wrong
        }
    };
}

var pass;

// Modified function to validate password
async function validatePassword(password) {
    pass = password;
    let isValid = false;

    try {
        let response = await fetch('/checkpassword', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({password: password})
        });

        // Assuming the response is always 200 OK, but the message varies
        let message = await response.json();
        if (message.result === 'OK') {
            isValid = message.message === "OK";
        } 
        else {
            console.log("something went wrong");
        }
    } catch (error) 
    {
        console.error('Error:', error);
    }
    return isValid;
}


// Function to show confirmation modal for account deletion
function confirmPassword() 
{
    showModalConfirmation();
    document.getElementById("confirmDelete").onclick = function () 
    {
        closeModalConfirmation();
        deleteAccountConfirmed(pass);
    };
    document.getElementById("cancelDelete").onclick = function () 
    {
        closeModalConfirmation();
    };
}

// Function to display the custom confirmation modal
function showModalConfirmation() 
{
    var modal = document.getElementById("confirmationModal");
    modal.style.display = "block";

    var span = modal.getElementsByClassName("close")[0];
    span.onclick = function () {
        modal.style.display = "none";
    };

    window.onclick = function (event) {
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
    const userId = localStorage.getItem('userId');
    fetch('/deleteaccount', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId, password })
    })
    .then(response => response.json())
    .then(message => {
        if (message.result === 'OK') {
            localStorage.removeItem('userId');
            window.location.href = "/login";
        } else {
            alert("Failed to delete account");
        }
    })
    .catch(error => console.error('Error:', error));
}
// Function to toggle password visibility
document.getElementById("togglePassword").addEventListener('click', function (e) {
    var passwordInput = document.getElementById("passwordInput");
    var type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash');
});
