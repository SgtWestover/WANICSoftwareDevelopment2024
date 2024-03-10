var userID = localStorage.getItem('userID');

document.addEventListener('DOMContentLoaded', async function()
{
    try
    {
        const response = await sendRequest('/getAllUserEvents', { userID });
        if (response.result === 'OK')
        {
            generateUserSchedule(response.allUserEvents);
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

function generateUserSchedule(allUserEvents) 
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
    createEventCategoryContainer('TODAY', categorizedEvents.today);
    createEventCategoryContainer('TOMORROW', categorizedEvents.tomorrow);
    createEventCategoryContainer('NEXT WEEK', categorizedEvents.nextWeek);
    createEventCategoryContainer('LATER', categorizedEvents.later);
}

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