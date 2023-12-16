/**
 * TODO:
 * Add another sheet to control categories based off of titles in addition to members
 */ 

/**
 * Go over the constants here and adjust based off of your needs
 * Add trigger as explained in these instructions: https://help.funnel.io/en/articles/5556473-schedule-a-google-sheet-function-to-run-on-a-time-interval
 */

// To see how to know what your calendarID is https://docs.simplecalendar.io/find-google-calendar-id/
// If you just want to do your main calendar - the ID is just your email
const CALENDAR_IDS = ["ron@entitle.io"];


/** Create a spreadsheet with two columns, the first row being the title: A: domain	B: category
|   A          |     B      |
|--------------|------------|
| domain       | Category   |
| entitle.io   | important  |
| example2.com | personal   |
| example3.com | personal   |

Consider using Zapier to autopopulate this spreadsheet with data from a CRM and others
For example: https://zapier.com/apps/excel/integrations/hubspot/11155/add-new-hubspot-list-contacts-to-excel-spreadsheet-rows
 */

const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/19jjH5V4wJnO3GcaFIQENx1alLX01_DtWIsbEiIi7kWU/";

/* 
 Available colors:
 PALE_BLUE, PALE_GREEN, MAUVE, PALE_RED, YELLOW, ORANGE, CYAN, GRAY, BLUE, GREEN, RED
 Documentation: https://developers.google.com/apps-script/reference/calendar/event-color
 
 Catagories have to be lowercase
 "alone" is defined as any meeting for which you are the only member
 "internal" is defined as a meeting for which all members have emails with the same domain
 You can add and remove catagories, including the special ones mentioned above
 Adding a visibility argument will change the visibility seetings for all events in this category as well
 The visiblity options are DEFAULT, PUBLIC, PRIVATE as seen here : https://developers.google.com/apps-script/reference/calendar/visibility
 Events are categorised according to the priority of the category (in decending order)
 The order of the categories is important. If there are two members to events, and one is in the first category and another in the second, the event is catagoriesed by the first.
 */
// Define categories and their colors
const CATEGORY_TO_COLOR = {
  "personal": { color: CalendarApp.EventColor.MAUVE, visibility: CalendarApp.Visibility.PRIVATE },
  "investor": { color: CalendarApp.EventColor.YELLOW },
  "customer": { color: CalendarApp.EventColor.GREEN, visibility: CalendarApp.Visibility.PUBLIC },
  "internal": { color: CalendarApp.EventColor.ORANGE },
  "alone": { color: CalendarApp.EventColor.PALE_BLUE },
  "hr": { color: CalendarApp.EventColor.CYAN }
};

// If an event has already been colored then skip it's recoloring.
// Useful if you want to be able to manually change the color and not have overridden at the next run of the script.
// Also makes the script run faster for obvious reasons
const SKIP_ALREADY_COLORED = true;

// email domains to totally ignore, like notetakers and google resources
const FILTERED_DOMAINS = ["resource.calendar.google.com", "gong.io"];


function colorize(){
  const startDate = getDateOffset(-10);
  const endDate = getDateOffset(30); 
  processCalendarEvents(CALENDAR_IDS,startDate, endDate)
}

