# From the PHP / AngularJS app to v2

This is the review of the original `htdocs/` code and what each finding became in the rewrite.

## ⚠️ Do this now, whatever else you do

`utils/php/config.php` and `configserver.php` contain **live database passwords** for the epizy/InfinityFree
MySQL servers. Change those passwords, and don't commit that folder anywhere public.

## Security

| Old behaviour | v2 |
|---|---|
| Every query pasted request values straight into SQL, so all endpoints were open to SQL injection | Drizzle ORM sends every value as a parameter, and inputs are validated on the server |
| "Login" was choosing a name from a dropdown, with the user id kept in the URL or a cookie | Google sign-in through Auth.js with signed, encrypted session cookies, plus an optional `ALLOWED_EMAILS` allow-list |
| Anyone could read anyone's data by changing `user_id`, and update/delete used only `id` | Every query is filtered by the signed-in user's id (`src/server/dal.ts`) |
| Anyone could add or delete users and types | No user management; each person manages only their own categories |
| Deleting a user left their expenses with no owner | Foreign keys: deleting a user deletes their data, and a category in use must be merged before it can be deleted |
| XSS: the URL `user-id` was written into the page with `innerHTML` | React escapes all output |
| `mysqli_error()` text was sent to the browser | The browser gets a generic message; details go to the server logs |
| Database credentials were in source files | Credentials live only in environment variables |

## Bugs fixed

| Old bug | v2 |
|---|---|
| Pagination never worked: inline `display:none`, no row limit, and the page count used every row | Paging happens on the server, 25 rows per page, with Previous/Next links you can bookmark |
| `convertDate()` assumed the browser shows dates as `dd/mm/yyyy` (Reports) and could move dates by a day across time zones | Dates are stored and compared as plain `YYYY-MM-DD` values, and "today" uses your chosen time zone |
| Data before 2021 was hidden because of a hardcoded `2021-01-01`, yet everything since 2021 was downloaded on every visit | Filtering happens in SQL, and only the requested page is sent |
| Requests weren't URL-encoded, so a type like `Food & Drinks` broke them | Forms submit through Server Actions, so there's no hand-built query string |
| A bad `=` formula saved `amount=null`; math.js was a 600 KB download | A small safe parser with an error message, and the server checks the value again |
| `addUsers` added the user twice; `addTypes` checked `$scope.type`, which doesn't exist; the duplicate check matched prefixes | Names are unique per user regardless of case, enforced by a database index |
| The download was a padded `.txt` file with `/` characters in its name | Real CSV that opens correctly in Excel (UTF-8), with a valid filename |
| Unticking "credit card" showed only non-card rows | "Card only" is a simple on/off filter |
| "Credit" was a magic type name meaning income, and "Total Savings" added up Credit | Categories have an explicit type: expense, income or savings |
| Trends used random colours on each load and lost "Others" types because of `JOIN type` | Each category keeps its own colour, chosen from a colour-blind-safe palette, and every category is included |
| `script.js` was pasted three times, there were malformed attributes and unclosed `<div>`s, and filters were copied across files | One component tree, with TypeScript and ESLint checks in place |
| Money was added up with `parseFloat` | Money is stored as `numeric(12,2)`, and sums are done in SQL |
| The footer showed © 2023 and an old `v1/` copy sat alongside the app | Removed |

## Behaviour changes to know about

- The old **Expenses** figure (non-card spending minus income) is replaced by clearer numbers: **Spent**, **on
  card**, **Income**, **Saved** and **Net** (= income − spent − saved).
- The **"Others"** free-text type is now **"+ New category…"** in the category picker. It creates a real category
  that you can rename or recolour later.
- The **type list is per user** instead of shared by everyone.
