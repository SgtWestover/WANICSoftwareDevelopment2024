/*
Name: Zach Rojas, Kaelin Wang Hu
Date: 11/27/2023
Last Edit: 12/15/2023
Desc: Handles the formatting for the day schedule
*/

//TODO: ORGANIZE PROCEDURAL BLOAT and make it so that the time zones are actually consistent
//TODO: Documentate better lol
//TODO: CalendarEvent probably needs to have a time zone parameter for it to be set to for multiple people/teams

let currentTimeLine;
let currentTimeInterval;
let userEvents = [];
let currentEventElement = null;

//Generate things

document.addEventListener('DOMContentLoaded', function() 
{

    initializeEvents();

    // Listen for the dateSelected event
    document.addEventListener('dateSelected', function(event) 
    {
        updatePopupHeader(event.detail);
    });

    // Event listeners for the previous and next day buttons
    document.getElementById('prev-day').addEventListener('click', function() 
    {
        navigateDay(-1);
    });

    document.getElementById('next-day').addEventListener('click', function() 
    {
        navigateDay(1);
    });
});

//Time scale
let startTime = 0;
let endTime = 24;

let dayContainer;

function initializeEvents()
{
    const userID = localStorage.getItem('userID'); // Assuming userID is stored in localStorage
    if (userID)
    {
        getUserEvents(userID).then(fetchedEvents => 
        {
            userEvents = fetchedEvents; // Populate the global variable
            console.log("UserEvents: " + JSON.stringify(userEvents));
        }).catch(error => 
        {
            console.error('Error fetching initial events:', error);
        });
    }
}

//Generates the HTML elements for the schedule menu
function generateSchedule() 
{
    // Get the schedule body element
    let scheduleBody = document.getElementById('scheduleBody');
    
    // Clear previous content from the schedule body
    scheduleBody.innerHTML = '';

    // Create a container for the entire day's schedule
    dayContainer = document.createElement('div');
    dayContainer.classList.add("day-container");
    dayContainer.setAttribute('id', 'day-container');
    dayContainer.addEventListener("mousemove", function(event) 
    {
        lineFollow(event);
    });
    dayContainer.addEventListener("click", function(event) 
    {
        dayContainerClick(event);
    });


    let line = document.getElementById('line');
    dayContainer.appendChild(line);


    // Add the day container to the schedule body
    scheduleBody.appendChild(dayContainer);

    // Create Lines to show the hour things
    generateTimeMeasurements(dayContainer);
    // generate new lines on resize
    window.addEventListener("resize", function(event) 
    {
        generateTimeMeasurements();
    });

    // Add an event listener to the .day-container element
    dayContainer.addEventListener('mouseover', function () 
    {
        // Select the .lineTimeText element and change its opacity
        let lineTimeText = document.getElementById('lineTimeText');
        lineTimeText.style.opacity = 1;
    });

    // Add an event listener to reset the opacity when not hovering
    dayContainer.addEventListener('mouseout', function () 
    {
        // Select the .lineTimeText element and reset its opacity
        let lineTimeText = document.getElementById('lineTimeText');
        lineTimeText.style.opacity = 0;
    });

}

//Generates the lines that indicate the measurements of each hour
function generateTimeMeasurements()
{
    const currentLines = document.getElementsByClassName('measurement-line');
    while(currentLines.length > 0)
    {
        currentLines[0].parentNode.removeChild(currentLines[0]);
    }

    for (let i = 1; i < endTime - startTime; i++)
    {
        let line = document.createElement('div');
        line.classList.add('measurement-line');
        line.style.left = `${i * ((parseInt(dayContainer.offsetWidth)) / (endTime - startTime))}px`;
        dayContainer.appendChild(line);   
    }
}

//Runs on the window load
window.onload = function() 
{
    startTime = 0;
    endTime = 24;
    //initializeInputListeners();
    generateSchedule();
    initializeCurrentTimeLine();
};

