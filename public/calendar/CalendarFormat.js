/*
Name: Zach Rojas, Kaelin Wang Hu
Date: 11/21/2023
Last Edit: 11/27/2023
Desc: Handles the main calendar page and formatting
*/
// Global variable for the current date
let currentDate = new Date();

// When the DOM content is fully loaded, initialize the calendar
document.addEventListener('DOMContentLoaded', function ()
{
    if (window.location.hash === '#popup1')
    {
        window.location.href = 'index.html';
        return; // Exit the function to prevent further execution
    }
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

    // Set rows based on starting day, and total number of days
    let numRows = 5;

    if (startingDay === 5 && monthDays > 30 || startingDay === 6 && monthDays > 29) numRows = 6;
    let today = new Date(); // Today's date
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparison
    // Create rows for each week
    for (let i = 0; i < numRows; i++)
    {
        let row = document.createElement('tr');

        // Create cells for each day of the week
        for (let j = 0; j < 7; j++)
        {
            let cell = document.createElement('td');

            // Use an IIFE to capture the current state of 'dayOfMonth'
            (function(currentDay)
            {
                // Fill cells with the day number or leave them blank
                if ((i === 0 && j < startingDay) || currentDay > monthDays)
                {
                    cell.innerText = '';
                }
                else
                {
                    cell.classList.add('calendar-cell');
                    cell.innerText = currentDay;
                    cell.style.cursor = 'pointer';

                    cell.addEventListener('click', function() // Click on day
                    {
                        let clickedDate = new Date(date.getFullYear(), date.getMonth(), currentDay);
                        console.log(clickedDate);

                        let isToday = (clickedDate.toDateString() === today.toDateString());

                        // Emit custom event with the selected date
                        let event = new CustomEvent('dateSelected', { detail: { date: clickedDate, isToday: isToday } });
                        document.dispatchEvent(event);

                        window.location.href = '#popup1';
                    });

                    // Highlight the current day
                    let cellDate = new Date(date.getFullYear(), date.getMonth(), currentDay);
                    if (cellDate.getTime() === today.getTime())
                    {
                        cell.classList.add('selected-day');
                    }
                }
            })(dayOfMonth); // Pass 'dayOfMonth' to the IIFE

            if ((i === 0 && j < startingDay) || dayOfMonth > monthDays)
            {
                // Skip incrementing 'dayOfMonth' if the cell is empty
            }
            else
            {
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

document.querySelector('.popup .close').addEventListener('click', function()
{
    document.getElementById('popupHeader').innerHTML = '';
});

function addNavigationEventListeners()
{
    // Navigate to the previous month
    document.getElementById('prev-month').addEventListener('click', function()
    {
        changeMonth(-1);
    });

    // Navigate to the next month
    document.getElementById('next-month').addEventListener('click', function()
    {
        changeMonth(1);
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
