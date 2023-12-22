const CATEGORY_ALONE = 'alone';
const CATEGORY_INTERNAL = 'internal';

/**
 * Main function to process calendar events and set colors based on specified conditions.
 * @param {string[]} calendarIds - Array of calendar IDs to process.
 * @param {Date} startDate - The start date for the events.
 * @param {Date} endDate - The end date for the events.
 */
function processCalendarEvents(calendarIds, startDate, endDate, spreadsheet_url) {
  const domainsAndCategories = getCategoriesFromSpreadsheet(spreadsheet_url, SHEET_INDEX.DOMAINS);
  const titlesAndCategories = getCategoriesFromSpreadsheet(spreadsheet_url, SHEET_INDEX.TITLES);

  calendarIds.forEach(calendarId => {
    processCalendar(calendarId, startDate, endDate, domainsAndCategories, titlesAndCategories);
  });
}

/**
 * Process events for a specific calendar.
 * @param {string} calendarId - The ID of the calendar.
 * @param {Date} startDate - The start date for the events.
 * @param {Date} endDate - The end date for the events.
 * @param {{domain: string, category: string}[]} domainsAndCategories - Array of flagged domains and categories.
 * @param {{title: string, category: string}[]} titlesAndCategories - Array of flagged titles and categories.
 */
function processCalendar(calendarId, startDate, endDate, domainsAndCategories, titlesAndCategories) {
  const calendar = CalendarApp.getCalendarById(calendarId);
  const events = calendar.getEvents(startDate, endDate);
  const defaultColor = getDefaultEventColorForCalendar(calendarId);
  events.forEach(calendarEvent => {
    if (SKIP_ALREADY_COLORED && (calendarEvent.getColor() != defaultColor)) {
    // Skip processing if the event has already been colored
    Logger.log(`Event: ${calendarEvent.getTitle()} skipped`);
    return;
  }
    processEvent(calendarEvent, domainsAndCategories, titlesAndCategories);
  });
}

/**
 * Process an individual calendar event.
 * Core logic -> Add more rules here
 * @param {GoogleAppsScript.Calendar.CalendarEvent} calendarEvent - The calendar event to process.
 * @param {{domain: string, category: string}[]} domainsAndCategories - Array of flagged domains and categories.
 * @param {{title: string, category: string}[]} titlesAndCategories - Array of flagged titles and categories.
 */
function processEvent(calendarEvent, domainsAndCategories, titlesAndCategories) {
  // Process based on titles - takes priority over everything else
  const titleCategory = processBasedOnTitles(calendarEvent, titlesAndCategories);
  if (titleCategory){
    Logger.log(`Date: ${calendarEvent.getStartTime().toLocaleDateString()}, Event: ${calendarEvent.getTitle()}, Category: ${titleCategory}, Rule: Title`);
    setColorAndVisibility(calendarEvent, titleCategory);
    return;
  }

  // Check if it's an internal meeting
  if (CATEGORY_TO_COLOR[CATEGORY_INTERNAL] && isInternalMeeting(calendarEvent, FILTERED_DOMAINS)) {
    
    Logger.log(`Date: ${calendarEvent.getStartTime().toLocaleDateString()}, Event: ${calendarEvent.getTitle()}, Category: ${CATEGORY_INTERNAL}, Rule: Internal`);
    setColorAndVisibility(calendarEvent, CATEGORY_INTERNAL);
    return;
  }

  // Check if it's an alone meeting
  if (CATEGORY_TO_COLOR[CATEGORY_ALONE] && (getFilteredGuestList(calendarEvent, FILTERED_DOMAINS).length <= 1)) {
    
    Logger.log(`Date: ${calendarEvent.getStartTime().toLocaleDateString()}, Event: ${calendarEvent.getTitle()}, Category: ${CATEGORY_ALONE}, Rule: Alone`);
    setColorAndVisibility(calendarEvent, CATEGORY_ALONE);
    return;
  }

  // Check domain match
  const domainCategory = processBasedOnDomains(calendarEvent, domainsAndCategories);
  if (domainCategory){
    Logger.log(`Date: ${calendarEvent.getStartTime().toLocaleDateString()}, Event: ${calendarEvent.getTitle()}, Category: ${domainCategory}, Rule: Domain`);
    setColorAndVisibility(calendarEvent, domainCategory);
    return;
  }

}

/**
 * Process a calendar event based on rules and categories.
 * @param {CalendarEvent} calendarEvent - The calendar event to process.
 * @param {{ rule: string, category: string }[]} titlesAndCategories - Array of rules and categories.
 * @returns {string | null} - The category of the matched rule, or null if no match is found.
 */
function processBasedOnTitles(calendarEvent, titlesAndCategories) {
  const eventTitle = calendarEvent.getTitle();

  // Iterate through the categories in the order they appear in CATEGORY_TO_COLOR
  for (const category of Object.keys(CATEGORY_TO_COLOR)) {
    // Check if the event title matches any flagged rule using regex
    const matchingRule = titlesAndCategories.find(({ rule }) =>
      new RegExp(rule).test(eventTitle)
    );

    if (matchingRule && matchingRule.category === category) {
      // Found a match, set the category and break out of the loop
      return category;
    }
  }

  // No match found
  return null;
}

