# Fitcore Technical Services L.L.C — website

Static site. Plain HTML, CSS and JavaScript, no build step and no dependencies.

**Two builds are included — use whichever suits you.**

1. **`fitcore-website.html`** — everything in one file: all five pages, the CSS,
   the JavaScript and the logo (as a data URI). Navigation runs on hash routes
   (`#home`, `#about`, `#services`, `#projects`, `#contact`), so every link works
   even when the file is opened on its own with no folder around it. Service
   tiles deep-link straight into an open panel, e.g. `#services:joinery`.
   Double-click it, email it, or drop it on any host.

2. **The folder** — the same site as five separate `.html` files with shared
   `assets/`. Better for SEO and for editing page by page. Upload the whole
   folder; `index.html` is the entry point.

Both share the same `style.css` and `main.js`. The script detects which build
it is running in and switches the router on or off automatically.

```
fitcore-website.html   ← one-file build, all pages linked
index.html        Home
about.html        About
services.html     Services (accordion scopes)
projects.html     Portfolio with filters + lightbox
contact.html      Contact details, enquiry form, map
assets/css/style.css
assets/js/main.js
assets/img/fitcore-logo.png   your logo
assets/img/favicon.png        FC monogram, generated from the logo
```

## Replace these before going live

| Where | Current value | Notes |
|---|---|---|
| Phone | `+971 50 322 8856` | Appears in the header drawer, footer, contact page and the home CTA. |
| WhatsApp | `+971 50 219 8856` | Used by every `wa.me` link, including the floating WhatsApp button. |
| Instagram / TikTok | `fitcore.ae` | Footer and about-section social rows. |
| Facebook / LinkedIn | `fitcoreservices` | Footer and about-section social rows. |
| Email | `Fitcore.tech.serv@gmail.com` | Appears in the header drawer, footer, contact page and the email icon. |
| Address | "Dubai, United Arab Emirates" | Add the full office address, then update the map `src` on `contact.html`. |
| Stats | 4 years / 50+ projects / 40+ staff / 12-month defects | Placeholders in the `.stats` block on `index.html` and `about.html`. Change the `data-count` attribute *and* the text inside it. |
| Trade licence no. | not shown | Worth adding to the footer for a UAE contractor. |

Fastest way to swap the phone number everywhere:

```bash
# call number
grep -rl "971503228856" . | xargs sed -i 's/971503228856/YOURNUMBER/g'
grep -rl "+971 50 322 8856" . | xargs sed -i 's/+971 50 322 8856/+971 XX XXX XXXX/g'
# whatsapp number
grep -rl "971502198856" . | xargs sed -i 's/971502198856/YOURNUMBER/g'
grep -rl "+971 50 219 8856" . | xargs sed -i 's/+971 50 219 8856/+971 XX XXX XXXX/g'
```

## Images

All project photos currently load straight from a remote CDN
(`mir-s3-cdn-cf.behance.net`). No Behance page is linked anywhere on the
site any more — this is only where the image files are still hosted.

That works, but hotlinking is fragile and slow. For production, download each
image, drop it in `assets/img/projects/`, and swap the URLs:

```bash
# example
sed -i 's|https://mir-s3-cdn-cf.behance.net/projects/404/|assets/img/projects/|g' *.html
```

Each project card carries both `src` and `data-full` — update both. If a remote
image fails to load, the card falls back to a blueprint-grid placeholder rather
than showing a broken icon.

## Contact form

Validation is client-side only; nothing is sent anywhere yet. Point it at a
service by adding an `action` to the `<form class="form">` tag in
`contact.html` and removing the `e.preventDefault()` branch in `main.js`, or use
a hosted endpoint:

- Formspree — `<form class="form" action="https://formspree.io/f/XXXX" method="POST">`
- Web3Forms, Getform, or your host's own PHP mailer

## Design notes

- **Palette** comes off the logo: charcoal `#0A0B0D` with the gold gradient
  `#8A661B → #F4DFA0 → #C9992E`, plus a bone `#EDEAE3` section for contrast.
- **Type**: Big Shoulders Display (condensed, echoes the tower in the logo mark),
  IBM Plex Sans for body, IBM Plex Mono for labels and data, Noto Kufi Arabic
  for the Arabic company name.
- **Signature element**: the dimension line — a hairline with tick ends and a
  centred mono label, borrowed from shop drawings. It reappears as the section
  divider, the drawing-sheet title blocks (`Sheet S-01 / Rev. 03`), and the
  blueprint grid over the hero.
- Numbered markers are used only where the content is genuinely a sequence
  (the five-stage method statement, the hero programme rail).

Responsive to 360px, keyboard focus is visible, and
`prefers-reduced-motion` disables the marquee, hero drift and scroll reveals.
