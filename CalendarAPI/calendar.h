#pragma once
#include <new>
#include <string>
#include <fstream>
#include <iostream>
#include <iomanip>
#include <cmath>
#include <ctime>
#include <algorithm>
#include <vector>
#include <map>

enum Day{Monday = 1, Tuesday = 2, Wednesday = 3, Thursday = 4, Friday = 5, Saturday = 6, Sunday = 7};

class Calendar
{
public:
    Calendar(unsigned long _time = 0);
    Calendar(unsigned char day = 0, unsigned char month = 0, unsigned int year = 1970);
    char GetYear() const;
    void SetYear();
    char GetMonth() const;
    void SetMonth();
    long GetTime() const;
    void SetTime();
    Day GetDay() const;
    void SetDate();
    bool IsLeapYear() const;
    void SetTime(unsigned long _time);
    void SyncCurrentTime();
private:
    unsigned long time;
    unsigned char day;
    unsigned char month;
    unsigned int year;
    Day day;
};