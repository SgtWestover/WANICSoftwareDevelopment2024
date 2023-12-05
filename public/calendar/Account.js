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
    const password = prompt("Please enter your password to delete your account");



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