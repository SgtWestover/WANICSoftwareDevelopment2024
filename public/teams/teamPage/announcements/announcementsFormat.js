var userID = localStorage.getItem('userID');
var teamCode = localStorage.getItem('joinCode');
let userRole;
const roleLevels = 
{
    'Viewer': 1, 
    'User': 2,
    'Admin': 3,
    'Owner': 4
};


document.addEventListener('DOMContentLoaded', async function() 
{
    try
    {
        const response = await sendRequest('/getTeamWithJoinCode', { joinCode : teamCode })
        if (response.result === 'OK')
        {
            const userResponse = await sendRequest('/findUserName', { userID });
            if (userResponse.result === 'OK')
            {
                await renderAnnouncements();
                userRole = response.team._users[userResponse.username];
                if (roleLevels[userRole] >= roleLevels["Admin"])
                {
                    const header = document.querySelector('header');
                    const createAnnouncementButton = document.createElement('button');
                    createAnnouncementButton.innerText = 'Create Announcement';
                    createAnnouncementButton.onclick = function() 
                    {
                        openAnnouncementModal(userRole);
                    };
                    header.appendChild(createAnnouncementButton);
                }
            }
            else
            {
                console.log(response.message);
            }
        }
        else
        {
            console.log(response.message);
        }
    }
    catch (error)
    {
        console.log(error);
    }
});

function openAnnouncementModal(userRole) 
{
    window.onclick = function(event) 
    {
        if (event.target === document.getElementById('createAnnouncementModal')) 
        {
            closeAnnouncementModal();
        }
    }
    document.getElementById('createAnnouncementModal').style.display = 'block';
}

function closeAnnouncementModal() 
{
    resetAnnouncementModal();
    document.getElementById('createAnnouncementModal').style.display = 'none';
}

function resetAnnouncementModal() 
{
    document.getElementById('announcementName').value = '';
    document.getElementById('announcementDescription').value = '';
    // Reset the addedUsers div for the next use
    const addedUsersDiv = document.getElementById('addedUsers');
    if (addedUsersDiv) 
    {
        addedUsersDiv.innerHTML = '';
    }
}

document.getElementById('createAnnouncementForm').addEventListener('submit', async function(event) 
{
    event.preventDefault();
    const announcementName = document.getElementById('announcementName').value;
    const announcementDescription = document.getElementById('announcementDescription').value;
    const announcementPingsElement = document.getElementById('announcementPings');
    const announcementPings = Array.from(announcementPingsElement.selectedOptions).map(option => option.value);
    const announcementData = 
    {
        senderID: userID,
        name: announcementName,
        description: announcementDescription,
        pings: announcementPings,
        teamCode
    };
    try 
    {
        const response = await sendRequest('/createAnnouncement', announcementData);
        if (response.result === 'OK') 
        {
            alert('Announcement created successfully!');
            closeAnnouncementModal();
            await renderAnnouncements();
        } 
        else 
        {
            alert(`Failed to create announcement: ${response.message}`);
        }
    } 
    catch (error) 
    {
        console.error('Error creating announcement:', error);
        alert('An error occurred while creating the announcement.');
    }
});

async function renderAnnouncements() 
{
    try 
    {
        const response = await sendRequest('/getTeamAnnouncements', { teamCode, userID });
        if (response.result === 'OK') 
        {
            const teamAnnouncements = response.announcements;
            const pinnedAnnouncements = teamAnnouncements.filter(announcement => announcement._pinned === true);
            const unpinnedAnnouncements = teamAnnouncements.filter(announcement => announcement._pinned !== true);
            const pinnedContainer = document.getElementById('pinnedAnnouncements');
            const unpinnedContainer = document.getElementById('unpinnedAnnouncements');
            if (pinnedContainer) pinnedContainer.innerHTML = '';
            if (unpinnedContainer) unpinnedContainer.innerHTML = '';
            createAnnouncementDivs(pinnedAnnouncements, true, 'pinnedAnnouncements');
            createAnnouncementDivs(unpinnedAnnouncements, false, 'unpinnedAnnouncements');
        }
    } 
    catch (error) 
    {
        console.error('Error rendering announcements:', error);
    }
}

