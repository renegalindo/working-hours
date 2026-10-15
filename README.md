# Working Hours

A tiny Chrome extension that hatches out the hours you're **not** working in Google Calendar, so your real availability stands out at a glance.

![icon](icons/icon128.png)

## Features

- Per-day working hours on the hour or half hour; mark any day as off.
- Hatched shading on the Day, Week and custom-day views. Events stay crisp on top.
- Intensity slider, light and dark theme aware.
- Follows whatever timezone Calendar is displaying.
- On/off switch in the popup or **Alt+Shift+W**; the toolbar badge shows `OFF` while paused.
- Settings sync across your Chrome installs.

## Install

1. Download this repo (**Code → Download ZIP**, then unzip) or `git clone https://github.com/renegalindo/working-hours`.
2. Open `chrome://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick the `working-hours` folder.
4. Pin the extension, click it, and set your hours. Open or reload Google Calendar.

To update: pull or re-download, then hit the reload icon on the extension's card in `chrome://extensions`.

## Privacy

No network requests, no analytics, no Google sign-in. The extension only runs on `calendar.google.com` and stores your schedule in Chrome's own synced storage.

## How it works

Google Calendar tags each day column of its time grid with an internal date key. The extension finds those columns, works out the day of the week, and lays a hatched band over the off-hours behind the events. Google doesn't document this markup, so if a Calendar redesign breaks it, shading simply stops appearing; please open an issue.

## Development

Plain JavaScript, no build step. Icons are generated with `node scripts/make-icons.mjs`.

## License

MIT