//Handles the line that follows the mouse to indicate the user what time they have selected
function lineFollow(event)
{
    let line = document.getElementById('line');    
    let Left = line.parentElement.getBoundingClientRect().left;
    line.style.left = `${event.clientX - Left - 1.75}px`; // mousePos
    
    //Gets the selected time based on mouse position
    let current = event.clientX - Left;
    let max = parseInt(dayContainer.offsetWidth);
    let percent = Math.floor((current / max) * 100) + 1;
    let selectedHour = ((endTime - startTime) * percent / 100) + startTime;
    selectedHour = Math.floor(selectedHour * 4) / 4;
    
    lineText(event, convertToTime(selectedHour));
}

//Handles the text that shows what time the user is currently selecting
function lineText(event, time)
{
    let text = document.getElementById('lineTimeText');
    let Left = text.parentElement.getBoundingClientRect().left;
    text.style.left = `${event.clientX - Left - 5.5}px`; // mousePos
    text.innerHTML = time;
}

function convertToTime(num)
{
    let ampm = "AM";
    let hour = Math.trunc(num);
    

    if (hour === 12)
    {
        ampm = "PM"
    }
    
    if (hour > 12) 
    {
        hour -= 12;
        ampm = "PM";
        if (hour === 12) ampm = "AM";
    }

    if (hour === 0)
    {
        hour = 12;
    }

    num *= 100;
    let min = ((num % 100) / 100) * 60;
    
    if (min != 0)
    {
        return hour + ":" + min + " " + ampm;
    }
    else
    {
        return hour + ":00 " + ampm;
    }
}


function updatePopupHeader(eventDetail) 
{
    let newDate = eventDetail.date;
    let isToday = eventDetail.isToday;
    let dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(newDate);
    let dayName = dayNames[newDate.getDay()];
    let dayOfMonth = newDate.getDate();
    let headerText = `${dayName}, ${monthName} ${dayOfMonth}`;

    unrenderEvent(newDate); // unrender all events that don't match the newDate

    if (isToday) 
    {
        currentTimeLine.style.display = 'block';
        updateCurrentTimeLine();
        // Clear any existing interval and set a new one
        if (currentTimeInterval) clearInterval(currentTimeInterval);
        currentTimeInterval = setInterval(updateCurrentTimeLine, 1000); //does this every second
        headerText += " (Today)";
    } 
    else 
    {
        currentTimeLine.style.display = 'none';
        if (currentTimeInterval) clearInterval(currentTimeInterval);
    }
    document.getElementById('popupHeader').innerText = headerText;
    document.getElementById('popupHeader').setAttribute('data-date', newDate.toISOString().split('T')[0]);
    //check through events
    if (userEvents && userEvents.length > 0) 
    {
        userEvents.forEach(event => 
        {
            let eventDate = new Date(event._startDate);
            if (eventDate.toISOString().split('T')[0] === newDate.toISOString().split('T')[0]) 
            {
                renderEvent(event);
            }
        });
    }
}

function getDateFromAttribute(attr) 
{
    if (!attr) return new Date(); // return today's date if attr is empty or null

    let parts = attr.split('-');
    // Assuming attr is in 'YYYY-MM-DD' format
    let year = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JavaScript Date
    let day = parseInt(parts[2], 10);

    return new Date(year, month, day); // This treats the date as local time
}

function navigateDay(delta) 
{
    let currentPopupDateAttr = document.getElementById('popupHeader').getAttribute('data-date');
    let currentPopupDate = getDateFromAttribute(currentPopupDateAttr);

    let newDate = new Date(currentPopupDate);
    newDate.setDate(currentPopupDate.getDate() + delta);

    // Check if the month has changed
    if (newDate.getMonth() !== currentPopupDate.getMonth()) 
    {
        // Update currentDate to the new date and re-render the calendar
        renderCalendar(newDate);
    }

    let today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparison
    let isToday = newDate.toDateString() === today.toDateString();

    let eventDetail = 
    {
        date: newDate,
        isToday: isToday
    };
    updatePopupHeader(eventDetail);
}

