var userID = localStorage.getItem('userID');

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
        const response = await sendRequest('/getAllUserEvents', { userID });
        if (response.result === 'OK')
        {
            generateUserSchedule(response.allUserEvents, response.importantEvents);
        }
        else if (response.result === 'FAIL')
        {
            console.log(error);
        }
    }
    catch (error)
    {
        console.log(error);
    }
});

function generateUserSchedule(allUserEvents, importantEventIDs) 
{
    const scheduleEventsContainer = document.getElementById('scheduleEventsContainer');
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const categorizedEvents = 
    {
        today: [],
        tomorrow: [],
        nextWeek: [],
        later: []
    };
    allUserEvents.forEach(event => 
    {
        const eventDate = new Date(event._startDate);
        if (eventDate.toDateString() === now.toDateString()) 
        {
            categorizedEvents.today.push(event);
        } 
        else if (eventDate.toDateString() === tomorrow.toDateString()) 
        {
            categorizedEvents.tomorrow.push(event);
        } 
        else if (eventDate > now && eventDate < nextWeek) 
        {
            categorizedEvents.nextWeek.push(event);
        } 
        else if (eventDate >= nextWeek) 
        {
            categorizedEvents.later.push(event);
        }
    });

    function createEventCategoryContainer(categoryName, events) 
    {
        if (events.length > 0) 
        {
            const container = document.createElement('div');
            container.classList.add('event-category-container');
            const header = document.createElement('h2');
            header.textContent = categoryName;
            container.appendChild(header);
            events.forEach(event => 
            {
                const eventElement = document.createElement('div');
                eventElement.classList.add('event');
                eventElement.setAttribute('data-event-id', event._id);
                container.appendChild(eventElement);
                //Name div
                const nameElement = document.createElement('div');
                nameElement.innerHTML = event._name;
                nameElement.classList.add('event-name');
                eventElement.appendChild(nameElement);
                //Description div
                const descriptionElement = document.createElement('div');
                descriptionElement.innerHTML = event._description;
                descriptionElement.classList.add('event-description');
                eventElement.appendChild(descriptionElement);
                const menuContainer = document.createElement('div');
                menuContainer.classList.add('event-menu');
                const menuIcon = document.createElement('span');
                menuIcon.innerHTML = '...';
                menuContainer.appendChild(menuIcon);
                eventElement.appendChild(menuContainer);
                menuIcon.addEventListener('click', function(e) 
                {
                    e.stopPropagation();
                    showEventMenu(eventElement, event._id, importantEventIDs); 
                });
                //Users div TODO Make it render all users
                const usersElementContainer = document.createElement('div');
                usersElementContainer.innerHTML = "Users:";
                event._users.forEach(user => 
                {
                    let userElement = document.createElement('div');
                    sendRequest('/findUserName', { userID : user})
                    .then(response => 
                    {
                        if (response.result === "OK")
                        {
                            userElement.innerHTML = response.username;
                        }
                    })
                    .catch(error =>
                    {
                        console.error("Error when finding user: ", error);
                    })
                    usersElementContainer.append(userElement);
                });
                usersElementContainer.classList.add('event-users-container');
                eventElement.appendChild(usersElementContainer);
                
                //Team Name div
                if(event._team)
                {
                    let teamName;
                    sendRequest('/getTeamWithJoinCode', { joinCode : event._team})
                    .then(response => 
                    {
                        if (response.result === "OK")
                        {
                            
                            teamName = response.team._name;
                            const teamNameElement = document.createElement('div');
                            teamNameElement.classList.add('event-teamName');
                            teamNameElement.innerHTML = teamName;
                            eventElement.appendChild(teamNameElement);
                        }
                    })
                    .catch(error =>
                    {
                        console.error("screw you there's no way this can activate: ", error);
                    })
                }

                //Start time div
                const startTimeElement = document.createElement('div');
                startTimeElement.innerHTML = "Start Time: ".bold() + new Date(event._startDate).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
                startTimeElement.classList.add('event-startTime');
                eventElement.appendChild(startTimeElement);
                //End time div
                const endTimeElement = document.createElement('div');
                endTimeElement.innerHTML = "End Time: ".bold() + new Date(event._endDate).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
                endTimeElement.classList.add('event-endTime');
                eventElement.appendChild(endTimeElement);
            });
            scheduleEventsContainer.appendChild(container);
        }
    }
    const importantEvents = allUserEvents.filter(event => importantEventIDs.includes(event._id));
    createEventCategoryContainer('IMPORTANT', importantEvents);
    createEventCategoryContainer('TODAY', categorizedEvents.today);
    createEventCategoryContainer('TOMORROW', categorizedEvents.tomorrow);
    createEventCategoryContainer('NEXT WEEK', categorizedEvents.nextWeek);
    createEventCategoryContainer('LATER', categorizedEvents.later);
}

