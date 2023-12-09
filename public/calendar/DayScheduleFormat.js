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

//i have to do it in here because the fucking day container is null otherwise and is created here. WHY?
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

    createEvent(event);
    return;
}

document.getElementById('eventForm').addEventListener('submit', function(e) 
{
    e.preventDefault();
    // Get form values
    var eventName = document.getElementById('eventName').value;
    var startTime = parseFloat(document.getElementById('startTime').value);
    var endTime = parseFloat(document.getElementById('endTime').value);
    var eventDesc = document.getElementById('eventDesc').value;

    // Validation
    if (startTime >= 0 && startTime < 24 && endTime > 0 && endTime <= 24 && startTime < endTime) 
    {
        // Get current selected date
        var currentPopupDateAttr = document.getElementById('popupHeader').getAttribute('data-date');
        var currentDate = getDateFromAttribute(currentPopupDateAttr);

        // Create event
        createEvent(e, eventName, new Date(currentDate.setHours(startTime)), new Date(currentDate.setHours(endTime)), null, eventDesc);

        // Close popup
        document.getElementById('eventPopup').style.display = 'none';
    } else {
        alert("Invalid start or end time.");
    }
});

//handles creating an event in the schedule, and displaying it correctly
function createEvent(event, name, startDate, endDate, users, description = null, teams = null)
{
    console.log("Created an event yipee");
    //html stuff first bcs idk how anything else works
    
    //create event element
    let eventElement = document.createElement("div");
    eventElement.classList.add('schedule-event');
    eventElement.innerHTML = ""//make it the description or smth we can add more later
    //set element width
    let eventWidth = ((parseInt(dayContainer.offsetWidth)) / (endTime - startTime))//TODO: make this mean something 
    eventElement.style.width = `${eventWidth}px`
    //set position

    let Left = line.parentElement.getBoundingClientRect().left;

    //Gets the selected time based on mouse position
    let current = event.clientX - Left;
    let max = parseInt(dayContainer.offsetWidth);
    let percent = Math.floor((current / max) * 100) + 1;
    let selectedHour = ((endTime - startTime) * percent / 100) + startTime;
    selectedHour = Math.floor(selectedHour * 4) / 4;

    
    eventElement.style.left = `${selectedHour * ((parseInt(dayContainer.offsetWidth)) / (endTime - startTime)) + 1.5}px`;
         
    // let calendarEvent = new CalendarEvent(name, date, users, description, teams);
    // send the 
    dayContainer.appendChild(eventElement);
    
}

