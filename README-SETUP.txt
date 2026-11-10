# TBARC Biodiversity Quiz — quize.tbarc.in

## Files
- `index.html` — responsive public quiz page
- `Code.gs` — Google Apps Script backend
- `README-SETUP.txt` — deployment instructions

## Configured quiz
- English
- 20 questions per attempt, randomly selected from a 30-question bank
- Question order and answer-option order are shuffled
- Server-side scoring (answer key is not exposed in the webpage)
- Automatic score email
- PDF certificate attached for scores of 70% or higher (14/20)
- Google Sheets response log

## A. Create the Google Sheet and Apps Script
1. Create a new Google Sheet named `TBARC Biodiversity Quiz Responses`.
2. Open **Extensions → Apps Script**.
3. Replace the contents of `Code.gs` with the supplied `Code.gs` and save.

## B. Deploy Apps Script
1. Select **Deploy → New deployment**.
2. Choose **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone**.
5. Click Deploy and complete the Google authorisation prompts.
6. Copy the web app URL ending in `/exec`.

The first submission may require permission to use Google Sheets, Google Docs, Google Drive and email. Authorise using the Google account that owns the script.

## C. Connect the webpage
In `index.html`, find:
`const TBARC_WEB_APP_URL = "PASTE_DEPLOYED_APPS_SCRIPT_URL_HERE";`

Replace the placeholder with the deployed `/exec` URL. Keep the quotation marks.

## D. Configure the subdomain
Recommended GitHub Pages repository: `tbarc-quiz` (or another name you prefer).

1. Create a new public GitHub repository.
2. Upload `index.html` and an `assets` folder containing:
   - `assets/logo.png` — TBARC logo
   - `assets/favicon.png` — favicon
3. Add a file named `CNAME` in the repository root containing exactly:
   `quize.tbarc.in`
4. In repository **Settings → Pages**, enable deployment from the `main` branch and root folder.
5. In GoDaddy DNS for `tbarc.in`, add:
   - Type: `CNAME`
   - Name/Host: `quize`
   - Value/Points to: `unaisbot.github.io`
   - TTL: Default
6. Wait for DNS propagation. In GitHub Pages settings, add custom domain `quize.tbarc.in`, save, and enable **Enforce HTTPS** when available.

If GitHub Pages asks you to verify the domain, follow its verification process before connecting.

## Certificate threshold
In `Code.gs`, change `CERTIFICATE_THRESHOLD: 70` if you want another qualifying score. At 70%, participants need at least 14 correct answers out of 20.

## Test before public launch
1. Open the published quiz page and submit a test using your own email.
2. Confirm the score appears in the `Quiz Responses` sheet.
3. Confirm the score email arrives.
4. Test a qualifying score to confirm the PDF certificate is attached.
5. Check the spam folder if the email does not appear.

## Important
- Google Apps Script quotas for email and execution apply.
- The quiz is public; anyone can submit. Monitor the response sheet and email usage.
- The script checks submitted question IDs and scores on the server. The question bank should be treated as the controlled set; update the matching `ANSWER_KEY` in `Code.gs` whenever questions or correct answers change.
- This first certificate is a clean basic PDF. A branded certificate layout using the TBARC logo and QR verification can be added in a later revision.
