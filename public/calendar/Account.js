function logout()
{
    let response = fetch('/logout', { method: 'POST', credentials: 'same-origin', headers:{'Content-Type': 'application/json'}})
    response.then(function (response) {
        return response.ok
            ? response.json().then()
            : Promise.reject(new Error('Unexpected response'));
    }).then(function (message) {
        window.location.href = "/login"
    })
}

function deleteAccount() 
{
    showModal();
}

function showModal() 
{
    var modal = document.getElementById("passwordModal");
    var span = document.getElementsByClassName("close")[0];

    modal.style.display = "block";

    span.onclick = function() 
    {
        modal.style.display = "none";
    }

    window.onclick = function(event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = "none";
        }
    }

    document.getElementById("submitPassword").onclick = function() 
    {
        const password = document.getElementById("passwordInput").value;
        modal.style.display = "none";
        confirmPassword(password);
    }
}

function confirmPassword(password) 
{
    if (window.confirm("Are you sure you want to delete your account?"))
    {
        let response = fetch('/deleteaccount', { method: 'POST', credentials: 'same-origin', headers:{'Content-Type': 'application/json'}, body: JSON.stringify({password: password})})
        response.then(function (response) {
            return response.ok
                ? response.json().then()
                : Promise.reject(new Error('Unexpected response'));
        }).then(function (message) {
            if (message.message == "OK")
            {
                window.location.href = "/login"
            }
            else
            {
                alert("your password is wrong")
            }
        })
    }
}

// Toggle Password Visibility
document.getElementById("togglePassword").addEventListener('click', function (e) 
{
    var passwordInput = document.getElementById("passwordInput");
    var type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash');
});