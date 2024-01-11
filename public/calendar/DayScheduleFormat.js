/*
Name: Zach Rojas, Kaelin Wang Hu
Date: 11/27/2023
Last Edit: 1/9/2023
Description: Handles the formatting for the day schedule
*/

//TODO: ORGANIZE PROCEDURAL BLOAT and make it so that the time zones are actually consistent
//TODO: Documentate better lol
//TODO: CalendarEvent probably needs to have a time zone parameter for it to be set to for multiple people/teams

//FUNCTION HEADER TEMPLATE
/**
 * Description
 * @param   {type} name
 * @returns {type}
 */

//line for indicating the current time
var currentTimeLine;
//lines that mark each hour on the popup
var currentTimeInterval;
//all the events of the user (from the server)
var userEvents = [];
//the current event element (may be deprecated)
var currentEventElement = null;
//Time scale
var startTime = 0;
var endTime = 24;
//day container for the majority of popup stuff
var dayContainer;

/**
 * Global listeners on document load
 * @returns {void}
 */
document.addEventListener('DOMContentLoaded', function() 
{
    //upon loading, initialize the events
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

/**
 * Initializes the user events from the database into the global userEvents variable
 * @returns {void} - but populates the global userEvents variable
 */
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

//closes the day popup
document.querySelector('.popup .close').addEventListener('click', function()
{
    document.getElementById('popupHeader').innerHTML = '';
});

/**
 * Generates the schedule for the popup, adding the day container and the measurement lines as well as the mouse tracking line
 * @returns {void} - but generates the schedule for each day's popup
 */
function generateSchedule() 
{
    // Get the schedule body element
    let scheduleBody = document.getElementById('scheduleBody');
    //Clear previous content from the schedule body
    scheduleBody.innerHTML = '';
    // Create a container (day-container) for the entire day's schedule
    dayContainer = document.createElement('div');
    dayContainer.classList.add("day-container");
    dayContainer.setAttribute('id', 'day-container');
    // Add an event listener to the .day-container element when the mouse is in the day container
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
    //make it so that the line follows the mouse when in the day container
    dayContainer.addEventListener("mousemove", function(event) 
    {
        lineFollow(event);
    });
    //when day container is clicked on, open the event form
    dayContainer.addEventListener("click", function(event) 
    {
        dayContainerClick(event);
    });
    //line for actually tracking the mouse
    let line = document.getElementById('line');
    dayContainer.appendChild(line);
    // Add the day container to the schedule body
    scheduleBody.appendChild(dayContainer);
    // Create Lines to show the hour things
    generateTimeMeasurements(dayContainer);
    // generate new measurement lines on resize
    window.addEventListener("resize", function(event) 
    {
        generateTimeMeasurements();
    });
}

/**
 * Generates the time measurements for the day container, runs 
 * @returns {void} - but creates the lines for each hour in the day container
 */
function generateTimeMeasurements()
{
    //TODO: Get Zach to document this thing. wtf is this??
    const currentLines = document.getElementsByClassName('measurement-line');
    //Remove existing lines
    while(currentLines.length > 0)
    {
        currentLines[0].parentNode.removeChild(currentLines[0]);
    }
    //Create new lines spaced properly
    for (let i = 1; i < endTime - startTime; i++)
    {
        let line = document.createElement('div');
        line.classList.add('measurement-line');
        line.style.left = `${i * ((parseInt(dayContainer.offsetWidth)) / (endTime - startTime))}px`;
        dayContainer.appendChild(line);   
    }
}

//On the window load, set global variables startTime and endTime and generate the schedule while initializing the current time tracker
window.onload = function() 
{
    startTime = 0;
    endTime = 24;
    generateSchedule();
    initializeCurrentTimeLine();
};

/**
 * Initializes the line to follow the mouse when hovering over the day container
 * @param   {Event} event - mouse event when passing over the day container
 * @returns {void} - but moves the line to follow the mouse
 */
function lineFollow(event)
{
    let line = document.getElementById('line');    
    let Left = line.parentElement.getBoundingClientRect().left;
    line.style.left = `${event.clientX - Left - 1.75}px`; // mousePos
    //Gets the selected time based on mouse position
    let current = event.clientX - Left;
    let max = parseInt(dayContainer.offsetWidth); //pixel on the right bound
    let percent = Math.floor((current / max) * 100) + 1;
    let selectedHour = ((endTime - startTime) * percent / 100) + startTime;
    selectedHour = Math.floor(selectedHour * 4) / 4; // Round to the nearest quarter hour
    lineText(event, convertToTime(selectedHour));
}

/**
 * Generates the text that will be shown above the line when hovering
 * @param   {Event} event - the mouse event to be followed
 * @param {String} time - the string indicating the time to be shown when hovering
 * @returns {void} - but initializes the text over the following line
 */
function lineText(event, time)
{
    let text = document.getElementById('lineTimeText');
    let Left = text.parentElement.getBoundingClientRect().left;
    text.style.left = `${event.clientX - Left - 5.5}px`; // mousePos
    text.innerHTML = time;
}

/**
 * Converts an integer representing a time to the format "HH:MM AM/PM"
 * @param   {int} num - the number to be converted
 * @returns {String} - the string representing the number
 */
function convertToTime(num)
{
    let ampm = "AM";
    let hour = Math.trunc(num);
    if (hour === 12) ampm = "PM"
    else if (hour > 12) 
    {
        hour -= 12;
        ampm = "PM";
        if (hour === 12) ampm = "AM";
    }
    if (hour === 0) hour = 12;
    num *= 100;
    let min = ((num % 100) / 100) * 60;
    if (min != 0) return hour + ":" + min + " " + ampm;
    else return hour + ":00 " + ampm;
}

/**
 * Called whenever the popup changes, and updates everything to reflect the new circumstances such as new events or new dates
 * @param   {CalendarEvent} eventDetail - a date (the one to update to) and a bool of whether or not that date is today
 * @returns {void} - but makes the popup day into its current state
 */
function updatePopupHeader(eventDetail)
{
    //immediately store the components of eventDetail
    let newDate = eventDetail.date;
    let isToday = eventDetail.isToday;
    //names of days in the week as a string array (can be literal because they're not gonna change)
    let dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    //get the month of the date as a string and format it.
    let monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(newDate);
    //get the actual day name from dayNames
    let dayName = dayNames[newDate.getDay()];
    //get the day of the month (1 - 31)
    let dayOfMonth = newDate.getDate();
    //format the headertext to be the day name, month name, and day of the month
    let headerText = `${dayName}, ${monthName} ${dayOfMonth}`;
    unrenderEvent(newDate); // unrender all events that don't match the newDate
    if (isToday) //if the date given is today, render the current time line that tells the time in the day
    {
        currentTimeLine.style.display = 'block';
        //initialize the red line indicating the current time
        updateCurrentTimeLine();
        // Clear any existing intervals and set a new one
        if (currentTimeInterval) clearInterval(currentTimeInterval);
        currentTimeInterval = setInterval(updateCurrentTimeLine, 1000); //do the update this every second
        headerText += " (Today)"; //also add to the header that it is indeed today
    } 
    else //otherwise, clear the timeline and the interval
    {
        currentTimeLine.style.display = 'none';
        if (currentTimeInterval) clearInterval(currentTimeInterval);
    }
    //set the header text to the new header text
    document.getElementById('popupHeader').innerText = headerText;
    document.getElementById('popupHeader').setAttribute('data-date', newDate.toISOString().split('T')[0]);
    //check through events to see if any match the new date, and render them if they do
    if (userEvents && userEvents.length > 0) 
    {
        userEvents.forEach(event => 
        {
            let eventDate = new Date(event._startDate);
            if (eventDate.toISOString().split('T')[0] === newDate.toISOString().split('T')[0]) //split so that only the date, month, and year are compared
            {
                renderEvent(event); //if the eventDate's date is the same as the newDate's date, render the event
            }
        });
    }
}

/**
 * Gets the date object from the popup header, which is a string
 * @param   {CalendarEvent} attr - the popup header's string attribute with a day, month, and year
 * @returns {Date} - the date object extracted
 */
function getDateFromAttribute(attr) 
{
    if (!attr) return new Date(); // return today's date if attr is empty or null
    let parts = attr.split('-');
    // attr is in 'YYYY-MM-DD' format
    let year = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JavaScript Date
    let day = parseInt(parts[2], 10);
    return new Date(year, month, day); // This treats the date as local time (TODO: fix this?)
}

/**
 * Navigates the popup to the previous or next day, updating the header and the events along the way
 * @param   {int} delta - the number of days to navigate by
 * @returns {void} - but updates the popup to the new day
 */
function navigateDay(delta) 
{
    //get the current day from the popupheader, convert it to an actual date, and then get a new date with the added delta to set the popup to
    let currentPopupDateAttr = document.getElementById('popupHeader').getAttribute('data-date');
    let currentPopupDate = getDateFromAttribute(currentPopupDateAttr);
    let newDate = new Date(currentPopupDate);
    newDate.setDate(currentPopupDate.getDate() + delta);
    // Check if the month has changed. If it has, update currentDate to the new date and re-render the calendar
    if (newDate.getMonth() !== currentPopupDate.getMonth()) 
    {
        renderCalendar(newDate);
    }
    // today is created to test whether the new date and today are the same
    let today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparison
    let isToday = newDate.toDateString() === today.toDateString();
    //store that comparison in eventDetail and update the popup header
    let eventDetail = 
    {
        date: newDate,
        isToday: isToday
    };
    updatePopupHeader(eventDetail);
}

/**
 * Generates the line tracking the current time, only called if the current day is selected
 * @returns {void} - but creates the red line tracking the current time
 */
function initializeCurrentTimeLine() 
{
    //create the div for the current time line, give it its attributes, and then append it to the day container to be shown
    currentTimeLine = document.createElement('div');
    currentTimeLine.classList.add('current-time-line');
    currentTimeLine.style.backgroundColor = 'red';
    currentTimeLine.style.height = '100%';
    currentTimeLine.style.width = '3px';
    currentTimeLine.style.position = 'absolute';
    currentTimeLine.style.display = 'none'; // Hidden by default unless the current day is selected
    dayContainer.appendChild(currentTimeLine);
}

/**
 * Updates the line tracking the current time to move across the day container
 * @returns {void} - but updates the red line tracking the current time
 */
function updateCurrentTimeLine() 
{
    //get the current hours and minutes, and then multiply its position with the day container's width to get the new position of the line
    let now = new Date();
    let hours = now.getHours() + now.getMinutes() / 60;
    //hours - startTime is the number of hours since the start of the day, multiplied by the width of the day container in terms of the hours (endTime - startTime)
    let leftPosition = (hours - startTime) * (dayContainer.offsetWidth / (endTime - startTime));
    currentTimeLine.style.left = `${leftPosition}px`;
}

/**
 * Opens the event popup when the day container is clicked on
 * @returns {void} - but shows the event popup
 */
function dayContainerClick(event)
{
    document.getElementById('eventPopup').style.display = 'block';
    return;
}

/**
 * Resets the event popup, clearing all the fields and resetting the form state, good for both when the form is closed and when it is submitted or edited
 * @returns {void} - but resets the event popup back to the original, cleared, non-editing state
 */
function resetEventForm() 
{
    const eventForm = document.getElementById('eventForm');
    //reset header
    document.getElementById('eventPopupHeader').textContent = 'Create Event';
    // Reset form fields
    eventForm.reset();
    document.getElementById('errorMessage').style.display = 'none'; // Hide error message if visible
    // Reset form state and button text
    eventForm.removeAttribute('data-editing');
    eventForm.removeAttribute('data-event-id');
    document.getElementById('submitEventButton').value = 'Create Event';
    // Remove the delete button if it exists (editing mode only)
    let deleteButton = document.getElementById('deleteEventButton');
    if (deleteButton) 
    {
        deleteButton.remove();
    }
}

/**
 * Closes the event form, resetting it in the process
 * @returns {void} - but closes and resets the event popup
 */
function closeEventForm()
{
    resetEventForm(); //resetEventForm() handles all of the heavy lifting, this just also closes the event popup
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
        deleteEvent(eventID).then(response => 
        {
            if (currentEventElement) 
            {
                currentEventElement.remove();
                currentEventElement = null;
            }
            handleEventCreationOrUpdate();
        }).catch(error => console.error("Error deleting event:", error));
    } 
    else 
    {
        // Create mode: just create a new event
        handleEventCreationOrUpdate();
    }
});