function showEventMenu(eventElement, eventID, importantEventIDs) 
{
    let existingMenu = document.querySelector('.event-options-menu');
    if (existingMenu) 
    {
        existingMenu.parentNode.removeChild(existingMenu);
    }
    const menu = document.createElement('div');
    menu.classList.add('event-options-menu');
    const deleteOption = document.createElement('div');
    deleteOption.textContent = 'Delete Event';
    deleteOption.addEventListener('click', function() 
    {
        deleteEvent(eventElement, eventID);
    });
    const editOption = document.createElement('div');
    editOption.textContent = 'Go To Calendar';
    editOption.addEventListener('click', function() 
    {
        const isTeamEvent = eventElement.querySelector('.event-teamName') !== null;
        showNavigationConfirmModal(eventElement, isTeamEvent, eventID);
    });

    const importantOption = document.createElement('div');
    const isImportant = importantEventIDs.includes(eventID);
    importantOption.textContent = isImportant ? 'Unmark as Important' : 'Mark as Important';
    importantOption.addEventListener('click', function() 
    {
        markEventImportance(eventElement, eventID, isImportant);
    });
    // Append options to menu and menu to eventElement
    [deleteOption, editOption, importantOption].forEach(option => menu.appendChild(option));
    eventElement.appendChild(menu);
}

function deleteEvent(eventElement, eventID) 
{
    console.log(document.getElementById('eventNameToDelete'));
    document.getElementById('eventNameToDelete').textContent = eventElement.childNodes[0].innerHTML;
    const modal = document.getElementById('deleteEventModal');
    modal.style.display = 'block';
    document.getElementById('closeDeleteEventModal').onclick = function() 
    {
        modal.style.display = 'none';
        document.getElementById('deleteEventError').textContent = '';
    };
    document.getElementById('cancelDeleteEvent').onclick = function() 
    {
        modal.style.display = 'none';
        document.getElementById('deleteEventError').textContent = '';
    };
    document.getElementById('confirmDeleteEvent').onclick = async function() 
    {
        try
        {
            const response = await sendRequest('/deleteEventAll', { eventID })
            {
                if (response.result === 'OK')
                {
                    alert("Event deletion successful");
                    modal.style.display = 'none';
                    document.getElementById('deleteEventError').textContent = '';
                    eventElement.remove(); // TOOD: Fix later so that if it's the only div the outer div is also removed
                }
                else
                {
                    document.getElementById('deleteEventError').textContent = response.message;
                }
            }
        }
        catch (error)
        {
            document.getElementById('deleteEventError').textContent = error;
        }
    };
    window.onclick = function(event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = 'none';
            document.getElementById('deleteEventError').textContent = '';
        }
    };
}

function markEventImportance(eventElement, eventID, isImportant) 
{
    const eventName = eventElement.querySelector('.event-name').textContent;
    document.getElementById('eventNameToMark').textContent = eventName;
    const actionText = isImportant ? "unmark" : "mark";
    document.getElementById('importanceAction').textContent = actionText;
    const modal = document.getElementById('markEventImportanceModal');
    modal.style.display = 'block';
    document.getElementById('closeMarkEventImportanceModal').onclick = function() 
    {
        modal.style.display = 'none';
        document.getElementById('markEventImportanceError').textContent = '';
    };
    document.getElementById('cancelMarkEventImportance').onclick = function() 
    {
        modal.style.display = 'none';
        document.getElementById('markEventImportanceError').textContent = '';
    };
    document.getElementById('confirmMarkEventImportance').onclick = async function() 
    {
        try 
        {
            const response = await sendRequest('/toggleEventImportance', { userID, eventID, isImportant: !isImportant })
            if (response.result === 'OK') 
            {
                alert(response.message);
                modal.style.display = 'none';
                document.getElementById('markEventImportanceError').textContent = '';
                // TODO: Refresh the event list with websocket
            } 
            else 
            {
                document.getElementById('markEventImportanceError').textContent = response.message;
            }
        } 
        catch (error) 
        {
            document.getElementById('markEventImportanceError').textContent = error.message || "An error occurred";
        }
    };

    window.onclick = function(event) 
    {
        if (event.target === modal) 
        {
            modal.style.display = 'none';
            document.getElementById('markEventImportanceError').textContent = '';
        }
    };
}

document.addEventListener('DOMContentLoaded', () => 
{
    document.getElementById('closeConfirmNavigationModal').onclick = () => 
    {
        document.getElementById('confirmNavigationModal').style.display = 'none';
    };
    document.getElementById('cancelNavigation').onclick = () => 
    {
        document.getElementById('confirmNavigationModal').style.display = 'none';
    };
});

function showNavigationConfirmModal(eventElement, isTeamEvent, eventID) 
{
    const eventName = eventElement.querySelector('.event-name').textContent;
    const startTimeText = eventElement.querySelector('.event-startTime').textContent;
    const formattedDate = startTimeText.replace("Start Time: ", "").split(", ")[0];
    const eventDate = new Date(formattedDate);
    const eventDateISO = eventDate.toISOString();

    document.getElementById('navigationModalHeader').textContent = isTeamEvent ? "Go To Team Calendar" : "Go To Calendar";
    document.getElementById('navigationConfirmText').textContent = `Are you sure you want to ${isTeamEvent ? "go to the team calendar" : "go to the calendar"} for the event "${eventName}"?`;
    document.getElementById('confirmNavigationModal').style.display = 'block';
    document.getElementById('confirmNavigation').onclick = async function() 
    {
        localStorage.setItem('navigateToDate', eventDateISO);
        localStorage.setItem('eventID', eventID)
        window.location.href = isTeamEvent ? "../teams/" : "../calendar/";
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