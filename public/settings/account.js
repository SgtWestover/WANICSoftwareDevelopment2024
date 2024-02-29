/*
Name: Kaelin Wang Hu and Jason Leech
Date: 11/29/2023
Last Edit: 1/7/2023
Description: Handles account settings and deletion
*/

//FUNCTION HEADER TEMPLATE
/**
 * Description
 * @param   {type} name - parameter description
 * @returns {type}
 */

var pass; //Global variable set to entered password

//#region Signout functions

/**
 * Handles signout with a server call
 * @returns {void}
 */
function signout() 
{
    //calls signout on the server
    fetch('/signout', 
    {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/json'}
    })
    .then(response => response.json())
    .then(message => 
    {
        if (message.result === 'OK') 
        {
            localStorage.removeItem('userID');
            localStorage.setItem('isSignedIn', false);
            // Clear any client-side storage or state that references the user
            window.location.href = "/login";
        } 
        else 
        {
            console.error('Logout failed:', message);
        }
    })
    .catch(error => console.error('Error:', error));
}

//#endregion Signout functions

//#region Account deletion functions

/**
 * Function to initiate account deletion process by showing the modal
 * @returns {void}
 */
async function deleteAccount() 
{
    var modal = document.getElementById("passwordModal");
    var span = document.getElementsByClassName("close")[0]; //ex
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

    // Handles the password submission
    document.getElementById("submitPassword").onclick = async function () 
    {
        const password = document.getElementById("passwordInput").value;
        passwordError.textContent = ''; // Clear error message before validation
        const isValid = await validatePassword(password);
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

/**
 * Validates password with a serve call
 * @param   {string} password - the password to validate
 * @returns {bool}
 */
async function validatePassword(password) 
{
    pass = password;
    let isValid = false;
    try 
    {
        //Checks the password
        let response = await fetch('/checkpassword', 
        {
            method: 'POST',
            credentials: 'same-origin',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({_password: password})
        });

        // Assuming the response is always 200 OK
        let message = await response.json();
        if (message.result === 'OK') 
        {
            isValid = message.message === "CorrectPassword";
        } 
        else
        {
            console.log("Server Error");
        }
    } 
    catch (error) 
    {
        console.error('Error:', error);
    }
    return isValid;
}

/**
 * Handles the actual account deletion process once deletion is confirmed
 * @param   {string} password - the password to validate (again as a failsafe)
 * @returns {void}
 */
function deleteAccountConfirmed(password) 
{
    const userID = localStorage.getItem('userID'); //gets the user ID to send to server for deletion through /deleteaccount
    fetch('/deleteaccount', 
    {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userID, password })
    })
    .then(response => response.json())
    .then(message => 
    {
        if (message.result === 'OK') 
        {
            localStorage.removeItem('userID'); //removes the userID and redirects back to the login
            window.location.href = "/login";
        } 
        else 
        {
            alert("Failed to delete account");
        }
    })
    .catch(error => console.error('Error:', error));
}

//#endregion Account deletion functions

//#region Account deletion and modal helpers

/**
 * Toggles password (eye) icon visibility
 * @returns {void}
 */
document.getElementById("togglePassword").addEventListener('click', function () 
{
    var passwordInput = document.getElementById("passwordInput");
    var type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password'; //switch between text and password
    passwordInput.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash'); //toggle the icon
});


/**
 * Shows confirmation modal for account deletion
 * @returns {void}
 */
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

/**
 * Displays the custom confirmation modal
 * @returns {void}
 */
function showModalConfirmation() 
{
    var modal = document.getElementById("confirmationModal");
    modal.style.display = "block";

    //if clicked on the close or clicked outside, close the modal
    var span = modal.getElementsByClassName("close")[0];
    span.onclick = function () 
    {
        modal.style.display = "none";
    };
    window.onclick = function (event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = "none";
        }
    };
}

/**
 * Close the custom confirmation modal
 * @returns {void}
 */
function closeModalConfirmation() 
{
    var modal = document.getElementById("confirmationModal");
    modal.style.display = "none";
}

/**
 * Sends an HTTP POST request to the specified endpoint with the provided data.
 * @param {string} endpoint - The endpoint to send the request to.
 * @param {Object} data - The data to send in the request.
 * @returns {Promise<Object>} The response from the server.
 */
async function sendRequest(endpoint, data) 
{
    const response = await fetch(endpoint,
        {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    if (!response.ok) 
    {
        throw new Error('Network response was not ok');
    }
    return await response.json();
}

//#endregion Account deletion and modal helpers