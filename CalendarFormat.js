

document.addEventListener('DOMContentLoaded', function () {
    // Get the current date
    let currentDate = new Date();

    // Set the month and year in the header
    document.getElementById('month-year').innerText = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);

    // Get the first day of the month and the last day of the month
    let firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    let lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Get the starting day of the week and the number of days in the month
    let startingDay = firstDay.getDay();
    let monthDays = lastDay.getDate();

    // Get the table body element
    let calendarBody = document.getElementById('calendar-body');

    // Counter for the day of the month
    let dayOfMonth = 1;

    // Loop through the rows (weeks) of the calendar
    for (let i = 0; i < 6; i++) 
    {
        // Create a table row element
        let row = document.createElement('tr');

        // Loop through the columns (days) of the week
        for (let j = 0; j < 7; j++)
        {
            // Create a table cell element
            let cell = document.createElement('td');

            // Check if the current cell is before the starting day or after the last day
            if ((i === 0 && j < startingDay) || dayOfMonth > monthDays) 
            {
                cell.innerText = ''; // Empty cell
            } 
            else 
            {
                // Add the day of the month to the cell
                cell.innerText = dayOfMonth;

                // Add a class for the current day
                if (dayOfMonth === currentDate.getDate() && currentDate.getMonth() === firstDay.getMonth()) 
                {
                    cell.classList.add('today');
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
});