function createAnnouncementDivs(announcements, isPinned, containerId) 
{
    const container = document.getElementById(containerId);
    container.classList.add(isPinned ? 'pinned-announcements' : 'unpinned-announcements');
    announcements.forEach(announcement => 
    {
        let announcementContainer = document.createElement('div');
        announcementContainer.classList.add('announcement-container');
        announcementContainer.setAttribute('data-announcement-id', announcement._id);
        let nameElement = document.createElement('div');
        nameElement.classList.add('announcement-name');
        nameElement.textContent = announcement._name;
        announcementContainer.appendChild(nameElement);
        let descriptionElement = document.createElement('div');
        descriptionElement.classList.add('announcement-description');
        descriptionElement.textContent = announcement._description;
        announcementContainer.appendChild(descriptionElement);
        let pingsElement = document.createElement('div');
        pingsElement.classList.add('announcement-pings');
        pingsElement.textContent = `Pings: ${announcement._pings.join(', ')}`;
        announcementContainer.appendChild(pingsElement);
        let senderElement = document.createElement('div');
        senderElement.classList.add('announcement-sender');
        senderElement.textContent = `Sender: ${announcement._senderName}`;
        announcementContainer.appendChild(senderElement);
        let menuIcon = document.createElement('i');
        menuIcon.classList.add('fa', 'fa-ellipsis-h');
        menuIcon.addEventListener('click', async () => 
        {
            await showAnnouncementOptions(announcementContainer, announcement._id);
        });
        announcementContainer.appendChild(menuIcon);
        container.appendChild(announcementContainer);
    });
}

async function showAnnouncementOptions(announcementDiv, announcementId) 
{
    try
    {
        const response = await sendRequest('/checkAnnouncementEdit', { teamCode, userID, announcementID: announcementId });
        if (response.result === 'OK')
        {
            let existingMenu = document.querySelector('.announcement-options-menu');
            if (existingMenu) 
            {
                existingMenu.remove();
            }
            let optionsMenu = document.createElement('div');
            optionsMenu.classList.add('announcement-options-menu');
            announcementDiv.appendChild(optionsMenu);
            let dismissButton = document.createElement('button');
            dismissButton.innerText = 'Dismiss Announcement';
            dismissButton.onclick = function() { openDismissAnnouncementModal(announcementId); };
            optionsMenu.appendChild(dismissButton);
            if (response.canEdit)
            {
                let editButton = document.createElement('button');
                editButton.innerText = 'Edit Announcement';
                editButton.onclick = function() { openEditAnnouncementModal(announcementId); };
                optionsMenu.appendChild(editButton);
                let pinButton = document.createElement('button');
                pinButton.innerText = response.pinned ? 'Unpin Announcement' : 'Pin Announcement';
                pinButton.onclick = function() { openPinAnnouncementModal(announcementId, response.pinned); };
                optionsMenu.appendChild(pinButton);
                let deleteButton = document.createElement('button');
                deleteButton.innerText = 'Delete Announcement';
                deleteButton.onclick = function() { openDeleteAnnouncementModal(announcementId); };
                optionsMenu.appendChild(deleteButton);
            }
        }
        else
        {
            console.log("Failed to check announcement edit options: " + response.message);
        }
    }
    catch (error)
    {
        console.log("Error showing announcement options: " + error);
    }
}


function openDeleteAnnouncementModal(announcementID) 
{
    let modal = document.getElementById('deleteAnnouncementModal');
    modal.style.display = 'block';
    document.getElementById('closeDeleteAnnouncementModal').onclick = function() 
    {
        modal.style.display = 'none';
        document.getElementById('deleteAnnouncementError').textContent = '';
    };
    window.onclick = function(event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = 'none';
            document.getElementById('deleteAnnouncementError').textContent = '';
        }
    };
    document.getElementById('deleteAnnouncement').onclick = async function() 
    {
        try 
        {
            const response = await sendRequest('/deleteAnnouncement', { teamCode, announcementID, userID });
            if (response.result === 'OK') 
            {
                alert("Announcement deleted successfully.");
                modal.style.display = 'none';
                await renderAnnouncements();
            } 
            else 
            {
                document.getElementById('deleteAnnouncementError').textContent = response.message || "Failed to delete the announcement.";
            }
        } 
        catch (error) 
        {
            console.error('Error deleting announcement:', error);
            document.getElementById('deleteAnnouncementError').textContent = "An error occurred while trying to delete the announcement.";
        }
    };

    document.getElementById('cancelDeleteAnnouncement').onclick = function() 
    {
        modal.style.display = 'none';
        document.getElementById('deleteAnnouncementError').textContent = '';
    };
}

