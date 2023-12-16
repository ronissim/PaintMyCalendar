const CATEGORY_ALONE = 'alone';
const CATEGORY_INTERNAL = 'internal';

/**
 * Main function to process calendar events and set colors based on specified conditions.
 * @param {string[]} calendarIds - Array of calendar IDs to process.
 * @param {Date} startDate - The start date for the events.
 * @param {Date} endDate - The end date for the events.
 */
function processCalendarEvents(calendarIds, startDate, endDate) {
  const domainsAndCategories = getFlaggedDomainsAndColors();

  calendarIds.forEach(calendarId => {
    const calendar = CalendarApp.getCalendarById(calendarId);
    const events = calendar.getEvents(startDate, endDate);

    events.forEach(calendarEvent => {
      processCalendarEvent(calendarEvent, domainsAndCategories);
    });
  });
}

/**
 * Process each calendar event and set colors based on conditions.
 * @param {GoogleAppsScript.Calendar.CalendarEvent} calendarEvent - The calendar event to process.
 * @param {{domain: string, category: string}[]} domainsAndCategories - Array of flagged domains and categories.
 */
function processCalendarEvent(calendarEvent, domainsAndCategories) {
  if (SKIP_ALREADY_COLORED && hasEventBeenColored(calendarEvent)) {
    // Skip processing if the event has already been colored
    Logger.log(`Event: ${calendarEvent.getTitle()} skipped`);
    return;
  }

  const guestList = calendarEvent.getGuestList(true);
  const creators = calendarEvent.getCreators();

  const guestListEmails = [...new Set([...guestList.flatMap(guest => guest.getEmail()), ...creators])];
  const filteredGuestListEmails = filterDomains(guestListEmails, FILTERED_DOMAINS);


  if (filteredGuestListEmails.length <= 1 && CATEGORY_TO_COLOR[CATEGORY_ALONE]) {
    // Time block - no guests
    setColorAndVisibility(calendarEvent, CATEGORY_ALONE);
  } else if (CATEGORY_TO_COLOR[CATEGORY_INTERNAL] && isInternalMeeting(filteredGuestListEmails)) {
    // Internal meeting - no external guests
    setColorAndVisibility(calendarEvent, CATEGORY_INTERNAL);
  } else {
    // Process based on flagged domains and colors
    processBasedOnDomainsAndColors(calendarEvent, filteredGuestListEmails, domainsAndCategories);
  }
}

/**
 * Check if the event has already been colored in the past.
 * @param {GoogleAppsScript.Calendar.CalendarEvent} calendarEvent - The calendar event to check.
 * @returns {boolean} - True if the event has been colored, false otherwise.
 */
function hasEventBeenColored(calendarEvent) {
  // Check if the event's color is different from the default color
  return calendarEvent.getColor() !== CalendarApp.EventColor.DEFAULT;
}


/**
 * Check if the meeting is internal (no external guests).
 * @param {string[]} filteredGuestListEmails - Unified list of guest emails and creators.
 * @returns {boolean} - True if the meeting is internal, false otherwise.
 */
function isInternalMeeting(filteredGuestListEmails) {
  // Check if there are no external guests (all emails are from the same domain)
  const firstDomain = filteredGuestListEmails[0].split('@')[1];
  const isInsternal = filteredGuestListEmails.every(email => email.endsWith(`@${firstDomain}`));
  return isInsternal
}


/**
 * Process calendar event based on flagged domains and colors.
 * Use the order in which the categories are defined to chose priority.
 * Meaning, if someone in the invite is in the first category and someone else is in the second, the first category will be assigned
 * @param {GoogleAppsScript.Calendar.CalendarEvent} calendarEvent - The calendar event to process.
 * @param {string[]} filteredGuestListEmails - Unified list of guest emails and creators.
 * @param {{domain: string, category: string}[]} domainsAndCategories - Array of flagged domains and categories.
 */
function processBasedOnDomainsAndColors(calendarEvent, filteredGuestListEmails, domainsAndCategories) {
  const domainCategoryMap = domainsAndCategories.reduce((map, { domain, category }) => {
    map[domain] = category;
    return map;
  }, {});

  let selectedCategory = null;
  //debugging block to debug specific events
  if (calendarEvent.getTitle() == "Feedback Cycle Kickoff")
  {
    Logger.log("Event found")
  }
  // Iterate through the categories in the order they appear in CATEGORY_TO_COLOR
  for (const category of Object.keys(CATEGORY_TO_COLOR)) {
    for (const email of filteredGuestListEmails) {
      const matchingDomain = Object.keys(domainCategoryMap).find(domain => new RegExp(domain).test(email));

      if (matchingDomain && domainCategoryMap[matchingDomain] === category) {
        // Found a match, set the category and break out of the loop
        selectedCategory = category;
        break;
      }
    }

    if (selectedCategory) {
      // If a category is selected, break out of the outer loop
      break;
    }
  }

  if (selectedCategory) {
    setColorAndVisibility(calendarEvent, selectedCategory);
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
      Logger.log(`Date: ${calendarEvent.getStartTime().toLocaleDateString()}, Event: ${calendarEvent.getTitle()}, Category: ${category}`);
    } else {
      Logger.log(`Invalid color value for category: ${category}`);
    }

    if (colorInfo.visibility) {
      calendarEvent.setVisibility(colorInfo.visibility);
      //Logger.log(`Event: ${calendarEvent.getTitle()} set to ${colorInfo.visibility}`);
    }
  } else {
    Logger.log(`Unknown category: ${category}`);
  }
}

/**
 * Get flagged domains and colors from the specified spreadsheet.
 * @returns {{domain: string, category: string}[]} - Array of flagged domains and categories.
 */
function getFlaggedDomainsAndColors() {
  try {
    const spreadsheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    const values = spreadsheet.getRange("A2:B").getValues();

    return values
      .filter(([a, b]) => a !== '' && b !== '')
      .map(([a, b]) => ({ domain: a, category: b }));
  } catch (error) {
    console.error('Error fetching flagged domains and categories:', error);
    return [];
  }
}

/**
 * Gets a new date offset from the current date by a specified number of days.
 *
 * @param {number} offset - The number of days to offset from the current date.
 * @returns {Date} - A new date object representing the date offset by the specified number of days.
 */
function getDateOffset(offset) {
  const now = new Date();
  return new Date(now.setDate(now.getDate() + offset));
}

function filterDomains(emails, domainsToFilter) {
  return emails.filter(email => !domainsToFilter.some(domain => email.endsWith(`@${domain}`)));
}
