/*
Name: Zach Rojas, Kaelin Wang Hu
Date: 11/27/2023
Last Edit: 11/29/2023
Desc: Handles the formatting for the day schedule
*/


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
};

//Handles the line that follows the mouse to indicate the user what time they have selected
function lineFollow(event)
{
    let line = document.getElementById('line');    
    let Left = line.parentElement.getBoundingClientRect().left;
    line.style.left = `${event.clientX - Left - 1.75}px`; // mousePos

    //Gets the selected time based on mouse position
    let current = event.clientX - Left - 10;
    let max = parseInt(dayContainer.offsetWidth);
    let percent = Math.floor((current / max) * 100) + 1;
    let selectedHour = ((endTime - startTime) * percent / 100) + startTime;
    selectedHour = Math.floor(selectedHour * 4) / 4;
}

//Handles the text that shows what time the user is currently selecting
function lineText(event)
{

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
        headerText += " (Today)";
    }

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