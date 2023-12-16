# Calendar Event Colorizer

This Google Apps Script (`colorize.gs`) is designed to automatically colorize events on your Google Calendar based on predefined categories. The script uses specific criteria, such as domain matching and event visibility, to assign colors to events, providing a visual way to distinguish between different types of meetings.

## Getting Started

1. **Spreadsheet Setup:** Create a Google Spreadsheet with two columns: A for the domain and B for the category. The first row should be the title, as shown below:
   |   A          |     B      |
   |--------------|------------|
   | domain       | Category   |
   | entitle.io   | important  |
   | example2.com | personal   |
   | example3.com | personal   |



You can consider using Zapier to autopopulate this spreadsheet with data from your CRM or other sources [(example)](https://zapier.com/apps/excel/integrations/hubspot/11155/add-new-hubspot-list-contacts-to-excel-spreadsheet-rows).

2. **Script Configuration:**
- Adjust the constants in the script (`colorize.gs`) based on your needs.
- Access the script editor directly from [https://script.google.com/](https://script.google.com/).

3. **Calendar ID:**
- Find your Google Calendar ID by following [these instructions](https://docs.simplecalendar.io/find-google-calendar-id/). If you want to use your main calendar, the ID is your email.

4. **Category Definitions:**
- Define your categories and their associated colors in the `CATEGORY_TO_COLOR` constant. You can also specify visibility settings for each category.
### Additional Configuration Options:

- **Color options**
  - Chose from one of the following colors PALE_BLUE, PALE_GREEN, MAUVE, PALE_RED, YELLOW, ORANGE, CYAN, GRAY, BLUE, GREEN, RED as outlined in the [Documentation](https://developers.google.com/apps-script/reference/calendar/event-color)

- **Categories Must Be Lowercase:**
  - Ensure that all category names are lowercase for consistency and accurate matching.

- **Order and Priority:**
  - Events are categorized based on the priority of the category in descending order. If a participant belongs to multiple categories, the event is categorized according to the first applicable category.

- **Visibility Settings:**
  - Adding a visibility argument in the category configuration allows you to customize the visibility settings for all events in that category. Options include DEFAULT, PUBLIC, and PRIVATE. Refer to the [Google Apps Script documentation](https://developers.google.com/apps-script/reference/calendar/visibility) for details on visibility options.

- **Adding and Removing Categories:**
  - The script allows for the dynamic addition and removal of categories. Customize the categories according to your preferences and organizational needs. Make sure the correspond with the categories that you defined in the spreadsheet

- **Special Categories:**
  -  In addition to going through what's defined in the spreadsheet, the following categories are auto-deduced
  -  You don't have to use them and they can be removed
  -  "alone": You are the only member
  -  "internal": All members are in the same domain


## Setting Up and Running Google Apps Script

Follow these steps to set up and run a Google Apps Script:

1. **Open Google Apps Script Editor:**
- Go to [https://script.google.com/](https://script.google.com/) and create a new script.

2. **Copy and Paste the Script:**
- Copy the contents of `colorize.gs` and paste it into the script editor.

3. **Save the Script:**
- Save the script by clicking on the floppy disk icon or `File` > `Save`.

4. **Run the Script:**
- To run the script, click on the play button (▶️) in the toolbar.

5. **Authorize the Script:**
- If prompted, authorize the script to access your Google Calendar.

6. **Set Trigger (Optional):**
- To automate the script, set up a trigger by clicking on the clock icon in the toolbar and following [these instructions](https://developers.google.com/apps-script/guides/triggers) or [these instructions](https://help.funnel.io/en/articles/5556473-schedule-a-google-sheet-function-to-run-on-a-time-interval)
Have the script once every few hours.


## Future Enhancements

As part of ongoing improvement efforts, consider implementing the following enhancements to optimize the functionality and user experience of the Calendar Event Colorizer:

### 1. Category Control Based on Titles and Domains

To enhance categorization accuracy, consider adding an additional sheet to the spreadsheet that correlates meeting titles with associated domains. This extension will provide a more granular control mechanism, enabling the script to categorize events based on both titles and participants' email domains.

### 2. Auto-Categorization for Manually Colored Calendars

Implement a feature that recognizes manually colored calendars within Google Calendar. Once a calendar is manually colored, save the associated email domain into the script's rule book. Subsequently, any future invites from individuals with that domain will be automatically categorized according to the predefined rules, providing a seamless and personalized experience.

These future enhancements aim to refine the categorization process, increase accuracy, and adapt to user preferences. Continuous refinement ensures the Calendar Event Colorizer remains a valuable tool for efficiently managing and visualizing calendar events.

**Happy Coloring!**