/**
 * Process calendar event based on flagged domains or rules.
 * Use the order in which the categories are defined to choose priority.
 * @param {GoogleAppsScript.Calendar.CalendarEvent} calendarEvent - The calendar event to process.
 * @param {{ rule: string, category: string }[]} domainsAndCategories - Array of flagged domains or rules and categories.
 * @returns {string|null} - The category if found, otherwise null.
 */
function processBasedOnDomains(calendarEvent, domainsAndCategories) {
  const domainCategoryMap = domainsAndCategories.reduce((map, { rule, category }) => {
    map[rule] = category;
    return map;
  }, {});

  // Iterate through the categories in the order they appear in CATEGORY_TO_COLOR
  for (const category of Object.keys(CATEGORY_TO_COLOR)) {
    for (const email of calendarEvent.getGuestList(true).map(guest => guest.getEmail())) {
      const matchingDomain = Object.keys(domainCategoryMap).find(rule =>
        new RegExp(rule).test(email)
      );

      if (matchingDomain && domainCategoryMap[matchingDomain] === category) {
        // Found a match, set the category and break out of the loop
        return category;
      }
    }
  }
}


function filterDomains(emails, domainsToFilter) {
  return emails.filter(email => !domainsToFilter.some(domain => email.endsWith(`@${domain}`)));
}

/**
 * Gets the default event color of a specified calendar.
 * @param {string} calendarId - The ID of the calendar.
 * @return {string} - The default event color of the calendar.
 * TODO: There has to be a better way
 */
function getDefaultEventColorForCalendar(calendarId) {
  // Create a temporary event
  var tempEvent = CalendarApp.getCalendarById(calendarId).createEvent(
    'Get Default Color',
    new Date(),
    new Date(new Date().getTime() + 1 * 60 * 1000)
  );

  // Get the temporary event's color
  var defaultColor = tempEvent.getColor();

  // Delete the temporary event
  tempEvent.deleteEvent();

  return defaultColor;
}

/**
 * Get the guest list for a calendar event, including creators, and filter the emails based on specified domains.
 * @param {GoogleAppsScript.Calendar.CalendarEvent} calendarEvent - The calendar event.
 * @param {string[]} filteredDomains - Domains to filter from the guest list emails.
 * @returns {string[]} - Filtered guest list emails.
 */
function getFilteredGuestList(calendarEvent, domainsToFilter) {
  const guestList = calendarEvent.getGuestList(true);
  const creators = calendarEvent.getCreators();

  const guestListEmails = [...new Set([...guestList.flatMap(guest => guest.getEmail()), ...creators])];
  return filterDomains(guestListEmails, domainsToFilter);
}

/**
 * Check if the meeting is internal (no external guests).
 * @param {GoogleAppsScript.Calendar.CalendarEvent} calendarEvent - The event to check.
 * @param {string[]} domainsToFilter - Optional domains to filter from guest emails.
 * @returns {boolean} - True if all guests share the same domain, false otherwise.
 */
function isInternalMeeting(calendarEvent, domainsToFilter) {
  // Check if there are no external guests (all emails are from the same domain)
  const filteredGuestListEmails = getFilteredGuestList(calendarEvent, domainsToFilter);

  if (filteredGuestListEmails.length <= 1) {
    // An event with just one person is not internal
    return false;
  }

  const firstDomain = filteredGuestListEmails[0].split('@')[1];
  return filteredGuestListEmails.every(email => email.endsWith(`@${firstDomain}`));
}

/**
 * Get flagged domains and titles from the specified spreadsheet.
 * Assumes that the spreadsheet has two columns: A (title) and B (category).
 * Reads data from the second sheet.
 * @returns {{title: string, category: string}[]} - Array of flagged titles and categories.
 */
function getCategoriesFromSpreadsheet(spreadsheetUrl, sheetIndex) {
  try {
    const spreadsheet = SpreadsheetApp.openByUrl(spreadsheetUrl);
    const sheet = spreadsheet.getSheets()[sheetIndex]

    const values = sheet.getRange("A2:B").getValues();

    return values
      .filter(([rule, category]) => rule !== '' && category !== '')
      .map(([rule, category]) => ({ rule, category }));
  } catch (error) {
    console.error('Error fetching flagged domains and titles:', error);
    return [];
  }
}

/**
 * Set color and visibility for the calendar event and log the event details.
 * @param {GoogleAppsScript.Calendar.CalendarEvent} calendarEvent - The calendar event to process.
 * @param {string} category - The category for which to set the color and visibility.
 */
function setColorAndVisibility(calendarEvent, category) {
  const colorInfo = CATEGORY_TO_COLOR[category.toLowerCase()];
  
  // Check that the category was found
  if (colorInfo) {
    const color = typeof colorInfo === 'object' ? colorInfo.color : colorInfo;
    
    if (color) {
      calendarEvent.setColor(color);
    } else {
      Logger.log(`Invalid color value for category: ${category}`);
    }

    if (colorInfo.visibility) {
      calendarEvent.setVisibility(colorInfo.visibility);
    }
  } else {
    Logger.log(`Unknown category: ${category}`);
  }
}


/**
 * Calculates a date offset from the current date.
 * @param {number} offset - The number of days to offset from the current date.
 *                         Positive values represent future dates, and negative values
 *                         represent past dates.
 * @returns {Date} - A new Date object representing the calculated date after applying the offset.
 */
function getDateOffset(offset) {
  const now = new Date();
  return new Date(now.setDate(now.getDate() + offset));
}