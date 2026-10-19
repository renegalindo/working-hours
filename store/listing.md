# Chrome Web Store listing

Copy for each field in the developer dashboard. Keep it in step with the extension: if a feature changes, update this file and the live listing together.

## Store listing tab

**Name** (from `manifest.json`): Working Hours

**Summary** (from the manifest's `description`, 132 characters max): Shade the hours you're not working in Google Calendar.

**Category:** Productivity → Workflow & Planning

**Language:** English

**Description:**

```
Working Hours shades the hours you're not working in Google Calendar, so you can see your real availability.

• Set hours for each day of the week in half-hour steps, or mark a day off.
• Works in the Day, Week and custom-day views.
• Pick a color, a pattern, and an intensity to customize the look of your shade.
• Follows the time zone Calendar is showing.
• Toggle shading from the toolbar or with Alt+Shift+W.
• Settings sync across your Chrome browsers.

Private by design: no network requests, no analytics, no sign-in. It runs only on calendar.google.com, reads only the layout of the time grid, and never reads your events.

It's free and open source: github.com/renegalindo/working-hours
Enjoying it? buymeacoffee.com/renegalindo
```

**Homepage URL:** https://github.com/renegalindo/working-hours

**Support URL:** https://github.com/renegalindo/working-hours/issues

**Store icon:** `store/icon128.png`

**Screenshot:** `store/screenshot-1.png` (1280×800)

**Small promo tile:** `store/promo-small.png` (440×280)

## Privacy practices tab

**Single purpose:**

```
Shade non-working hours on the Google Calendar time grid, based on a weekly schedule the user sets.
```

**Permission justification, `storage`:**

```
Saves the user's settings: working hours for each weekday, shade colour, pattern, intensity, and whether shading is on. Settings are stored with chrome.storage.sync so they follow the user across their Chrome browsers.
```

**Host permission justification (`https://calendar.google.com/*`):**

```
The content script draws the shading inside Google Calendar's time grid. It reads only the grid's layout (each day column's date and height, and the page background colour) to place and tint the shading. It runs on no other site.
```

**Remote code:** No, I am not using remote code.

**Data usage:** Tick none of the data types. Tick all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/renegalindo/working-hours/blob/main/PRIVACY.md
