/*
Name: Zach Rojas, Kaelin Wang Hu
Date: 11/21/2023
Last Edit: 11/22/2023
Desc: Handles the main calendar page and formatting
*/
// Global variable for the current date
let currentDate = new Date();

// When the DOM content is fully loaded, initialize the calendar
document.addEventListener('DOMContentLoaded', function () 
{
    addNavigationEventListeners();
    renderCalendar(currentDate);
});

/**
 * Renders the calendar for a given date.
 * @param {Date} date - The date for which to render the calendar.
 */
function renderCalendar(date) 
{
    // Clear previous calendar content
    let calendarBody = document.getElementById('calendar-body');
    calendarBody.innerHTML = '';

    // Set the month and year in the header
    document.getElementById('month-year').innerText = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);

    // Get the first and last day of the month
    let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // Determine the starting day of the week and the total number of days in the month
    let startingDay = firstDay.getDay();
    let monthDays = lastDay.getDate();

    // Initialize the day counter
    let dayOfMonth = 1;

    // Create rows for each week
    for (let i = 0; i < 6; i++) 
    {
        let row = document.createElement('tr');

        // Create cells for each day of the week
        for (let j = 0; j < 7; j++) 
        {
            let cell = document.createElement('td');
            // Fill cells with the day number or leave them blank
            if ((i === 0 && j < startingDay) || dayOfMonth > monthDays) 
            {
                cell.innerText = '';
            } 
            else 
            {
                cell.classList.add('calendar-cell'); 
                cell.innerText = dayOfMonth;
                cell.style.cursor = 'pointer'; // Optional: change the cursor to indicate clickable
                cell.addEventListener('click', function() //Click on day
                {
                    window.location.href = '#popup1';
                    //change popup text based on day
                    switch (cell.cellIndex) 
                    {
                        case 0:
                            document.getElementById('popupHeader').innerHTML = "Sunday " + new Intl.DateTimeFormat('en-US', { month: 'long'}).format(date) + " " + cell.innerText;
                            break;
                        case 1:
                            document.getElementById('popupHeader').innerHTML = "Monday " + new Intl.DateTimeFormat('en-US', { month: 'long'}).format(date) + " " + cell.innerText;
                            break;
                        case 2:
                            document.getElementById('popupHeader').innerHTML = "Tuesday " + new Intl.DateTimeFormat('en-US', { month: 'long'}).format(date) + " " + cell.innerText;
                            break;
                        case 3:
                            document.getElementById('popupHeader').innerHTML = "Wednesday " + new Intl.DateTimeFormat('en-US', { month: 'long'}).format(date) + " " + cell.innerText;
                            break;
                        case 4:
                            document.getElementById('popupHeader').innerHTML = "Thursday " + new Intl.DateTimeFormat('en-US', { month: 'long'}).format(date) + " " + cell.innerText;
                            break;
                        case 5:
                            document.getElementById('popupHeader').innerHTML = "Friday " + new Intl.DateTimeFormat('en-US', { month: 'long'}).format(date) + " " + cell.innerText;
                            break;
                        case 6:
                            document.getElementById('popupHeader').innerHTML = "Saturday " + new Intl.DateTimeFormat('en-US', { month: 'long'}).format(date) + " " + cell.innerText;
                            break;
                        default:
                            break;
                    }
                    //document.getElementById('popupHeader').innerHTML = "Saturday " + new Intl.DateTimeFormat('en-US', { month: 'long'}).format(date) + " " + cell.innerText;
                });
                // Highlight the current day
                if (dayOfMonth === currentDate.getDate() &&
                    date.getMonth() === currentDate.getMonth() &&
                    date.getFullYear() === currentDate.getFullYear())    
                {
                    cell.classList.add('selected-day');
                }

                // Increment the day of the month
                dayOfMonth++;
            }

            // Append the cell to the row
            row.appendChild(cell);
        }

        // Append the row to the calendar body
        calendarBody.appendChild(row);
    }
}

function addNavigationEventListeners() 
{
    // Navigate to the previous month
    document.getElementById('prev-month').addEventListener('click', function() {
        changeMonth(-1);
    });

    // Navigate to the next month
    document.getElementById('next-month').addEventListener('click', function() {
        changeMonth(1);
    });

    // Navigate to the previous day
    document.getElementById('prev-day').addEventListener('click', function() {
        changeDay(-1);
    });

    // Navigate to the next day
    document.getElementById('next-day').addEventListener('click', function() {
        changeDay(1);
    });
}

//changes the month based on a delta int
function changeMonth(delta) 
{
    // Adjust the month
    let newMonth = currentDate.getMonth() + delta;
    let newYear = currentDate.getFullYear();
    
    //if the new month exceeds the months of the current year, switch to the new year,
    if (newMonth > 11) 
    {
        newMonth = 0;
        newYear++;
    } 
    else if (newMonth < 0) 
    {
        newMonth = 11;
        newYear--;
    }

    // Get the last day of the new month
    let lastDayNewMonth = new Date(newYear, newMonth + 1, 0).getDate();
    
    // If the current day is greater than the last day of the new month, adjust the day
    let newDay = currentDate.getDate();
    if (newDay > lastDayNewMonth) 
    {
        newDay = lastDayNewMonth; // Set to the last day of the new month
    }

    //create the new date and render the new calendar
    currentDate = new Date(newYear, newMonth, newDay);
    renderCalendar(currentDate);
}

//changes the day based on the delta
function changeDay(delta) 
{
    // Adjust the day
    let newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + delta);

    // Check for month or year change
    let dayDelta = newDate.getDate() - currentDate.getDate();
    if (dayDelta === delta) 
    {
        // If the day change is consistent with delta, no month or year rollover occurred
        currentDate = newDate;
    } 
    else 
    {
        // Month or year rollover occurred, adjust to the first or last day of the month
        if (delta > 0) 
        {
            // Moving forward, set to the first day of the next month
            currentDate = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
        } 
        else 
        {
            // Moving backward, set to the last day of the previous month
            currentDate = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);
        }
    }
    renderCalendar(currentDate);
}