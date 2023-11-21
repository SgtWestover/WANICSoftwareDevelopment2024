#include "calendar.h"

//TODO: SYNC THE TIME FOR SETTERS

// Define the map of days in each month (leap year handling not included)
const std::map<Month, unsigned char> daysInMonth = 
{
    {January, 31}, {February, 28}, {March, 31}, {April, 30}, {May, 31}, {June, 30},
    {July, 31}, {August, 31}, {September, 30}, {October, 31}, {November, 30}, {December, 31}
};

// Constructors
Calendar::Calendar(unsigned long _time) : time(_time) 
{

}

Calendar::Calendar(const Date& _date) : date(_date) 
{

}

// Getters and Setters
unsigned int Calendar::GetYear() const 
{
    return date.year;
}

void Calendar::SetYear(unsigned int _year) 
{
    date.year = _year;
}

Month Calendar::GetMonth() const {
    return date.month;
}

void Calendar::SetMonth(Month _month) 
{
    date.month = _month;
}

unsigned long Calendar::GetTime() const 
{
    return time;
}

void Calendar::SetTime(unsigned long _time) 
{
    time = _time;
}

unsigned char Calendar::GetDay() const 
{
    return date.day;
}

void Calendar::SetDay(Day _day) 
{
    date.day = _day;
}

Day Calendar::GetDayOfWeek() const 
{
    return dayOfWeek;
}

void Calendar::SetDayOfWeek() 
{

}

bool Calendar::IsLeapYear() const 
{
    // Leap year calculation (divisible by four, not on end-of-century years except when divisible by 400)
    return (date.year % 4 == 0) && (date.year % 100 != 0 || date.year % 400 == 0);
}

void Calendar::SyncCurrentTime() {
    // Use std::chrono or similar to get the current time
    // Convert it to Date and Day and update all relevant members
    using namespace std::chrono;
    system_clock::time_point now = system_clock::now();
    time_t tt = system_clock::to_time_t(now);
    tm local_tm = *localtime(&tt);

    date.year = 1900 + local_tm.tm_year;
    date.month = static_cast<Month>(1 + local_tm.tm_mon);
    date.day = static_cast<unsigned char>(local_tm.tm_mday);
    dayOfWeek = static_cast<Day>(1 + local_tm.tm_wday);
    // Update time based on the current timestamp
    time = static_cast<unsigned long>(tt);
}

Date Calendar::TimeToDate(unsigned long _time)
{
    // Convert the time to a tm struct
    time_t rawTime = static_cast<time_t>(_time);
    //TODO: talk about this
    tm *timeInfo = gmtime(&rawTime); //uses GMT for global

    // Extract year, month, and day
    unsigned int year = 1900 + timeInfo->tm_year; // tm_year is years since 1900
    Month month = static_cast<Month>(1 + timeInfo->tm_mon); // tm_mon is months since January (0-11), add offset for 1 - 12
    unsigned char day = static_cast<unsigned char>(timeInfo->tm_mday); // tm_mday is day of the month (1-31)

    return Date(day, month, year);
}