function openPinAnnouncementModal(announcementID, pinned) 
{
    let modal = document.getElementById('pinAnnouncementModal');
    let header = document.getElementById('pinModalHeader');
    let question = document.getElementById('pinModalQuestion');
    let actionButton = document.getElementById('pinAnnouncement');
    if (pinned) 
    {
        header.innerText = 'Unpin Announcement';
        question.innerText = 'Are you sure you want to unpin this announcement?';
        actionButton.innerText = 'Unpin';
    } 
    else 
    {
        header.innerText = 'Pin Announcement';
        question.innerText = 'Are you sure you want to pin this announcement?';
        actionButton.innerText = 'Pin';
    }
    console.log(header);
    console.log(question);
    modal.style.display = 'block';
    document.getElementById('closePinAnnouncementModal').onclick = function() 
    {
        modal.style.display = 'none';
        document.getElementById('pinAnnouncementError').textContent = '';
    };
    window.onclick = function(event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = 'none';
            document.getElementById('pinAnnouncementError').textContent = '';
        }
    };
    document.getElementById('pinAnnouncement').onclick = async function() 
    {
        try 
        {
            const response = await sendRequest('/pinAnnouncement', { teamCode, announcementID, userID });
            if (response.result === 'OK') 
            {
                alert(pinned ? "Announcement unpinned successfully." : "Announcement pinned successfully.");
                modal.style.display = 'none';
                await renderAnnouncements();
            } 
            else 
            {
                document.getElementById('pinAnnouncementError').textContent = response.message || "Failed to change the announcement's pinned status.";
            }
        } 
        catch (error) 
        {
            console.error('Error changing pinned status:', error);
            document.getElementById('pinAnnouncementError').textContent = "An error occurred while trying to change the announcement's pinned status.";
        }
    };
    document.getElementById('cancelPinAnnouncement').onclick = function() 
    {
        modal.style.display = 'none';
        document.getElementById('pinAnnouncementError').textContent = ''; // Clear any error messages
    };
}

async function openEditAnnouncementModal(announcementID) 
{
    try 
    {
        const response = await sendRequest('/getAnnouncement', { teamCode, announcementID });
        if (response.result === 'OK') 
        {
            document.getElementById('newAnnouncementName').value = response.announcement._name;
            document.getElementById('newAnnouncementDescription').value = response.announcement._description;
            let modal = document.getElementById('editAnnouncementModal');
            modal.style.display = 'block';
            document.getElementById('closeEditAnnouncementModal').onclick = function() 
            {
                modal.style.display = 'none';
                document.getElementById('editAnnouncementError').textContent = '';
            };
            window.onclick = function(event) 
            {
                if (event.target === modal) 
                {
                    modal.style.display = 'none';
                    document.getElementById('editAnnouncementError').textContent = '';
                }
            };
            document.getElementById('cancelEditAnnouncement').onclick = function() 
            {
                modal.style.display = 'none';
                document.getElementById('editAnnouncementError').textContent = ''; // Clear any error messages
            };
            document.getElementById('editAnnouncement').onclick = function() 
            {
                updateAnnouncement(announcementID);
            };
        }
        else 
        {
            console.log(response.message);
        }
    } 
    catch (error) 
    {
        console.error('Error fetching announcement details:', error);
    }
}

async function updateAnnouncement(announcementID) 
{
    const name = document.getElementById('newAnnouncementName').value;
    const description = document.getElementById('newAnnouncementDescription').value;
    try 
    {
        const response = await sendRequest('/updateAnnouncement', 
        {
            teamCode,
            announcementID: announcementID,
            name: name,
            description: description,
            userID
        });
        
        if (response.result === 'OK') 
        {
            alert('Announcement updated successfully!');
            closeEditAnnouncementModal();
            await renderAnnouncements();
        } 
        else 
        {
            document.getElementById('editAnnouncementError').textContent = response.message || "Failed to update the announcement.";
        }
    } 
    catch (error) 
    {
        console.error('Error updating announcement:', error);
        document.getElementById('editAnnouncementError').textContent = "An error occurred while trying to update the announcement.";
    }
}

function closeEditAnnouncementModal() 
{
    let modal = document.getElementById('editAnnouncementModal');
    modal.style.display = 'none';
    document.getElementById('editAnnouncementError').textContent = ''; // Clear any error messages
}

function openDismissAnnouncementModal(announcementId) 
{
    let modal = document.getElementById('dismissAnnouncementModal');
    modal.style.display = 'block';
    document.getElementById('closeDismissAnnouncementModal').onclick = function() 
    {
        modal.style.display = 'none';
        document.getElementById('dismissAnnouncementError').textContent = '';
    };
    window.onclick = function(event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = 'none';
            document.getElementById('dismissAnnouncementError').textContent = '';
        }
    };
    document.getElementById('dismissAnnouncement').onclick = async function() 
    {
        try 
        {
            const response = await sendRequest('/dismissAnnouncement', { announcementID: announcementId, userID });
            if (response.result === 'OK') 
            {
                alert("Announcement dismissed successfully.");
                modal.style.display = 'none';
                await renderAnnouncements();
            } 
            else 
            {
                document.getElementById('dismissAnnouncementError').textContent = response.message || "Failed to dismiss the announcement.";
            }
        } 
        catch (error) 
        {
            console.error('Error dismissing announcement:', error);
            document.getElementById('dismissAnnouncementError').textContent = "An error occurred while trying to dismiss the announcement.";
        }
    };
    document.getElementById('cancelDismissAnnouncement').onclick = function() 
    {
        modal.style.display = 'none';
        document.getElementById('dismissAnnouncementError').textContent = '';
    };
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