//i have to do it in here because the day container is null otherwise and is created here. WHY?
//html and css should not mix with js, refactor perhaps???
function initializeCurrentTimeLine() 
{
    currentTimeLine = document.createElement('div');
    currentTimeLine.classList.add('current-time-line');
    currentTimeLine.style.backgroundColor = 'red';
    currentTimeLine.style.height = '100%';
    currentTimeLine.style.width = '3px';
    currentTimeLine.style.position = 'absolute';
    currentTimeLine.style.display = 'none'; // Hidden by default unless the current day is selected
    dayContainer.appendChild(currentTimeLine);
}

//updates the current timeline based on the current time
function updateCurrentTimeLine() 
{
    let now = new Date();
    let hours = now.getHours() + now.getMinutes() / 60;
    let leftPosition = (hours - startTime) * (dayContainer.offsetWidth / (endTime - startTime));
    currentTimeLine.style.left = `${leftPosition}px`;
}

//handles creating events when the day container is clicked
function dayContainerClick(event)
{
    document.getElementById('eventPopup').style.display = 'block';
    return;
}

//resets the event form
function resetEventForm() 
{
    const eventForm = document.getElementById('eventForm');
    document.getElementById('eventPopupHeader').textContent = 'Create Event';
    // Reset form fields
    eventForm.reset();
    document.getElementById('errorMessage').style.display = 'none'; // Hide error message if visible

    // Reset form state and button text
    eventForm.removeAttribute('data-editing');
    eventForm.removeAttribute('data-event-id');
    document.getElementById('submitEventButton').value = 'Create Event';

    // Remove the delete button if it exists
    let deleteButton = document.getElementById('deleteEventButton');
    if (deleteButton) 
    {
        deleteButton.remove();
    }
}


//closes the event form
function closeEventForm()
{
    resetEventForm();
    document.getElementById('eventPopup').style.display = 'none';
}

//on submission of the event creater form
document.getElementById('eventForm').addEventListener('submit', function(e) 
{
    e.preventDefault();
    // Get form values
    var userIDString = localStorage.getItem('userID');
    var eventUsers = userIDString ? [userIDString] : [];
    var eventName = document.getElementById('eventName').value;
    var startTime = document.getElementById('startTime').value;
    var endTime = document.getElementById('endTime').value;
    var eventDesc = document.getElementById('eventDesc').value;

    // Convert time to Date objects
    var currentPopupDateAttr = document.getElementById('popupHeader').getAttribute('data-date');
    var currentDate = new Date(currentPopupDateAttr);
    var startDate = new Date(currentDate);
    var endDate = new Date(currentDate);    
    var [startHours, startMinutes] = startTime.split(':').map(Number);
    var [endHours, endMinutes] = endTime.split(':').map(Number);
    var timeOffset = startDate.getTimezoneOffset() * 60000;
    var dayOffset = 24 * 60 * 60 * 1000;
    startDate.setHours(startHours, startMinutes);
    endDate.setHours(endHours, endMinutes);
    startDate = new Date(startDate.getTime() - timeOffset + dayOffset); //dunno why but you have to add a day for this to work
    endDate = new Date(endDate.getTime() - timeOffset + dayOffset);

    const eventForm = document.getElementById('eventForm');
    const isEditing = eventForm.getAttribute('data-editing') === 'true';
    const eventID = eventForm.getAttribute('data-event-id');
    // Validation
    if (startDate >= endDate) 
    {
        // Invalid input, show error message
        displayErrorMessage("Invalid start and end times");
        return;
    }

    // Function to handle event creation or update
    const handleEventCreationOrUpdate = () => {
        const eventDetails = {
            _users: eventUsers,
            _name: eventName,
            _startDate: startDate,
            _endDate: endDate,
            _description: eventDesc
        };
        createNewEvent(eventDetails);
    };
    
    // Edit mode: first delete the existing event, then create/update
    if (isEditing && eventID) {
        const originalEventData = JSON.parse(eventForm.getAttribute('data-original-event'));
        // Compare current form data with original event data
        const currentEventData = {
            name: document.getElementById('eventName').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            description: document.getElementById('eventDesc').value
        };
        // If they are the exact same, then display an error message
        if (JSON.stringify(currentEventData) === JSON.stringify(originalEventData)) {
            var errorMessageDiv = document.getElementById('errorMessage');
            errorMessageDiv.textContent = "Event Unchanged";
            errorMessageDiv.style.display = 'block';
            return;
        }
        if (isDuplicateEventInSidebar(currentEventData, eventID)) 
        {
            displayErrorMessage("Duplicate event data");
            return;
        }
        // Proceed with event update
        deleteEvent(eventID).then(response => {
            if (currentEventElement) {
                currentEventElement.remove();
                currentEventElement = null;
            }
            handleEventCreationOrUpdate();
        }).catch(error => console.error("Error deleting event:", error));
    } else {
        // Create mode: just create a new event
        handleEventCreationOrUpdate();
    }
});

