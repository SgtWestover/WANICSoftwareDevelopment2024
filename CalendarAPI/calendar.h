#pragma once
#include <new>
#include <string>
#include <fstream>
#include <iostream>
#include <iomanip>
#include <cmath>
#include <ctime>
#include <chrono>
#include <algorithm>
#include <vector>
#include <map>

// Enum for days of the week
enum Day { Monday = 1, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday };

// Enum for months of the year
enum Month { January = 1, February, March, April, May, June, July, August, September, October, November, December };

// Global map of days in each month
static const std::map<Month, unsigned char> daysInMonth;

struct Date //Date structure for bundling
{
    unsigned char day; //day of the month
    Month month; //month of the year
    unsigned int year; //year

    Date(Day _day, Month _month, unsigned int _year) : day(_day), month(_month), year(_year) {}
};

class Calendar 
{
public:
    Calendar(unsigned long _time = 0); //Default constructor
    explicit Calendar(const Date& _date); //Constructor using Date struct

    // Getter and setter functions
    unsigned int GetYear() const;
    void SetYear(unsigned int _year);

    Month GetMonth() const;
    void SetMonth(Month _month);

    unsigned long GetTime() const;
    void SetTime(unsigned long _time);

    unsigned char GetDay() const;
    void SetDay(Day _day);

    Day GetDayOfWeek() const;
    void SetDayOfWeek();

    

    bool IsLeapYear() const; //Returns true if the current year is a leap year
    void SyncCurrentTime(); //Sets all variables to the current time

private:
    Date TimeToDate(unsigned long _time);
    Day DateToDay(const Date& _date);
    unsigned long time; //time in seconds since January 1 1970
    Date date; //Date structure including the day of the month, the month, and the year
    Day dayOfWeek; //day of the week
};