/*
Name: Zach Rojas, Kaelin Wang Hu
Date: 11/21/2023
Last Edit: 11/27/2023
Description: Handles the main calendar page and formatting
*/

// #region Global variables and listeners

/**
 * Description
 * @param   {type} name - parameter description
 * @returns {type}
 */

var currentDate = new Date(); // Global variable for the current date
var currentYearSearch = ''; //Global variable for the current searched year
var highlightedYearElement = null; //Global variable for the highlighted year element
var lastSelectedYear = null; //Global variable for the last selected year

/**
 * When the DOM content is fully loaded, initialize the calendar and dropdown menus
 * @returns {void}
 */
document.addEventListener('DOMContentLoaded', function ()
{
    if (window.location.hash === '#popup1') //if the user is in the popup upon reload, force them back to index.html
    {
        window.location.href = 'index.ejs';
        return;
    }
    addNavigationEventListeners(); //add the previous and next month button functionalities
    renderCalendar(currentDate); //renders the calendar with the current day
    createYearDropdown(1000, 9999) //create the year dropdown from 1000 to 9999
});

// #endregion Global variables and listeners

// #region Calendar functionality

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
    document.getElementById('month-button').innerText = new Intl.DateTimeFormat('en-US', { month: 'long'}).format(date);
    document.getElementById('year-button').innerText = new Intl.DateTimeFormat('en-US', { year: 'numeric'}).format(date);
    lastSelectedYear = document.getElementById('year-button').innerText;
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
    if (startingDay === 5 && monthDays > 30 || startingDay === 6 && monthDays > 29) numRows = 6; //if the month starts on a friday or saturday, there will be 6 rows
    let today = new Date(); // Today's date
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparisons later
    // Create rows for each week
    for (let i = 0; i < numRows; i++)
    {
        let row = document.createElement('tr');
        // Create cells for each day of the week
        for (let j = 0; j < 7; j++)
        {
            let cell = document.createElement('td');
            // Capture the current dayOfMonth state
            (function(currentDay)
            {
                // If the cell should be empty, clear it
                if ((i === 0 && j < startingDay) || currentDay > monthDays)
                {
                    cell.innerText = '';
                }
                else // Otherwise, fill cells with the clickable days
                {
                    cell.classList.add('calendar-cell');
                    cell.innerText = currentDay;
                    cell.style.cursor = 'pointer';
                    cell.addEventListener('click', function() // Click on day
                    {
                        let clickedDate = new Date(date.getFullYear(), date.getMonth(), currentDay);
                        let isToday = (clickedDate.toDateString() === today.toDateString()); //checks if the clicked cell is today's date
                        // Emit custom event with the selected date
                        let event = new CustomEvent('dateSelected', { detail: { date: clickedDate, isToday: isToday } });
                        document.dispatchEvent(event);
                        window.location.href = '#popup1'; //open the popup
                    });
                    // Highlight the current day
                    let cellDate = new Date(date.getFullYear(), date.getMonth(), currentDay);
                    if (cellDate.getTime() === today.getTime())
                    {
                        cell.classList.add('selected-day');
                    }
                }
            }) (dayOfMonth); // Pass 'dayOfMonth' to the IIFE
            // Check if the cell should contain a day of the month
            if (!(i === 0 && j < startingDay) && dayOfMonth <= monthDays)
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

/**
 * Adds the navigation event listeners that change the calendar (prev-month and next-month buttons currently)
 * @returns {void}
 */
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

/**
 * changes the month based on a delta integer
 * @param   {int} delta - the amount of months to change by
 * @returns {void}
 */
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
    //create the new date to render the calendar with
    currentDate = new Date(newYear, newMonth);
    renderCalendar(currentDate);
}

// #endregion Calendar functionality

// #region Dropdown functionality

/**
 * Closes the month and year dropdown menus if the user clicks outside of them
 * @param   {event} event - the event to process (a click outside of the dropdowns)
 * @returns {void}
 */
window.onclick = function(event) 
{
    //if the user clicks outside of the month dropdown or button, close it
    if (!event.target.matches('.month-dropbutton') && !event.target.closest('.month-dropdown')) 
    {
        var dropdowns = document.getElementsByClassName("month-dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) 
        {
            dropdowns[i].classList.remove('month-show');
        }
    }
    //if the user clicks outside of the year dropdown or button, close it
    if (!event.target.matches('.year-dropbutton') && !event.target.closest('.year-dropdown')) 
    {
        var dropdowns = document.getElementsByClassName("year-dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) 
        {
            dropdowns[i].classList.remove('year-show');
            resetYearSearch(); //also reset the search to the last selected year
        }
    }
};

// #region Month dropdown functionality

/**
 * Displays dropdown to select the month when the header is clicked
 * @returns {void}
 */
function monthHeaderClick()
{
    document.getElementById("month-dropdown").classList.toggle("month-show");
}

/**
 * Sets the month based on an int
 * @param   {int} month - the month to set it to (0 - 11)
 * @returns {void}
 */
function setMonth(month)
{
    // Adjust the month
    let newMonth = month
    let newYear = currentDate.getFullYear();
    // Create the new date and render the new calendar
    currentDate = new Date(newYear, newMonth);
    renderCalendar(currentDate);
    document.getElementById("month-dropdown").classList.remove("month-show"); //close the month dropdown
}

// #endregion Month dropdown functionality

// #region Year dropdown functionality

/**
 * Displays dropdown to select the year once the header is clicked
 * @returns {void}
 */
function yearHeaderClick()
{
    var dropdown = document.getElementById("year-dropdown");
    dropdown.classList.toggle("year-show");
    if (dropdown.classList.contains("year-show")) //if the year dropdown is shown, then add the listener for the year search
    {
        document.addEventListener('keyup', yearSearch);
    } 
    else //otherwise, if it's not shown, remove the listener and reset the search
    {
        document.removeEventListener('keyup', yearSearch);
        resetYearSearch();
    }
}

/**
 * Creates the elements in the year dropdown, starting from minBound to maxBound but ensures the current year is in view
 * @param   {int} minBound
 * @param   {int} maxBound
 * @returns {void}
 */
function createYearDropdown(minBound, maxBound) 
{
    let dropdownContent = document.getElementById('year-dropdown');
    let currentYear = new Date().getFullYear(); // Get the current year
    // Append years to the dropdown from minBound to maxBound
    for (let i = minBound; i <= maxBound; i++) 
    {
        let element = document.createElement('div');
        element.textContent = `${i}`;
        element.onclick = function () { setYear(i); }; //on click, go to that year
        dropdownContent.appendChild(element);
    }
    // Scroll to the last selected year, default to the current year
    let yearToScrollTo = lastSelectedYear !== null ? lastSelectedYear : currentYear;
    let yearElements = dropdownContent.getElementsByTagName('div');
    for (let i = 0; i < yearElements.length; i++) 
    {
        if (parseInt(yearElements[i].textContent, 10) === parseInt(yearToScrollTo)) // If a match is found, scroll the dropdown to show the current year
        {
            dropdownContent.scrollTop = yearElements[i].offsetTop;
            break;
        }
    }
}

/**
 * sets the month based on an int
 * @param   {int} year - the year to set it to
 * @returns {void}
 */
function setYear(year)
{
    // Adjust the month
    let newMonth = currentDate.getMonth();
    let newYear = year;
    //create the new date and render the new calendar
    currentDate = new Date(newYear, newMonth);
    renderCalendar(currentDate);
    resetYearSearch(); //reset the search
    document.getElementById("year-dropdown").classList.remove("year-show"); //close the year dropdown
}

/**
 * Searches for the year in the year dropdown with numbers
 * @param   {event} event - the event to process (for searching the years)
 * @returns {void}
 */
function yearSearch(event) 
{
    event.preventDefault(); // Prevent default action
    var yearDivs = document.getElementById("year-dropdown").getElementsByTagName('div');
    if (event.key === 'Shift' && highlightedYearElement) //if the user presses shift and there is a search result, select it
    {
            highlightedYearElement.click();
            return;
    }
    // If the input is not a number or Enter, ignore it
    if (!event.key.match(/[0-9]/)) return;
    // Update the current search string
    currentYearSearch += event.key;
    // Reset the highlight
    if (highlightedYearElement) highlightedYearElement.classList.remove('year-highlight');
    highlightedYearElement = null; // Reset the highlighted element
    // Perform the search
    var found = false;
    for (var i = 0; i < yearDivs.length; i++) 
    {
        if (yearDivs[i].textContent.startsWith(currentYearSearch)) // If the search string matches the year
        {
            found = true;
            highlightedYearElement = yearDivs[i]; // Update the highlighted element
            highlightedYearElement.classList.add('year-highlight'); // Add highlight class
            highlightedYearElement.scrollIntoView();
            break;
        }
    }
    // If the search string did not match any year, reset it
    if (!found) currentYearSearch = '';
}

/**
 * Resets the year search and its highlights
 * @returns {void}
 */
function resetYearSearch() 
{
    currentYearSearch = ''; // Reset the search query
    if (highlightedYearElement) 
    {
        highlightedYearElement.classList.remove('year-highlight'); // Remove highlight class
    }
    highlightedYearElement = null; // Reset the highlight variable
    scrollToSelectedYear(document.getElementById("year-dropdown")); //scroll into last selected year
}

/**
 * Scrolls in the year dropdown to the selected year (which is lastSelectedYear to keep user continuity)
 * @param   {element} dropdownContent - the year dropdown content to scroll in
 * @returns {void}
 */
function scrollToSelectedYear(dropdownContent) 
{
    var yearElements = dropdownContent.getElementsByTagName('div');
    let yearToScrollTo = lastSelectedYear !== null ? lastSelectedYear : currentYear;
    for (var i = 0; i < yearElements.length; i++) //loop through all the yearElements until we arrive at the last saved year
    {
        if (parseInt(yearElements[i].textContent, 10) === parseInt(yearToScrollTo)) 
        {
            dropdownContent.scrollTop = yearElements[i].offsetTop; //if the year is found, scroll to it
            break;
        }
    }
}

// #endregion Year dropdown functionality

// #endregion Dropdown functionality