function displayErrorMessage(message) 
{
    const errorMessageDiv = document.getElementById('errorMessage');
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block';
}

function isDuplicateEventInSidebar(newEventData, eventID) 
{
    const eventCards = document.querySelectorAll('.event-card');
    return Array.from(eventCards).some(card => {
        if (card.getAttribute('data-event-id') === eventID) return false; // Skip the event being edited

        const cardName = card.querySelector('h3').textContent;
        const cardStart = card.querySelector('p:nth-child(2)').textContent.split(': ')[1];
        const cardEnd = card.querySelector('p:nth-child(3)').textContent.split(': ')[1];
        const cardDesc = card.querySelector('p:nth-child(4)').textContent;
        return cardName === newEventData.name &&
               cardStart === formatTimeStringWithAMPM(newEventData.startTime) &&
               cardEnd === formatTimeStringWithAMPM(newEventData.endTime) &&
               cardDesc === newEventData.description;
    });
}

function formatTimeStringWithAMPM(timeString) {
    let [hours, minutes] = timeString.split(':').map(Number);
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert hour '0' to '12'
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// client side function which accesses server side event finder functions. Essentially an abstraction for messy backend stuff
function getUserEvents(userID) 
{
    return fetch(`/getUserEvents/${userID}`)
        .then(response => 
        {
            if (!response.ok) 
            {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(events =>
        {
            userEvents = events.map(eventData => convertCalendarEvent(eventData)); //map each eventData into a new calendar event
            return userEvents;
        });
}

//the original constructor can't be touched without breaking stuff, so the next best thing is to use an individual function to convert the data
function convertCalendarEvent(data)
{
    return new CalendarEvent
    (
        data._id, //id
        data._users,
        data._name,
        new Date(data._startDate),
        new Date(data._endDate),
        data._description,
        data._location,
        data._teams
    );
}

// handles creating an event element in the schedule, and displaying it correctly in the html
function renderEvent(calendarEvent)
{    
    // create event element
    let eventElement = document.createElement("div");
    eventElement.classList.add('schedule-event');
    eventElement.innerHTML = calendarEvent._name //TODO: make it the description or something we can add more later
    let eventDateID = calendarEvent._startDate.toISOString().split('T')[0]; // YYYY-MM-DD format, gives identifiers so it can be more easily removed later
    eventElement.style.zIndex = 20;
    eventElement.setAttribute('data-event-date', eventDateID);
    eventElement.setAttribute('data-event-id', calendarEvent._id); // Attach MongoDB ID to the element
    const timeZoneOffset = calendarEvent._startDate.getTimezoneOffset() / 60;
    eventElement.addEventListener('click', function() 
    {
        findEventID(calendarEvent)
        .then(eventID => 
        {
            populateEventForm(eventID, calendarEvent, eventElement);
        })
        .catch(error => 
        {
            console.error('Error:', error);
        });
    });
    // set element width
    let hourLength = (calendarEvent._endDate.getHours()* 60 + calendarEvent._endDate.getMinutes()) - (calendarEvent._startDate.getHours() * 60 + calendarEvent._startDate.getMinutes());
    let eventWidth = ((hourLength * parseInt(dayContainer.offsetWidth)) / ((endTime - startTime) * 60))
    eventElement.style.width = `${eventWidth}px`
    // Gets the selected time based on mouse position
    selectedHour = ((calendarEvent._startDate.getHours() + timeZoneOffset) * 60 + calendarEvent._startDate.getMinutes());    
    // set position
    eventElement.style.left = `${selectedHour * ((parseInt(dayContainer.offsetWidth)) / ((endTime - startTime) * 60))}px`;
    dayContainer.appendChild(eventElement);   
}

//TODO: INEFFICIENT FUNCTION, REFACTOR LATER WITH FRAGMENTS
function populateEventForm(eventID, calendarEvent, eventElement)
{
    let startDate = calendarEvent._startDate;
    let endDate = calendarEvent._endDate;
    currentEventElement = eventElement;

    document.getElementById('eventPopupHeader').textContent = 'Edit Event';
    document.getElementById('eventName').value = calendarEvent._name;
    document.getElementById('startTime').value = formatToUTCTime(startDate); // Format to "HH:MM"
    document.getElementById('endTime').value = formatToUTCTime(endDate); // Format to "HH:MM"
    document.getElementById('eventDesc').value = calendarEvent._description;
    const eventForm = document.getElementById('eventForm');
    eventForm.setAttribute('data-editing', 'true');
    eventForm.setAttribute('data-event-id', eventID);
    document.getElementById('submitEventButton').value = 'Edit Event';

    let fragment = document.createDocumentFragment();
    
    let deleteButton = document.getElementById('deleteEventButton');
    if (!deleteButton) 
    {
        deleteButton = document.createElement('button');
        deleteButton.id = 'deleteEventButton';
        deleteButton.textContent = 'Delete Event';
        fragment.appendChild(deleteButton);
    }

    const originalEventData = 
    {
        name: calendarEvent._name,
        startTime: formatToUTCTime(calendarEvent._startDate),
        endTime: formatToUTCTime(calendarEvent._endDate),
        description: calendarEvent._description
    };

    eventForm.setAttribute('data-original-event', JSON.stringify(originalEventData));

    deleteButton.onclick = function(e) 
    {
        e.preventDefault();
        deleteEvent(eventID); 
    };

    document.getElementById('eventForm').appendChild(fragment)
    document.getElementById('eventForm').style.display = 'block'; //inefficent but it works
}

function deleteEvent(eventID) 
{
    let eventBody = { eventID: eventID };
    currentEventElement.remove();
    return sendRequest('/deleteEvent', eventBody)
        .then(response => {
            if (response.result === 'OK') {
                // Find and remove the event element with the matching eventID
                const eventElements = document.querySelectorAll('.schedule-event');
                eventElements.forEach(element => {
                    if (element.getAttribute('data-event-id') === eventID) {
                        element.remove();
                    }
                });

                initializeEvents();
                closeEventForm();
                return response.message;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            throw error;
        });
}

function formatToUTCTime(date) 
{
    // Get UTC hours and minutes
    const hoursUTC = date.getUTCHours();
    const minutesUTC = date.getUTCMinutes();
    // Pad single digit minutes and hours with a leading zero
    const paddedHoursUTC = hoursUTC.toString().padStart(2, '0');
    const paddedMinutesUTC = minutesUTC.toString().padStart(2, '0');
    // Return the formatted time string in UTC
    return paddedHoursUTC + ':' + paddedMinutesUTC;
}

//handles deleting the event from local view when it's not the correct date
function unrenderEvent(currentDate) 
{
    let currentDateString = currentDate.toISOString().split('T')[0];
    let eventElements = document.querySelectorAll('.schedule-event');

    eventElements.forEach(element => 
    {
        let eventDate = element.getAttribute('data-event-date');
        if (eventDate !== currentDateString) 
        {
            element.remove(); // Rekmove the event element from the DOM
        }
    });
}

function createNewEvent(eventDetails) {
    sendEventToDatabase(eventDetails)
        .then(response => 
        {
            if (response.result === 'OK' && response.message === "Event Created") 
            {
                document.getElementById('eventPopup').style.display = 'none';
                document.getElementById('errorMessage').style.display = 'none';
                eventDetails._id = response.eventID; // Assign the new event ID
                renderEvent(eventDetails);
                initializeEvents();
                populateEventsSidebar();
                closeEventForm();
            } 
            else 
            {
                displayErrorMessage(response.message);
            }
        })
        .catch(error => displayErrorMessage(error.message));
}


document.getElementById('showEventsSidebar').addEventListener('click', function() {
    populateEventsSidebar();
    document.getElementById('eventsSidebar').style.display = 'block';
    document.getElementById('pageOverlay').style.display = 'block'; // Show the overlay
});

// Event listener for closing the sidebar
document.getElementById('closeSidebar').addEventListener('click', function() {
    document.getElementById('eventsSidebar').style.display = 'none';
    document.getElementById('pageOverlay').style.display = 'none'; // Hide the overlay
    closeEventForm();
});

function populateEventsSidebar() 
{
    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '';

    getUserEvents(localStorage.getItem('userID'))
        .then(events => {
            // Sort events as per the specified criteria
            events.sort((a, b) => {
                // Compare by start time
                if (a._startDate < b._startDate) return -1;
                if (a._startDate > b._startDate) return 1;

                // Compare by end time if start times are equal
                if (a._endDate < b._endDate) return -1;
                if (a._endDate > b._endDate) return 1;

                // Compare by name length if end times are equal
                if (a._name.length < b._name.length) return -1;
                if (a._name.length > b._name.length) return 1;

                // Compare by description length if names are equal
                return a._description.length - b._description.length;
            });

            // Create event cards for each sorted event
            events.forEach(event => createEventCard(event, eventsList));
        })
        .catch(error => console.error('Error loading events:', error));
}

function createEventCard(event, container) {
    const eventCard = document.createElement('div');
    eventCard.classList.add('event-card');
    eventCard.innerHTML = `
        <h3>${event._name}</h3>
        <p><i>Start:</i> ${formatTime(event._startDate)}</p>
        <p><i>End:</i> ${formatTime(event._endDate)}</p>
        <p>${event._description}</p>
    `;
    eventCard.setAttribute('data-event-id', event._id);
    eventCard.addEventListener('click', () => {
        populateEventForm(event._id, event, eventCard);
        document.getElementById('eventPopup').style.display = 'block';
    });
    container.appendChild(eventCard);
}

//yeah imma be honest i just threw shit at the wall and see what stuck.
function formatTime(date) 
{
    let timeOffset = date.getTimezoneOffset() / 60;
    let hours = (date.getHours() + timeOffset) % 24; //future me is gonna hate this one lmaoooooo
    let minutes = date.getMinutes().toString().padStart(2, '0');
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours %= 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

function sendEventToDatabase(event)
{
    //database things
    return sendRequest('/createEvent', event)
        .then(message => 
        {
            console.log(message.message);
            return message;
        })
        .catch(error => 
        {
            console.error('Error:', error)
            throw error;
    });
}

function findEventID(event) 
{
    return sendRequest('/findEvent', 
    {
        _users: event._users,
        _name: event._name,
        _startDate: event._startDate,
        _endDate: event._endDate,
        _description: event._description
    })
    .then(response => 
    {
        // Check if the event was found and return the ID
        if (response.result === 'OK') 
        {
            return response.eventID;
        } 
        else 
        {
            console.error('Event not found:', response.message);
            return null;
        }
    })
    .catch(error => {
        console.error('Error finding event ID:', error);
        return null;
    });
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