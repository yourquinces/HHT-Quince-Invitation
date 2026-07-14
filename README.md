# HHT Quinceañera Cruise Invitation

A personalized, shareable digital invitation for a quinceañera cruise, built for
**Happy Holidays Travel**. One page, mobile-first, deployable on Netlify.

Guests can:

- See the personalized invitation and cruise details
- View cabin pricing (links you provide)
- Send a short **interest form** so an HHT agent can follow up (Netlify Forms)
- Go straight to the **existing HHT reservation form** and **deposit link**
- Visit the family's **gift registry** (optional section)

There is **no database, no login, and no payment processing** in this project —
reservations and deposits always go through Happy Holidays Travel's existing links.

---

## 1. Quick start (local preview)

```bash
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173).

To create a production build:

```bash
npm run build     # output goes to dist/
```

---

## 2. Creating a new invitation (the only file you edit)

Everything on the page — names, dates, message, prices, links, contact info —
lives in **one file**:

```
src/data/invitation.ts
```

Open it, replace the sample values, save, and redeploy. Each setting has a
comment explaining what it does. Highlights:

| What | Setting |
|---|---|
| Quinceañera's name | `quinceanera.fullName`, `quinceanera.preferredName` |
| Main photo | `hero.image` |
| Family message | `invitationMessage`, `invitationSignature` |
| Sailing info | everything under `cruise` |
| Starting price | `pricing.startingPricePerPerson` |
| Pricing links | `pricing.fullPricingUrl`, `pricing.occupancyLinks` |
| **Reservation form link** | `reservationFormUrl` |
| **Deposit payment link** | `depositPaymentUrl` |
| Gift registry link | `registry.url` (or `registry.enabled: false` to hide) |
| Agent contact | everything under `agent` |
| Interest form | everything under `leadForm` |

**Any button whose URL is left as `""` is hidden automatically**, so you never
publish a button that goes nowhere.

> Also update the `<title>` and `<meta>` tags in `index.html` — see
> [Social sharing](#7-social-sharing-whatsapp--facebook-previews).

---

## 3. Replacing the main photo

The invitation starts with a ship image. To switch to a photo of the
quinceañera (mom can send any portrait photo):

1. Save the photo into the `public/images/` folder, e.g.
   `public/images/quinceanera.jpg`. A **vertical (portrait)** photo works best;
   the frame is 4:5 and crops automatically (`object-fit: cover`).
2. In `src/data/invitation.ts`, change:
   ```ts
   hero: {
     image: "/images/quinceanera.jpg",
     imageAlt: "Sofia in her quinceañera dress",
     imagePosition: "center top", // keeps her face in frame when cropped
   },
   ```
3. Redeploy.

Tips:

- If the crop cuts off the wrong part, adjust `imagePosition`
  (`"center"`, `"center top"`, `"50% 30%"`, etc.).
- Keep photos under ~500 KB for fast loading on phones. On a Mac, Preview →
  Tools → Adjust Size, or use https://squoosh.app.
- The smaller ship photo in the Cruise Details section is separate
  (`cruise.shipImage`) and **stays** even after the hero becomes her photo.
  Replace the placeholder with a real Icon of the Seas photo
  (`public/images/ship.jpg` → `cruise.shipImage: "/images/ship.jpg"`).

---

## 4. Connecting the existing HHT links

In `src/data/invitation.ts`:

```ts
// Replace this URL with the existing Happy Holidays Travel reservation form.
reservationFormUrl: "https://example.com/reservation-form",

// Replace this URL with the existing Happy Holidays Travel deposit-payment link.
depositPaymentUrl: "https://example.com/deposit",
```

Every "Reserve Your Cabin" button on the page uses `reservationFormUrl`, and
the "Pay Your Deposit" button uses `depositPaymentUrl`. The pricing buttons use
the URLs under `pricing`.

---

## 5. Deploying to Netlify

**Option A — connect a Git repo (recommended):**

1. Push this folder to a GitHub repository.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
3. Netlify reads `netlify.toml` automatically
   (build command `npm run build`, publish folder `dist`). Click **Deploy**.

Every future edit: change `src/data/invitation.ts`, commit, push — Netlify
redeploys automatically.

**Option B — drag and drop:**

1. Run `npm run build` locally.
2. In Netlify, drag the `dist/` folder onto **Deploys**.
   > Note: with drag-and-drop you must re-drag `dist/` after every change,
   > and Netlify Forms still works because the form is registered in the
   > built HTML.

To host several invitations (one per family), create one Netlify site per
family, each from its own copy of this project with its own
`src/data/invitation.ts`.

---

## 6. Lead email notifications (Netlify Forms)

Interest-form submissions are stored automatically in Netlify:
**Site → Forms → quince-cruise-interest**.

To have new leads emailed to the office or the assigned agent:

1. In Netlify, open your site → **Forms** (submit the form once after the
   first deploy if the form isn't listed yet).
2. Go to **Site configuration → Notifications → Form submission notifications**
   (on some plans: Forms → Settings → Notifications).
3. Click **Add notification → Email notification**.
4. Choose the form `quince-cruise-interest` and enter the email address that
   should receive leads (e.g. the assigned agent's email).
5. Save. Each submission now emails that address and stays in the dashboard.

No API keys or credentials are stored in this project.

**If you rename the form** (`leadForm.formName` in `src/data/invitation.ts`),
you must also change the matching `name="..."` and hidden `form-name` value in
the hidden form inside `index.html` — they must be identical, or Netlify will
reject submissions.

Spam protection: the form includes a Netlify honeypot field (`bot-field`).

---

## 7. Social sharing (WhatsApp / Facebook previews)

WhatsApp, Facebook, and iMessage build their link previews from the `<meta>`
tags in **`index.html`** (they can't run the app's JavaScript). When you create
a new invitation:

1. Open `index.html` and update the `<title>`, `description`, `og:title`,
   `og:description`, `og:image`, `og:url`, and the Twitter tags to match the
   new family.
2. `og:image` must be a **full https URL to a JPG or PNG** on your deployed
   site, e.g. `https://sofia-quince.netlify.app/images/social-share.jpg`.
   Save a nice share photo (1200×630 works best) as
   `public/images/social-share.jpg`.
3. After deploying, paste the link into WhatsApp to check the preview. If an
   old preview is cached, test with Facebook's tool:
   https://developers.facebook.com/tools/debug/

The browser-tab title also follows `social.title` in `src/data/invitation.ts`.

---

## 8. Project structure

```
index.html                  ← social meta tags + hidden Netlify form registration
netlify.toml                ← Netlify build config + SPA redirect
public/images/              ← photos (hero, ship, share image, agent)
src/data/invitation.ts      ← ⭐ ALL invitation content — the only file to edit
src/types/invitation.ts     ← TypeScript types for the config
src/components/             ← reusable page sections
src/App.tsx                 ← page assembly (section order)
```

Sections in order: Header → Hero → Personal Message → Cruise Details →
Celebration → What's Included → Pricing → Interest Form → Reservation →
Deposit Notice → Gift Registry → Contact → Footer.

---

## 9. What this project intentionally does NOT do

- No new reservation form (uses HHT's existing one via link)
- No payment processing (uses HHT's existing deposit link)
- No database, user accounts, or logins
- No Netlify Functions

The interest form is the only data collection, and it only goes to the
Netlify Forms dashboard + the notification email you configure.