/**
 * @param {string} message - the error message to display.
 * @returns {void} - but closes and resets the event popup
 */
function displayErrorMessage(message) 
{
    //get the error message element, set the content to the message, and display it
    const errorMessageDiv = document.getElementById('errorMessage');
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block';
}

/**
 * Checks whether a certain event in the sidebar is a duplicate of an existing event
 * @param {Object} newEventData - the data of the event card to check
 * @param {string} eventID - the ID of the event being edited
 * @returns {boolean}
 */
function isDuplicateEventInSidebar(newEventData, eventID) 
{
    const eventCards = document.querySelectorAll('.event-card');
    return Array.from(eventCards).some(card => 
    {
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

/**
 * Takes in a raw string of the time and formats it to AM/PM formatting
 * @param {string} timeString - the string of the time to convert.
 * @returns {void} - but closes and resets the event popup
 */
function formatTimeStringWithAMPM(timeString) 
{
    let [hours, minutes] = timeString.split(':').map(Number);
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert hour '0' to '12'
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Takes in a userID and gets the events from the database that has the userID attached
 * @param {string} userID - the userID to get the events of.
 * @returns {Array<CalendarEvent>}
 */
function getUserEvents(userID) 
{
    //call the backend function to do the heavy lifting
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
        console.log("userEvents: aaa" + JSON.stringify(userEvents));
        userEvents.forEach(event => 
        {
            console.log("event: " + JSON.stringify(event));
            console.log("event.gettime()" + event._startDate.getTime());
            //js for some reason ignores timezones when creating new dates so if you have a timezone it gets offset stupid thing
            let timeZoneOffset = event._startDate.getTimezoneOffset() * 60000
            event._startDate = new Date(event._startDate.getTime() + timeZoneOffset);
            event._endDate = new Date(event._endDate.getTime() + timeZoneOffset);
            console.log(event._startDate);    
    });
    console.log(userEvents);
        return userEvents;
    });
}

/**
 * Converts an object containing strings into a CalendarEvent object, used for turning backend objects back into events
 * @param {Object} data - the object containing field with strings to be converted
 * @returns {CalendarEvent}
 */
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

/**
 * Creates an event element in the schedule given an event and displays it in the day container
 * @param {CalendarEvent} calendarEvent - the event to be rendered onto the day container
 * @returns {void} - but creates a new event element in the schedule day container
 */
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
    let hourLength = (calendarEvent._endDate.getHours() * 60 + calendarEvent._endDate.getMinutes()) - (calendarEvent._startDate.getHours() * 60 + calendarEvent._startDate.getMinutes());
    let eventWidth = ((hourLength * parseInt(dayContainer.offsetWidth)) / ((endTime - startTime) * 60))
    eventElement.style.width = `${eventWidth}px`
    console.log(hourLength);
    console.log(calendarEvent._endDate);
    console.log(calendarEvent._endDate.getHours());
    console.log((calendarEvent._startDate.getHours() * 60 + calendarEvent._startDate.getMinutes()));
    console.log(userEvents);
    // Gets the selected time based on mouse position
    selectedHour = ((calendarEvent._startDate.getHours()/* + timeZoneOffset*/) * 60 + calendarEvent._startDate.getMinutes());
    if (selectedHour >= 1440) // 24 hours * 60 min
    {
        selectedHour -= 1440;
    }
    // set position
    eventElement.style.left = `${selectedHour * ((parseInt(dayContainer.offsetWidth)) / ((endTime - startTime) * 60))}px`;
    dayContainer.appendChild(eventElement);   
}

function populateEventForm(eventID, calendarEvent, eventElement)
{
    let startDate = calendarEvent._startDate;
    let endDate = calendarEvent._endDate;
    currentEventElement = eventElement;

    document.getElementById('eventPopupHeader').textContent = 'Edit Event';
    document.getElementById('eventName').value = calendarEvent._name;
    document.getElementById('startTime').value = startDate; // Format to "HH:MM"
    document.getElementById('endTime').value = endDate; // Format to "HH:MM"
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

/**
 * Deletes an event from the database and removes the event element from the DOM given its ID
 * @param {string} eventID - the ID of the event to be deleted
 * @returns {string} - the response from the server detailing whether the deletion was successful or not
 */
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

/**
 * Turns the dates into a string of the HH:MM in UTC
 * @param {Date} date - the date to be converted to a UTC string
 * @returns {string} - the string of the date in UTC
 */
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

/**
 * Removes all events from the day container that don't match the current date
 * @param {Date} currentDate - the current date to be compared to see what will be removed
 * @returns {void} - but removes all the events not in the current day
 */
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

/**
 * Creates a new event in the database with the given details
 * @param {Date} currentDate - the current date to be compared to see what will be removed
 * @returns {void} - but removes all the events not in the current day
 */
function createNewEvent(eventDetails) 
{
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

// Event listener for opening the sidebar
document.getElementById('showEventsSidebar').addEventListener('click', function() 
{
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

/**
 * Updates the events sidebar for each day containing all the events cards
 * @returns {void} - but renders the sidebar with all the events for that particular day
 */
function populateEventsSidebar() 
{
    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '';

    const selectedDateAttr = document.getElementById('popupHeader').getAttribute('data-date');
    const selectedDate = new Date(selectedDateAttr);

    getUserEvents(localStorage.getItem('userID'))
    .then(events => 
    {
        // Filter events by date
        const filteredEvents = events.filter(event => 
        {
            let eventDate = new Date(event._startDate);
            return eventDate.toISOString().split('T')[0] === selectedDateAttr;
        });
        // Sort events as per the specified criteria
        filteredEvents.sort((a, b) => 
        {
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
        filteredEvents.forEach(event => createEventCard(event, eventsList));
    })
    .catch(error => console.error('Error loading events:', error));
}

/**
 * Creates an event card for the sidebar given an event and a container to append it to
 * @returns {void} - but appends the created event card to the container to be rendered
 */
function createEventCard(event, container) 
{
    const eventCard = document.createElement('div');
    eventCard.classList.add('event-card');
    eventCard.innerHTML = 
    `
        <h3>${event._name}</h3>
        <p><i>Start:</i> ${formatTime(event._startDate)}</p>
        <p><i>End:</i> ${formatTime(event._endDate)}</p>
        <p>${event._description}</p>
    `;
    eventCard.setAttribute('data-event-id', event._id);
    eventCard.addEventListener('click', () => 
    {
        populateEventForm(event._id, event, eventCard);
        document.getElementById('eventPopup').style.display = 'block';
    });
    container.appendChild(eventCard);
}

/**
 * Formats a Date object into HH:MM AM/PM configuration
 * @param {CalendarEvent} date - the calendar event to be converted
 * @returns {string} - the string representing the date in HH:MM AM/PM format
 */
function formatTime(date) 
{
    let timeOffset = date.getTimezoneOffset() / 60;
    let hours = (date.getHours()) % 24; //future me is gonna hate this one lmaoooooo
    let minutes = date.getMinutes().toString().padStart(2, '0');
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours %= 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

/**
 * Sends the given event to the database
 * @param {CalendarEvent} - the calendar event to be sent
 * @returns {string} - the message from the backend indicating whether the event insertion was successful or not
 */
function sendEventToDatabase(event)
{
    //send a request to create an event in the backend with the CalendarEvent
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

/**
 * Finds the eventID given the event parameters
 * @param {CalendarEvent} event - the calendar event to get the ID of
 * @returns {string} - the message from the backend indicating whether the event insertion was successful or not
 */
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