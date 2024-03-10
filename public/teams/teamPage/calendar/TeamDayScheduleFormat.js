
//FUNCTION HEADER TEMPLATE
/**
 * Description
 * @param   {type} name
 * @returns {type}
 */





let ws;
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
var teamData = JSON.parse(localStorage.getItem("teamData"));
const roleLevels = 
{
    'Viewer': 1, 
    'User': 2,
    'Admin': 3,
    'Owner': 4
};
let highlightedDay;

//array to hold the changed events after dragging
let eventsToUpdate = [];


//#region Popup initialization

/**
 * Global listeners on document load
 * @returns {void}
 */
document.addEventListener('DOMContentLoaded', function() 
{
    (async () => 
    {
        userRole = await getCurrentUserRole();
        if (userRole != null) localStorage.setItem("userRole", userRole);
    })();
    //upon loading, initialize the events
    initializeEvents();
    connectWebSocket();
    // Listen for the dateSelected event
    document.addEventListener('dateSelected', function(event) 
    {
        highlightedDay = event.detail.date;
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

function connectWebSocket() 
{
    // Establish a WebSocket connection. Change when IP is different
    ws = new WebSocket('ws://192.168.50.42:8080');
    ws.onopen = function()
    {
        console.log("WebSocket connection established.");
    };
    ws.onmessage = function(event)  //important :3
    {
        handleWebSocketMessage(event.data);
    };
    ws.onerror = function(error) 
    {
        console.error("WebSocket error:", error);
    };
    ws.onclose = function(event) 
    {
        console.log("WebSocket connection closed:", event);
        setTimeout(connectWebSocket, 3000); // Reconnect after 3 seconds
    };
}


/**
 * Initializes the user events from the database into the global userEvents variable
 * @returns {void} - but populates the global userEvents variable
 */
function initializeEvents()
{
    const userID = localStorage.getItem('userID'); // userID is stored in localStorage
    if (userID)
    {
        getUserEvents(userID).then(fetchedEvents => 
        {
            userEvents = fetchedEvents; // Populate the global variable
        }).catch(error => 
        {
            console.error('Error fetching initial events:', error);
        });
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
    let dragging = false;
    let dragLeft = false;
    let dragRight = false;
    let mouseDownTime = 0;
    let startX;
    let endX;
    let dragElement;
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
        if(dragging) 
        {
            snapDragElement(dragElement, event, dragLeft, dragRight);
        }        
    });

    dayContainer.addEventListener('mousedown', function(event)
    {
        dragging = true;
        mouseDownTime = event.timeStamp;
        startX = event.clientX - dayContainer.getBoundingClientRect().left;
        let element = event.target;
        if(event.target.id !== 'day-container')
        {
            dragElement = event.target;
            if (event.clientX - element.parentElement.getBoundingClientRect().left > parseInt(element.style.left) - 7 && event.clientX - element.parentElement.getBoundingClientRect().left < parseInt(element.style.left) + 7)
            {
                console.log("LEFT");
                dragLeft = true;
            }
            else if (event.clientX - element.parentElement.getBoundingClientRect().left >= parseInt(element.style.left) + parseInt(element.offsetWidth) - 7 && event.clientX - element.parentElement.getBoundingClientRect().left <= parseInt(element.style.left) + parseInt(element.offsetWidth) + 7)
            {
                console.log("RIGHT");
                dragRight = true;
                
            }
        } 
    });
    dayContainer.addEventListener('mousemove', function(event) 
    {
        if (event.buttons === 1 && !dragging)
        { 

        }
        else if (dragging)
        {
 
        }
    });
    dayContainer.addEventListener('mouseup', function(event) 
    {
        if (dragging) 
        {
            dragging = false;
            dragRight = false;
            dragLeft = false;
        }
        let mouseUpTime = event.timeStamp; 
        let duration = mouseUpTime - mouseDownTime;
        endX = event.clientX - dayContainer.getBoundingClientRect().left;
        if (duration < 150)
        {
            dayContainerClick(event);
        }
        else
        {
            //mouse up
            //update event that was dragged
            updateDragEvent(dragElement);
        }
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

function updateDragEvent(element)
{
    //let Left = element.parentElement.getBoundingClientRect().left;
    let current = parseInt(element.style.left); 
    let max = parseInt(dayContainer.offsetWidth);
    let percent = Math.floor((current / max) * 100) + 1;
    let startSelectedHour = ((endTime - startTime) * percent / 100) + startTime;
    startSelectedHour = Math.floor(startSelectedHour * 4) / 4; // Round to the nearest quarter hour.
    let endSelectedHour = startSelectedHour + ((endTime - startTime) * ((Math.floor((element.offsetWidth / max) * 100) + 1) / 100) + startTime);
    endSelectedHour = Math.floor(endSelectedHour * 4) / 4;

    let arrayLength = eventsToUpdate.length;
    for(let i = 0; i < arrayLength; i++)
    {
        if(element.getAttribute('data-event-id') === eventsToUpdate[i].eventId)
        {
            eventsToUpdate.splice(i,1);
            arrayLength--;
            i--;
        }
    }
    eventsToUpdate.push(new EventTimes(element.getAttribute('data-event-id'), startSelectedHour, endSelectedHour));
    console.log(eventsToUpdate);
}

async function updateDraggedEventsToServer() 
{
    for (let event of eventsToUpdate) 
    {
        try 
        {
            var userIDString = localStorage.getItem('userID');
            const teamEventID = event.eventId;
            let oldEvent;
            let startNum = event.startTime;
            startNum *= 100;
            let startMin = ((startNum % 100) / 100) * 60;
            let endNum = event.endTime
            endNum *= 100;
            let endMin = ((endNum % 100) / 100) * 60;
            let startDate = getDateFromAttribute(document.getElementById('popupHeader').getAttribute('data-date'));
            startDate.setHours(event.startTime, startMin)
            let endDate = new Date(startDate);
            endDate.setHours(event.endTime, endMin);
            console.log("update drag startDate: " + startDate);
            const response = await sendRequest('/findTeamEventByID', { teamEventID });
            if (response.result === 'OK') 
            {
                oldEvent = response.event;
                if (oldEvent) 
                {
                    const eventDetails = 
                    {
                        _team: teamData._joinCode,
                        _users: oldEvent._users,
                        _permissions: oldEvent._permissions,
                        _viewable: oldEvent._viewable,
                        _name: oldEvent._name,
                        _startDate: startDate,
                        _endDate: endDate,
                        _description: oldEvent._description
                    };
                    console.log(JSON.stringify(eventDetails));
                    const newEventID = await createNewEvent(eventDetails);
                    await deleteEvent(event.eventId);
                    await sendRequest('/notificationEditEvent', {
                        teamCode: teamData._joinCode, 
                        userID: userIDString, 
                        receivers: oldEvent._users,
                        eventID: newEventID,
                        prevEvent: oldEvent
                    });
                }
            } else if (response.result === 'FAIL') 
            {
                console.log(response.message);
            }
        } 
        catch (error) 
        {
            console.error("Error processing event:", error);
        }
    }
}


function snapDragElement(element, event)
{
    //the left most position of the day container
    let Left = element.parentElement.getBoundingClientRect().left;
    //position of mouse relative to day container
    let current = event.clientX - Left - element.offsetWidth/2;
    //the width of day container
    let max = parseInt(dayContainer.offsetWidth);
    //the percent based on position of mouse in the day contianer
    let percent = Math.floor((current / max) * 100) + 1;
    let selectedHour = ((endTime - startTime) * percent / 100) + startTime;
    
    //check mouse pos if on edge of the event
    if (dragLeft)
    {
        //the position of the right border of the element
        let rightPos = parseInt(element.offsetWidth) + parseInt(element.style.left)
        //set position if dragging from left
        console.log("dragging from the left");
        element.style.left = event.clientX - Left + "px";
        element.style.width = rightPos - parseInt(element.style.left) + "px";
        
    }
    else if (dragRight)
    {
        //set position if dragging from right
        console.log("dragging from the right");
        let leftPos = parseInt(element.style.left);
        element.style.width = event.clientX - Left - leftPos + 'px';
    }
    else
    {
        //set poition if dragging from the middle
        selectedHour = Math.floor(selectedHour * 4) / 4;
        element.style.left = (max / 24) * selectedHour + 1.2 + "px";
    }
}



/**
 * Generates the time measurements for the day container, runs 
 * @returns {void} - but creates the lines for each hour in the day container
 */
function generateTimeMeasurements() 
{
    // Retrieve all existing measurement lines in the day container.
    const currentLines = document.getElementsByClassName('measurement-line');

    // Remove existing lines to refresh the measurements.
    while (currentLines.length > 0) 
    {
        currentLines[0].parentNode.removeChild(currentLines[0]);
    }
    // Create new measurement lines based on the start and end times of the day.
    for (let i = 1; i < endTime - startTime; i++) 
    {
        let line = document.createElement('div');
        line.classList.add('measurement-line');
        // Position each line proportionally within the day container based on the hour.
        line.style.left = `${i * ((parseInt(dayContainer.offsetWidth)) / (endTime - startTime))}px`;
        dayContainer.appendChild(line);   
    }
}

/**
 * Initializes the line to follow the mouse when hovering over the day container
 * @param   {Event} event - mouse event when passing over the day container
 * @returns {void} - but moves the line to follow the mouse
 */
function lineFollow(event) 
{
    let line = document.getElementById('line');    
    let Left = line.parentElement.getBoundingClientRect().left;
    // Position the line to follow the mouse horizontally within the day container.
    line.style.left = `${event.clientX - Left - 1.75}px`;
    // Calculate the selected time based on the mouse's position.
    let current = event.clientX - Left;
    let max = parseInt(dayContainer.offsetWidth);
    let percent = Math.floor((current / max) * 100) + 1;
    let selectedHour = ((endTime - startTime) * percent / 100) + startTime;
    selectedHour = Math.floor(selectedHour * 4) / 4; // Round to the nearest quarter hour.
    // Display the calculated time above the line.
    lineText(event, convertToTime(selectedHour));
}

/**
 * Converts an integer representing a time to the format "HH:MM AM/PM"
 * @param   {int} num - the number to be converted
 * @returns {String} - the string representing the number
 */
function convertToTime(num) 
{
    let ampm = "AM";
    let hour = Math.trunc(num); // Extract the hour part from the number.
    // Convert 24-hour format to 12-hour format and set AM/PM accordingly.
    if (hour === 12) ampm = "PM";
    else if (hour > 12) //if it's more than 12, subtract it to keep AM/PM continuity
    {
        hour -= 12;
        ampm = "PM";
        if (hour === 12) ampm = "AM";
    }
    if (hour === 0) hour = 12; //if it's at hour 0, then it should be 12 AM
    // Convert the decimal part to minutes.
    num *= 100;
    let min = ((num % 100) / 100) * 60;
    // Format the time string in "HH:MM AM/PM" format.
    return min !== 0 ? hour + ":" + min + " " + ampm : hour + ":00 " + ampm;
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
    // Position the text element to follow the mouse, displaying the time.
    text.style.left = `${event.clientX - Left - 5.5}px`;
    text.innerHTML = time; // Update the text to show the calculated time.

}

// #endregion Popup initialization

//#region Popup update

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
    return new Date(year, month, day);
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
    let username;
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
    getTeamEvents(teamData._joinCode)
    .then(teamEvents=>
    {
        let currentPopupDateAttr = document.getElementById('popupHeader').getAttribute('data-date');
        let currentPopupDate = getDateFromAttribute(currentPopupDateAttr);
        let newDate = new Date(currentPopupDate);
        teamEvents.forEach(event => 
        {
            let eventDate = new Date(event._startDate);
            console.log(eventDate);
            console.log("update popupHeader startdate: " + eventDate.toISOString().split('T')[0]);
            console.log("update popupHeader startdate: " + eventDate.toISOString());
            console.log("new date: " + newDate.toISOString().split('T')[0]);
            if (toLocalISOString(eventDate) === toLocalISOString(newDate)) 
            {
                console.log("rendering event now");
                renderEvent(event);
            }
        });
    })
    .catch(error => 
    {
        console.error('Error initializing events:', error);
    });
}

function toLocalISOString(date) 
{
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60000));
    return localDate.toISOString().split('T')[0];
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
    let username;
    let time = document.getElementById('lineTimeText').innerHTML;
    let timeArray = time.split(" ");
    time = timeArray[0];
    let isPM = (timeArray[1] === 'PM');
    let hourArray = time.split(":");
    let hour
    if (isPM)
    {
        hour = parseInt(hourArray[0]);
        hour += 12;    
    }
    else
    {
        hour = parseInt(hourArray[0]);
    }
    if(hour >= 24) hour -= 12;
    time = hour.toString().padStart(2, '0') + ":" + hourArray[1];
    let endTime = (hour + 1).toString().padStart(2, '0') + ':' + hourArray[1];
    document.getElementById('startTime').value = time; // Format to "HH:MM"
    document.getElementById('endTime').value = endTime;
    document.getElementById('addedUsers').innerHTML = '';
    sendRequest('/getUser', {userID: localStorage.getItem("userID")})
    .then(response =>
    {
        if (response.result === "OK")
        {
            username = response.user._name;
            if (roleLevels[teamData._users[username]] > roleLevels['Viewer'])
            {
                document.getElementById('eventPopup').style.display = 'block';
            }
        } 
        else 
        {
            console.error("GET USER ERROR");
        }
    });

}


// #endregion Popup update

//#region Event creation

//on submission of the event creater form
document.getElementById('eventForm').addEventListener('submit', function(e) 
{
    //TODO: Standardize Date to set stuff instead of creating new things and messing up the timezone
    e.preventDefault();
    // Get form values and the userID from local storage
    var userIDString = localStorage.getItem('userID');
    var eventUsers = [];
    const addedUsersDiv = document.getElementById('addedUsers');
    const userDivs = addedUsersDiv.getElementsByClassName('addedUser');
    Array.from(userDivs).forEach(div => 
    {
        const userID = div.getAttribute('data-user-id');
        eventUsers.push(userID);
    });
    var eventName = document.getElementById('eventName').value;
    var startTime = document.getElementById('startTime').value;
    var endTime = document.getElementById('endTime').value;
    var eventDesc = document.getElementById('eventDesc').value;
    var permissions = document.getElementById('eventPermissions').value;
    var viewable = document.getElementById('eventViewable').value;
    // Convert time to Date objects
    var currentPopupDateAttr = document.getElementById('popupHeader').getAttribute('data-date');
    var currentDate = new Date(currentPopupDateAttr);
    var startDate = new Date(currentDate);
    var endDate = new Date(currentDate);    
    // Set the start and end time correctly with the given form values after manipulating them to be valid
    var [startHours, startMinutes] = startTime.split(':').map(Number);
    var [endHours, endMinutes] = endTime.split(':').map(Number);
    var timeOffset = startDate.getTimezoneOffset() * 60000;
    startDate.setUTCHours(startHours, startMinutes); // For some reason, setUTCHours is the one that actually sets the hours locally...
    endDate.setUTCHours(endHours, endMinutes);
    startDate = new Date(startDate.getTime() + timeOffset); // Adding a day offset is required because we set it locally 3 times, so we have to add the time back
    endDate = new Date(endDate.getTime() + timeOffset);
    //get the event form from html while setting the isEditing attribute to be true and also getting the eventID
    const eventForm = document.getElementById('eventForm');
    const isEditing = eventForm.getAttribute('data-editing') === 'true';
    let eventID = eventForm.getAttribute('data-event-id');
    // Validation to ensure bounds are valid
    if (startDate >= endDate) 
    {
        // Invalid input, show error message
        displayErrorMessage("Invalid start and end times");
        return;
    }
    if (roleLevels[viewable] > roleLevels[permissions]) 
    {
        displayErrorMessage("Viewable role cannot be higher than permissions role");
        return;
    }
    // Function to handle event creation or update
    const processEventCreationOrUpdate = () => 
    {
        const eventDetails = 
        {
            _team: teamData._joinCode,
            _users: eventUsers,
            _permissions: permissions,
            _viewable: viewable,
            _name: eventName,
            _startDate: startDate,
            _endDate: endDate,
            _description: eventDesc
        };
        return createNewEvent(eventDetails);
    };
    
    const finalizeEventCreationOrUpdate = async (newEventID) => 
    {
        const notificationType = isEditing ? '/notificationEditEvent' : '/notificationCreateEvent';
        try
        {
            const response = await sendRequest('/findTeamEventByID', { teamEventID : newEventID });
            if (response.result === 'OK')
            {
                const prevEvent = response.event
                const notifResult = sendRequest(notificationType, 
                {    
                    teamCode: teamData._joinCode, 
                    userID: userIDString, 
                    receivers: eventUsers, 
                    eventID: newEventID,
                    prevEvent
                });
                while (addedUsersDiv.firstChild) 
                {
                    addedUsersDiv.removeChild(addedUsersDiv.firstChild);
                }    
            }
            else if (response.result === 'FAIL')
            {
                console.log(response.message);
            }
        }
        catch (error)
        {
            console.log(error);
        }
    };

    // Edit mode: first delete the existing event, then create/update
    if (isEditing && eventID) 
    {
        if (eventUsers.length === 0)
        {
            var errorMessageDiv = document.getElementById('errorMessage');
            errorMessageDiv.textContent = "Need at least one person in event";
            errorMessageDiv.style.display = 'block';
            return;
        }
        const originalEventData = JSON.parse(eventForm.getAttribute('data-original-event'));
        // Compare current form data with original event data
        const currentEventData = 
        {
            team: teamData._joinCode,
            users: eventUsers,
            permissions: permissions,
            viewable: viewable,
            name: document.getElementById('eventName').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            description: document.getElementById('eventDesc').value
        };
        // If they are the exact same, then display an error message
        if (JSON.stringify(currentEventData) === JSON.stringify(originalEventData)) 
        {
            var errorMessageDiv = document.getElementById('errorMessage');
            errorMessageDiv.textContent = "Event Unchanged";
            errorMessageDiv.style.display = 'block';
            return;
        }
        // If we are in the sidebar and we cannot easily access the form and its data, we can still use the eventID from earlier to check if it's a duplicate
        if (isDuplicateEventInSidebar(currentEventData, eventID)) 
        {
            displayErrorMessage("Duplicate event data");
            return;
        }
        //TODO: Make it so that only added users, or those with one level higher than the access permission, can delete the event.
        // Proceed with event update if no errors have been detected so far
        deleteEvent(eventID).then(() => 
        {
            processEventCreationOrUpdate().then(newEventID => finalizeEventCreationOrUpdate(newEventID))
            .catch(error => console.error("Error processing event creation or update:", error));
        }).catch(error => console.error("Error deleting event:", error));
    }
    else //otherwise, we are in create mode and just create the new event without deleting anything
    {
        eventUsers.unshift(userIDString);
        processEventCreationOrUpdate().then(newEventID => finalizeEventCreationOrUpdate(newEventID))
        .catch(error => console.error("Error processing event creation or update:", error));
    }
});

/**
 * Creates a new event in the database with the given details
 * @param {Date} eventDetails - the current date to be compared to see what will be removed
 * @returns {void} - but adds a new event to the database and to the calendar with the given details
 */
async function createNewEvent(eventDetails) 
{
    try 
    {
        const response = await sendEventToDatabase(eventDetails);
        console.log("createNewEvent response: " + JSON.stringify(response));
        if (response.result === 'OK' && response.message === "Event Created") 
        {
            eventDetails._id = response.eventID;
            eventDetails._startDate = new Date(eventDetails._startDate); 
            eventDetails._endDate = new Date(eventDetails._endDate);
            initializeEvents();
            populateEventsSidebar();
            closeEventForm();
            return response.eventID;
        } 
        else 
        {
            displayErrorMessage(response.message);
            return null;
        }
    } 
    catch (error) 
    {
        displayErrorMessage(error.message);
        return null;
    }
}


/**
 * Creates an event element in the schedule given an event and displays it in the day container
 * @param {CalendarEvent} calendarEvent - the event to be rendered onto the day container
 * @returns {void} - but creates a new event element in the schedule day container
 */
function renderEvent(calendarEvent)
{
    let username;
    sendRequest('/getUser', {userID: localStorage.getItem("userID")})
    .then(response =>
    {
        if (response.result === 'OK')
        {
            username = response.user._name;
            if (roleLevels[teamData._users[username]] >= roleLevels[calendarEvent._viewable] || calendarEvent._users.includes(response.user._id)) 
            {
                // Create event element
                let eventElement = document.createElement("div");
                eventElement.classList.add('schedule-event');
                // Set the "header" of the eventElement to the name
                eventElement.innerHTML = calendarEvent._name;
                let eventDateID = calendarEvent._startDate.toISOString().split('T')[0]; // YYYY-MM-DD format, gives identifiers to be more easily found
                // Moderate z index so it can be shown on dayContainer without blocking the sidebar or the event frm
                eventElement.style.zIndex = 20;
                // Attach the current day it has as well as the backend mongoDB ID to the element for easy search access
                eventElement.setAttribute('data-event-date', eventDateID);
                eventElement.setAttribute('data-event-id', calendarEvent._id);
                //when the event is clicked, it should populate the event form to go into editing mode
                eventElement.addEventListener('click', function() //TODO: CHECK THAT THEY CAN EDIT!
                {
                    if ((roleLevels[teamData._users[username]] >= roleLevels[calendarEvent._permissions] || calendarEvent._users.includes(response.user._id)) && roleLevels[teamData._users[username]] > 1)
                    {
                        findEventID(calendarEvent) //first find the ID so that can be used for populateEventForm
                        .then(eventID => 
                        {
                            populateEventForm(eventID, calendarEvent, eventElement);
                        })
                        .catch(error => 
                        {
                            console.error('Error:', error);
                        });
                    }
                });
                // set the event element width based on the start and end time as a percentage of the total day container
                let hourLength = (calendarEvent._endDate.getHours() * 60 + calendarEvent._endDate.getMinutes()) - (calendarEvent._startDate.getHours() * 60 + calendarEvent._startDate.getMinutes());
                let eventWidth = ((hourLength * parseInt(dayContainer.offsetWidth)) / ((endTime - startTime) * 60))
                eventElement.style.width = `${eventWidth}px` 
                // Gets the selected time based on mouse position
                selectedHour = ((calendarEvent._startDate.getHours()) * 60 + calendarEvent._startDate.getMinutes());
                // Finally, set the ultimate position and append it to the day container
                eventElement.style.left = `${selectedHour * ((parseInt(dayContainer.offsetWidth)) / ((endTime - startTime) * 60))}px`;
                dayContainer.appendChild(eventElement);   
            }
        }
    });
}

/**
 * Removes all events from the day container that don't match the current date
 * @param {Date} currentDate - the current date to be compared to see what will be removed
 * @returns {void} - but removes all the events not in the current day
 */
function unrenderEvent(currentDate) 
{
    //let currentDateString = currentDate.toISOString().split('T')[0]; //get the current date as a string to be compared against data-event-date of other events
    let eventElements = document.querySelectorAll('.schedule-event'); //get all the event elements from .schedule-event where they are stored
    eventElements.forEach(element => 
    {
        element.remove();
        /*let eventDate = element.getAttribute('data-event-date'); //for each event, compare the data-event-date against the current extracted date, and if they match, remove them from the html
        if (eventDate !== currentDateString) 
        {
            
        }*/
    });
}

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
 * Closes the event form, resetting it in the process
 * @returns {void} - but closes and resets the event popup
 */
function closeEventForm()
{
    resetEventForm(); //resetEventForm() handles all of the heavy lifting, this just also closes the event popup
    document.getElementById('eventPopup').style.display = 'none';
    highlightSelectedDay();
}


function closeEventPopupHeader()
{
    updateDraggedEventsToServer();
    resetEventForm(); //resetEventForm() handles all of the heavy lifting, this just also closes the event popup
    document.getElementById('eventPopup').style.display = 'none';
    highlightSelectedDay();
}

function highlightSelectedDay() 
{
    if (highlightedDay) 
    {
        let calendarBody = document.getElementById('calendar-body');
        let cells = calendarBody.querySelectorAll('.calendar-cell');
        cells.forEach(function(cell) 
        {
            let cellText = cell.innerText.trim();
            let cellDate = new Date(highlightedDay.getFullYear(), highlightedDay.getMonth(), parseInt(cellText, 10));
            if (cellText && cellDate.getTime() === highlightedDay.getTime()) 
            {
                cell.style.backgroundColor = '#FF0000';
                cell.style.transition = '';
                setTimeout(function() 
                {
                    cell.style.transition = 'background-color 5s ease-out';
                    let targetBackgroundColor = cell.classList.contains('current-day') ? '#ff69b4' : '#181a1b';
                    cell.style.backgroundColor = targetBackgroundColor; // Set to target color
                    setTimeout(function() 
                    {
                        if (!cell.classList.contains('current-day')) 
                        {
                            cell.classList.remove('selected-day');
                        }
                        cell.style.backgroundColor = '';
                        cell.style.transition = '';
                    }, 5000);
                }, 10);
            }
        });
    }
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

//#endregion Event creation

//#region Event update

/**
 * Populates the event form with the parameters of a certain calendar event to be changed in editing mode
 * @param {String} eventID - the ID of the event to be edited
 * @param {CalendarEvent} calendarEvent - the calendar event that will filled into the form's fields
 * @param {div} eventElement - the div corresponding to the calendar event that will be changed
 * @returns {void} - but changes the event submission form into editing mode with prepopulated parameters.
 */
function populateEventForm(eventID, calendarEvent, eventElement)
{
    //get the parameters of the given calendarEvent to be filled out to the field
    let startDate = calendarEvent._startDate;
    let endDate = calendarEvent._endDate;
    currentEventElement = eventElement;
    //Change the event popup so that it is now in editing mode and has the necessary text to go along
    document.getElementById('eventPopupHeader').textContent = 'Edit Event';
    document.getElementById('eventName').value = calendarEvent._name;
    document.getElementById('startTime').value = formatToTime(startDate); // Format to "HH:MM"
    document.getElementById('endTime').value = formatToTime(endDate); // Format to "HH:MM"
    document.getElementById('eventDesc').value = calendarEvent._description;
    // set the data attributes to the appropriate settings for editing, incluing changing the value of the submit button to edit and data-editing to true
    const eventForm = document.getElementById('eventForm');
    eventForm.setAttribute('data-editing', 'true');
    eventForm.setAttribute('data-event-id', eventID);
    document.getElementById('submitEventButton').value = 'Edit Event';
    document.getElementById('eventPermissions').value = calendarEvent._permissions;
    document.getElementById('eventViewable').value = calendarEvent._viewable;
    let fragment = document.createDocumentFragment(); //create fragment for more efficiency when it is appended later on
    let deleteButton = document.getElementById('deleteEventButton');
    // If the delete button doesn't exist, create it with the appropriate changes
    if (!deleteButton)
    {
        deleteButton = document.createElement('button');
        deleteButton.id = 'deleteEventButton';
        deleteButton.textContent = 'Delete Event';
        fragment.appendChild(deleteButton);
    }
    const addedUsersDiv = document.getElementById('addedUsers');
    addedUsersDiv.innerHTML = ''; 
    let usersLabel = document.createElement('div');
    usersLabel.textContent = 'USERS:';
    usersLabel.className = 'usersLabel';
    addedUsersDiv.appendChild(usersLabel);
    async function displayAddedUsers(userIDs) 
    {
        for (let userID of userIDs) 
        {
            try 
            {
                const response = await sendRequest('/getUser', { userID: userID });
                if (response.result === 'OK') 
                {
                    const user = response.user;
                    const userDiv = document.createElement('div');
                    userDiv.textContent = `${user._name}`;
                    userDiv.className = 'addedUser';
                    userDiv.setAttribute('data-user-id', userID);
                    addedUsersDiv.appendChild(userDiv);
                } 
                else 
                {
                    console.error('Failed to fetch user:', response.message);
                }
            } 
            catch (error) 
            {
                console.error('Error fetching user details:', error);
                // Optionally handle network errors or other exceptions
            }
        }
    }
    if (calendarEvent._users && calendarEvent._users.length > 0) 
    {
        displayAddedUsers(calendarEvent._users);
    }
    // Save the original event data to be compared later to see if there are duplicates
    const originalEventData = 
    {
        team: calendarEvent._team,
        users: calendarEvent._users,
        permissions: calendarEvent._permissions,
        viewable: calendarEvent._viewable,
        name: calendarEvent._name,
        startTime: formatToTime(calendarEvent._startDate), //format the times to military so that it can be easily compared later on
        endTime: formatToTime(calendarEvent._endDate),
        description: calendarEvent._description
    };
    eventForm.setAttribute('data-original-event', JSON.stringify(originalEventData));
    //add functionality to the delete button so that, on click, it will delete the event
    deleteButton.onclick = function(e) 
    {
        e.preventDefault();
        deleteEvent(eventID).then(response =>
        {
            if (response.result === "OK")
            {
                document.getElementById('addedUsers').innerHTML = '';
                sendRequest("/notificationDeleteEvent", 
                {
                    teamCode : teamData._joinCode, 
                    userID: localStorage.getItem("userID"), 
                    receivers: calendarEvent._users, 
                    eventID: eventID,
                    deletedEvent : response.deletedEvent
                });
            }
        }) 
    };
    document.getElementById('eventForm').appendChild(fragment)
    document.getElementById('eventForm').style.display = 'block'; //inefficent but still works, refactor later?
}


/**
 * Deletes an event from the database and removes the event element from the DOM given its ID
 * @param {string} eventID - the ID of the event to be deleted
 * @returns {string} - the response from the server detailing whether the deletion was successful or not
 */
function deleteEvent(eventID) 
{
    let eventBody = { eventID: eventID };
    if (currentEventElement) currentEventElement.remove();
    return sendRequest('/deleteTeamEvent', eventBody)
    .then(response => 
    {
        if (response.result === 'OK') 
        {
            //delete event from the local edit queue 
            let arrayLength = eventsToUpdate.length;
            for(let i = 0; i < arrayLength; i++)
            {
                if(eventID === eventsToUpdate[i].eventId)
                {
                    eventsToUpdate.splice(i,1);
                    arrayLength--;
                    i--;
                }
            }

            // Find and remove the event element with the matching eventID
            const eventElements = document.querySelectorAll('.schedule-event');
            eventElements.forEach(element => 
            {
                if (element.getAttribute('data-event-id') === eventID) 
                {
                    element.remove();
                }
            });
            // After deleting events, update the local side variable and close the event form as well
            initializeEvents();
            closeEventForm();
            return { result : "OK", deletedEvent : response.deletedEvent };  // Return the string "OK" to indicate success
        } 
        else 
        {
            // If the result is not 'OK', throw an error to be caught by the catch block
            throw new Error(response.message || "Failed to delete event");
        }
    })
    .catch(error => 
    {
        console.error('Error:', error);
        throw error;  // Rethrow the error to ensure that it can be handled by the caller
    });
}


/**
 * Turns the dates into a string of the HH:MM in UTC
 * @param {Date} date - the date to be converted to a UTC string
 * @returns {string} - the string of the date in UTC
 */
function formatToTime(date) 
{
    // Get UTC hours and minutes
    const hoursUTC = date.getHours();
    const minutesUTC = date.getMinutes();
    // Pad single digit minutes and hours with a leading zero
    const paddedHoursUTC = hoursUTC.toString().padStart(2, '0');
    const paddedMinutesUTC = minutesUTC.toString().padStart(2, '0');
    // Return the formatted time string in UTC
    return paddedHoursUTC + ':' + paddedMinutesUTC;
}   

//#endregion Event update

//#region Events sidebar

// Event listener for opening the sidebar
document.getElementById('showEventsSidebar').addEventListener('click', function() 
{
    populateEventsSidebar();
    document.getElementById('eventsSidebar').style.display = 'block';
    document.getElementById('pageOverlay').style.display = 'block'; // Show the overlay
});

// Event listener for closing the sidebar
document.getElementById('closeSidebar').addEventListener('click', function() 
{
    document.getElementById('eventsSidebar').style.display = 'none';
    document.getElementById('pageOverlay').style.display = 'none'; // Hide the overlay
    closeEventForm(); //also close the event form if it is open to prevent abuse
});

/**
 * Updates the events sidebar for each day containing all the events cards
 * @returns {void} - but renders the sidebar with all the events for that particular day
 */
function populateEventsSidebar() 
{
    //get the events list to attach the event cards to while also getting the current day
    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '';
    const selectedDateAttr = document.getElementById('popupHeader').getAttribute('data-date');
    getUserEvents(localStorage.getItem('userID')) 
    .then(events => 
    {
        // Filter events by whether they are on the same day as the popup
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
    // Create event card element and add the details such as the name, start date, end date, and description
    const eventCard = document.createElement('div');
    eventCard.classList.add('event-card');
    //fill in the inner html with the parameters from the event argument
    eventCard.innerHTML = 
    `
        <h3>${event._name}</h3>
        <p><i>Start:</i> ${formatTime(event._startDate)}</p>
        <p><i>End:</i> ${formatTime(event._endDate)}</p>
        <p>${event._description}</p>
    `;
    //also fill the event card with the ID of the event being filled out to ensure continuity between sidebar and popup
    eventCard.setAttribute('data-event-id', event._id);
    eventCard.addEventListener('click', () => 
    {
        //if clicked, add the event to the event form submission in editing mode and display it
        populateEventForm(event._id, event, eventCard);
        document.getElementById('eventPopup').style.display = 'block';
    });
    container.appendChild(eventCard); //appends it to the sidebar
}

/**
 * Formats a Date object into HH:MM AM/PM configuration
 * @param {CalendarEvent} date - the calendar event to be converted
 * @returns {string} - the string representing the date in HH:MM AM/PM format
 */
function formatTime(date) 
{
    //get the hours as well as the minutes, with padding to keep formatting
    let hours = date.getHours();
    let minutes = date.getMinutes().toString().padStart(2, '0');
    //if over 12 hours (PM), subtract 12 and set AM/PM to PM. Otherwise, it's AM
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours %= 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

/**
 * Checks whether a certain event in the sidebar is a duplicate of an existing event
 * @param {Object} newEventData - the data of the event card to check
 * @param {string} eventID - the ID of the event being edited
 * @returns {boolean}
 */
function isDuplicateEventInSidebar(newEventData, eventID) 
{
    // Select all event cards from the sidebar.
    const eventCards = document.querySelectorAll('.event-card');
    // Check if any card matches the new event data, indicating a duplicate.
    return Array.from(eventCards).some(card => 
    {
        // Skip comparison for the event being edited.
        if (card.getAttribute('data-event-id') === eventID) return false;
        // Extract data from the event card for comparison.
        const cardName = card.querySelector('h3').textContent;
        const cardStart = card.querySelector('p:nth-child(2)').textContent.split(': ')[1];
        const cardEnd = card.querySelector('p:nth-child(3)').textContent.split(': ')[1];
        const cardDesc = card.querySelector('p:nth-child(4)').textContent;
        // Compare the extracted data with the new event data.
        return cardName === newEventData.name &&
        cardStart === formatTimeString(newEventData.startTime) &&
        cardEnd === formatTimeString(newEventData.endTime) &&
        cardDesc === newEventData.description;
    });
}

/**
 * Takes in a raw string of the time and formats it to AM/PM formatting
 * @param {string} timeString - the string of the time to convert.
 * @returns {void} - but closes and resets the event popup
 */
function formatTimeString(timeString) 
{
    let [hours, minutes] = timeString.split(':').map(Number);
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert hour '0' to '12'
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

//#endregion Events sidebar

//#region Events server communication

/**
 * Takes in a userID and gets the events from the database that has the userID attached
 * @param {string} userID - the userID to get the events of.
 * @returns {Array<CalendarEvent>} - the events of the user in an array
 */
function getUserEvents(userID) 
{
    //call the backend function to do the heavy lifting
    return fetch(`/getTeamUserEvents/${userID}`)
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
        userEvents = events.map(eventData => convertTeamCalendarEvent(eventData)); //map each eventData into a new calendar event
        return userEvents;
    });
}

async function getTeamEvents(teamCode)
{
    try
    {
        const response = await sendRequest('/getTeamEvents', {teamCode : teamCode});
        if (response.result !== 'OK')
        {
            throw new Error('Network response result was not OK');
        }
        const teamEvents = response.teamEvents.map(eventData => convertTeamCalendarEvent(eventData));
        return teamEvents;
    }
    catch (error)
    {
        console.error('Error fetching team events:', error);
        throw error;
    }
}



/**
 * Converts an object containing strings into a CalendarEvent object, used for turning backend objects back into events
 * @param {Object} data - the object containing field with strings to be converted
 * @returns {CalendarEvent}
 */
function convertTeamCalendarEvent(data)
{
    return new CalendarTeamEvent
    (
        data._id, //id
        data._team,
        data._users,
        data._permissions,
        data._viewable,
        data._history,
        data._name,
        new Date(data._startDate), //automatically converts the UTC date stored in server back to local time
        new Date(data._endDate),
        data._description,
        data._location,
    );
}

/**
 * Sends the given event to the database
 * @param {CalendarEvent} - the calendar event to be sent
 * @returns {string} - the message from the backend indicating whether the event insertion was successful or not
 */
async function sendEventToDatabase(event)
{
    //send a request to create an event in the backend with the CalendarEvent
    const response = sendRequest('/createTeamEvent', event);
    return response;
}

/**
 * Finds the eventID given the event parameters, a wrapper for the findEvent backend call that can be accessed on the frontend
 * @param {CalendarEvent} event - the calendar event to get the ID of
 * @returns {string} - the message from the backend indicating whether the event insertion was successful or not. If it was, send back the eventID
 */
function findEventID(event) 
{
    return sendRequest('/findTeamEvent', 
    {
        _team: event._team,
        _users: event._users,
        _permissions: event._permissions,
        _viewable: event._viewable,
        _history: event._history,
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
    .catch(error => 
    {
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

//#endregion Events server communication

function adjustFormOptionsRole(userRole)
{
    const permissionsSelect = document.getElementById('eventPermissions');
    const viewableSelect = document.getElementById('eventViewable');
    function adjustSelectOptions(select, userLevel) 
    {
        const options = Array.from(select.options);
        options.forEach(option => 
        {
            if (roleLevels[option.value] > userLevel + 1) 
            {
                option.remove();
            }
        });
    }
    // Adjust both select elements based on the user's role
    adjustSelectOptions(permissionsSelect, roleLevels[userRole]);
    adjustSelectOptions(viewableSelect, roleLevels[userRole]);
}

function openUserManagementModal()
{
    document.getElementById('manageUsersModal').style.display = 'block';
}

function resetUserManagementModal()
{
    resetUserManagementError();
    document.getElementById('usernameToManage').value = '';
}

function closeUserManagementModal()
{
    document.getElementById('manageUsersModal').style.display = 'none';
    resetUserManagementModal();
}

function addUserToEvent() 
{
    const username = document.getElementById('usernameToManage').value;
    sendRequest('/findUser', { username: username })
    .then(response => 
    {
        if (response.result === 'OK') 
        {
            let userID = response.userID;
            if (teamData._users[username])
            {
                const addedUsersDiv = document.getElementById('addedUsers');
                let usersLabel = addedUsersDiv.querySelector('.usersLabel');
                if (!usersLabel) 
                {
                    usersLabel = document.createElement('div');
                    usersLabel.textContent = 'USERS:';
                    usersLabel.className = 'usersLabel';
                    addedUsersDiv.appendChild(usersLabel);
                }
                const existingUserDiv = addedUsersDiv.querySelector(`[data-user-id="${userID}"]`);
                if (existingUserDiv) 
                {
                    displayUserManagementError('User already added.');
                    return;
                }
                const userDiv = document.createElement('div');
                userDiv.textContent = `${username}`;
                userDiv.className = 'addedUser';
                userDiv.setAttribute('data-user-id', userID);
                addedUsersDiv.appendChild(userDiv);
                resetUserManagementModal();    
            }
            else
            {
                displayUserManagementError('User not in team.');
            }
        }
        else 
        {
            displayUserManagementError('Failed to add user to event: ' + response.message);
        }        
    })
    .catch(error => 
    {
        console.error('Error adding user to event:', error);
        displayUserManagementError('Error adding user to event.');
    });
}

function removeUserFromEvent() 
{
    const username = document.getElementById('usernameToManage').value;
    sendRequest('/findUser', { username: username })
    .then(response => 
    {
        if (response.result === 'OK') 
        {
            const userID = response.userID;
            const addedUsersDiv = document.getElementById('addedUsers');
            const userDiv = addedUsersDiv.querySelector(`[data-user-id="${userID}"]`);
            if (userDiv)
            {
                addedUsersDiv.removeChild(userDiv);
            }
            else if (!userDiv)
            {
                displayUserManagementError('User not found in event.');
            }
        } 
        else 
        {
            displayUserManagementError('Failed to find user: ' + response.message);
        }
    })
    .catch(error => 
    {
        console.error('Error removing user from event:', error);
        displayUserManagementError('Error removing user from event.');
    });
}

function displayUserManagementError(message)
{
    const errorMessageDiv = document.getElementById('manageUsersErrorMessage');
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block';
}

function resetUserManagementError()
{
    document.getElementById('manageUsersErrorMessage').textContent = '';
}

async function getCurrentUserRole() 
{
    const userID = localStorage.getItem('userID');
    const response = await sendRequest('/getUser', { userID: userID });
    if (response.result === "OK") 
    {
        const userRole = teamData._users[response.user._name];
        document.getElementById('currentUserRoleDisplay').textContent = `Your Role: ${userRole}`;
        adjustFormOptionsRole(userRole);
        return userRole;
    } 
    else 
    {
        // Handle error or invalid response
        console.error('Failed to retrieve user role');
        return null;
    }
}

function handleWebSocketMessage(data) 
{
    try
    {
        const message = JSON.parse(data);
        if (message.type === 'teamEventUpdate') 
        {
            getTeamEvents(teamData._joinCode)
            .then(teamEvents=> 
            {
                let currentPopupDateAttr = document.getElementById('popupHeader').getAttribute('data-date');
                let currentPopupDate = getDateFromAttribute(currentPopupDateAttr);
                let newDate = new Date(currentPopupDate);
                unrenderEvent();
                teamEvents.forEach(event => 
                {
                    let eventDate = new Date(event._startDate);
                    if (eventDate.toISOString().split('T')[0] === newDate.toISOString().split('T')[0]) 
                    {
                        renderEvent(event);
                    }
                });
            })
            .catch(error => 
            {
                console.error('Error initializing events:', error);
            });
        }
    } 
    catch (error) 
    {
        console.error("Error handling WebSocket message:", error);
    }
}