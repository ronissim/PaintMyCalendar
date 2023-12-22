// Go over the constants here and adjust based off of your needs


// If you just want to do your main calendar - the ID is just your email
const CALENDAR_IDS = ["me@example.com"];

// Create a spreadsheet with two columns, the first row being the title: A: domain	B: category
// You can also add a second sheet in the same spreadsheet to assign category based off of Event Title regex match: A: title.  b: category
const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1AAAAAAAAAAAAAAU/";

// Most likely doesn't need to be changed - the index of which sheet in the spreadsheet corresponds to which set of rules
const SHEET_INDEX = {
  DOMAINS: 0,
  TITLES: 1,
};

/* 
 Available colors:
 PALE_BLUE, PALE_GREEN, MAUVE, PALE_RED, YELLOW, ORANGE, CYAN, GRAY, BLUE, GREEN, RED
 
 Catagories have to be lowercase
 Adding a visibility argument will change the visibility seetings for all events in this category
 The visiblity options are DEFAULT, PUBLIC, PRIVATE
 
 Events are categorised according to the priority of the category (in decending order)
 */
const CATEGORY_TO_COLOR = {
  "personal": { color: CalendarApp.EventColor.MAUVE, visibility: CalendarApp.Visibility.PRIVATE },
  "investor": { color: CalendarApp.EventColor.YELLOW },
  "customer": { color: CalendarApp.EventColor.GREEN, visibility: CalendarApp.Visibility.PUBLIC },
  "internal": { color: CalendarApp.EventColor.ORANGE },
  "alone": { color: CalendarApp.EventColor.PALE_BLUE },
  "hr": { color: CalendarApp.EventColor.CYAN }
};

/*
If an event has already been colored then skip it's recoloring.
// Useful if you want to be able to manually change the color and not have overridden at the next run of the script.
Also makes the script run faster for obvious reasons
*/
const SKIP_ALREADY_COLORED = true;

// Email domains to totally ignore, like notetakers and google resources
const FILTERED_DOMAINS = ["resource.calendar.google.com", "gong.io"];


function colorize(){
  const startDate = getDateOffset(-7);
  const endDate = getDateOffset(30); 
  processCalendarEvents(CALENDAR_IDS,startDate, endDate, SPREADSHEET_URL)
}