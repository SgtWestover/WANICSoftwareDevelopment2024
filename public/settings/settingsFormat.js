function invitePeopleStart() 
{
    let modal = document.getElementById('changeNameModal');
    modal.style.display = 'block';
    document.getElementById('closeAddPeopleModal').onclick = function()
    {
        document.getElementById('changeName').value = '';
        modal.style.display = 'none';
    }
    window.onclick = function(event) 
    {
        if (event.target === modal) 
        {
            document.getElementById('changeName').value = '';
            modal.style.display = 'none';
        }
    }
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