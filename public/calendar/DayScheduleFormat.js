/*
Name: Zach Rojas, Kaelin Wang Hu
Date: 11/27/2023
Last Edit: 11/29/2023
Desc: Handles the formatting for the day schedule
*/

let currentTimeLine;
let currentTimeInterval;

//Generate things

document.addEventListener('DOMContentLoaded', function() 
{
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
        console.log("Window Resized");
    });

    // Add an event listener to the .day-container element
    dayContainer.addEventListener('mouseover', function () {
        // Select the .lineTimeText element and change its opacity
        let lineTimeText = document.getElementById('lineTimeText');
        lineTimeText.style.opacity = 1;
    });

    // Add an event listener to reset the opacity when not hovering
    dayContainer.addEventListener('mouseout', function () {
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
    //test
    document.getElementById('popupHeader').innerText = headerText;
    document.getElementById('popupHeader').setAttribute('data-date', newDate.toISOString().split('T')[0]);
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

    //createEvent(event);
    return;
}

function resetEventForm() 
{
    document.getElementById('eventForm').reset();
    document.getElementById('errorMessage').style.display = 'none'; // Hide error message if visible
}

function closeEventForm()
{
    document.getElementById('eventPopup').style.display = 'none';
}

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
    var currentDate = getDateFromAttribute(currentPopupDateAttr);
    var startDate = new Date(currentDate);
    var endDate = new Date(currentDate);

    // Parse hours and minutes
    var [startHours, startMinutes] = startTime.split(':').map(Number);
    var [endHours, endMinutes] = endTime.split(':').map(Number);

    startDate.setHours(startHours);
    startDate.setMinutes(startMinutes);
    endDate.setHours(endHours);
    endDate.setMinutes(endMinutes);
    console.log(startDate);

    // Validation
    if (startDate < endDate) 
    {
        // Valid input, create event and hide error message
        newEvent = new CalendarEvent(eventUsers, eventName, startDate, endDate, eventDesc);
        console.log(newEvent._startDate.getHours());
        sendEventToDatabase(newEvent);
        document.getElementById('eventPopup').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'none';
        renderEvent(newEvent);
        resetEventForm();
        
    } 
    else 
    {
        // Invalid input, show error message
        var errorMessageDiv = document.getElementById('errorMessage');
        errorMessageDiv.textContent = "Invalid start and end times";
        errorMessageDiv.style.display = 'block';
    }
});

// handles creating an event element in the schedule, and displaying it correctly in the html
// TODO: fix params
// TODO: store events related to day, and only display them when viewing that day
function renderEvent(CalendarEvent)
{    
    // create event element
    let eventElement = document.createElement("div");
    eventElement.classList.add('schedule-event');
    eventElement.innerHTML = CalendarEvent._name //TODO: make it the description or something we can add more later
    // set element width
    let hourLength = (CalendarEvent._endDate.getHours() * 60 + CalendarEvent._endDate.getMinutes()) - (CalendarEvent._startDate.getHours() * 60 + CalendarEvent._startDate.getMinutes());
    let eventWidth = ((hourLength * parseInt(dayContainer.offsetWidth)) / ((endTime - startTime) * 60))
    eventElement.style.width = `${eventWidth}px`
    // Gets the selected time based on mouse position
    selectedHour = (CalendarEvent.startDate.getHours() * 60 + CalendarEvent.startDate.getMinutes());    
    // set position
    eventElement.style.left = `${selectedHour * ((parseInt(dayContainer.offsetWidth)) / ((endTime - startTime) * 60))}px`;
    // let calendarEvent = new CalendarEvent(name, date, users, description, teams);

    // TODO: on click event

    dayContainer.appendChild(eventElement);   
}

function sendEventToDatabase(event)
{
    //database things
    sendRequest('/createEvent', event)
        .then(message => console.log(message.message))
        .catch(error => console.error('Error:', error));
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