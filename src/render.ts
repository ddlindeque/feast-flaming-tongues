import { event } from "./event.js";
import type { Venue } from "./private.js";
import { comingLabel, type Rsvp } from "./rsvp.js";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderLogin(code: string): string {
  const message =
    code === "1"
      ? "That password is not right."
      : code === "2"
        ? "Too many tries from this network. Wait 15 minutes."
        : code === "3"
          ? "That request was rejected."
          : "";
  const banner = message ? `<p class="banner banner-error" role="alert">${escapeHtml(message)}</p>` : "";

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Sign in · ${escapeHtml(event.title)}</title>
  <meta name="description" content="Sign in for invited guests.">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <main class="login-wrap">
    <form class="login-card" action="/login" method="post">
      <p class="eyebrow">Invited guests</p>
      <h1><span class="title-small">Feast of the</span><span class="title-flame">Flaming Tongues</span></h1>
      <p class="login-copy">The house, the guest list, and the plans stay behind this page. One password for the group.</p>
      ${banner}
      <input class="login-user" type="text" name="username" value="guest" autocomplete="username" tabindex="-1" aria-hidden="true">
      <label>
        <span>Password</span>
        <input type="password" name="password" required maxlength="200" autocomplete="current-password" spellcheck="false" autofocus>
      </label>
      <button class="button" type="submit">Sign in</button>
    </form>
  </main>
</body>
</html>`;
}

export function renderPage(options: { rsvps: Rsvp[]; joined: boolean; error: string; venue: Venue }): string {
  const { rsvps, joined, error, venue } = options;
  const categories = event.categories
    .map(
      (category) => `
        <li class="category">
          <span class="category-no">${category.number}</span>
          <div>
            <h3>${escapeHtml(category.name)}</h3>
            <p>${escapeHtml(category.summary)}</p>
          </div>
        </li>`,
    )
    .join("");

  const brewing = event.brewing
    .map(
      (item) => `
        <li>
          <strong>${escapeHtml(item.what)}</strong>
          <span>already claimed by ${escapeHtml(item.who)}</span>
        </li>`,
    )
    .join("");

  const keen = event.keen.map((name) => `<li>${escapeHtml(name)}</li>`).join("");

  const growing = event.growing
    .map(
      (step, index) => `
        <li>
          <span class="step-index">${String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>${escapeHtml(step.when)}</h3>
            <p>${escapeHtml(step.detail)}</p>
          </div>
        </li>`,
    )
    .join("");

  const open = event.open.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  const roster =
    rsvps.length === 0
      ? `<p class="empty">Nobody has used this page yet. The names above are from the group chat, not this form.</p>`
      : `<ul class="roster">
          ${rsvps
            .map(
              (entry) => `
            <li>
              <div class="roster-top">
                <strong>${escapeHtml(entry.name)}</strong>
                <span>${escapeHtml(comingLabel(entry.coming))}</span>
              </div>
              ${entry.bringing ? `<p>Bringing: ${escapeHtml(entry.bringing)}</p>` : ""}
              ${entry.note ? `<p class="roster-note">${escapeHtml(entry.note)}</p>` : ""}
            </li>`,
            )
            .join("")}
        </ul>`;

  const banner = joined
    ? `<p class="banner" role="status">You are on the list. Putting the same name in again updates your line.</p>`
    : error
      ? `<p class="banner banner-error" role="alert">${escapeHtml(error)}</p>`
      : "";

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${escapeHtml(event.title)} ${event.year}</title>
  <meta name="description" content="Private page for invited guests.">
  <meta property="og:title" content="${escapeHtml(event.title)} ${event.year}">
  <meta property="og:description" content="Private page for invited guests.">
  <meta property="og:type" content="website">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <a class="skip" href="#content">Skip to the feast</a>
  <header class="top">
    <a class="brand" href="#top">Feast <em>2027</em></a>
    <nav aria-label="On this page">
      <a href="#place">The house</a>
      <a href="#categories">Categories</a>
      <a href="#take-part">Take part</a>
      <a href="#growing">Growing</a>
      <a href="#list">The list</a>
    </nav>
    <a class="top-date" href="#date">28 Aug 2027</a>
    <form action="/logout" method="post"><button class="logout" type="submit">Log out</button></form>
  </header>

  <main id="content">
    <section class="hero" id="top">
      <div class="hero-copy">
        <p class="eyebrow">A group chilli festival</p>
        <h1>
          <span class="title-small">Feast of the</span>
          <span class="title-flame">Flaming Tongues</span>
        </h1>
        <p class="lede">${escapeHtml(event.lede)}</p>
        <div class="hero-actions">
          <a class="button" href="#list">Put your name down</a>
          <a class="text-link" href="#categories">See the five categories</a>
        </div>
      </div>
      <aside class="ticket" id="date" aria-label="Proposed date">
        <p class="ticket-kicker">Date on the table</p>
        <p class="ticket-day">${event.proposed.weekday}</p>
        <p class="ticket-num">${event.proposed.day}</p>
        <p class="ticket-month">${event.proposed.month} ${event.proposed.year}</p>
        <p class="ticket-context">${escapeHtml(event.proposed.context)}</p>
        <p class="ticket-status">${escapeHtml(event.proposed.status)}</p>
        <time datetime="${event.proposed.iso}">28 August 2027</time>
        <div class="ticket-place" id="place">
          <p class="ticket-kicker">At the house</p>
          <p class="hosts">${escapeHtml(venue.hosts)}</p>
          <address>
            ${venue.lines.map((line) => escapeHtml(line)).join("<br>")}
          </address>
          <a class="maps-link" href="${escapeHtml(venue.maps)}" rel="noopener noreferrer" referrerpolicy="no-referrer">Open in Maps</a>
        </div>
      </aside>
    </section>

    <section class="band band-paper" id="idea">
      <div class="band-intro">
        <p class="kicker">The idea</p>
        <h2>Bring heat, or bring an opinion.</h2>
      </div>
      <div class="prose">
        <p>${escapeHtml(event.invitation)}</p>
        <p>The group opened the plan in August 2026 so anyone who wants fruit on the day has a full season to grow it. The feast itself is the following summer.</p>
      </div>
    </section>

    <section class="band band-paper band-tight" id="categories">
      <div class="band-intro">
        <p class="kicker">How the day is scored</p>
        <h2>Five ways to win. One of them is optional.</h2>
      </div>
      <ol class="categories">${categories}</ol>
    </section>

    <section class="band band-soot" id="take-part">
      <div class="split">
        <div>
          <p class="kicker kicker-light">Already on the boil</p>
          <h2>Two drinks have owners. The rest is open.</h2>
          <p class="light-copy">These came up in the first evening of messages. They are claims, not a menu, and they do not close the wildcard category.</p>
          <ul class="brewing">${brewing}</ul>
        </div>
        <div>
          <p class="kicker kicker-light">Still to decide</p>
          <h2>Still open.</h2>
          <ul class="open">${open}</ul>
        </div>
      </div>
    </section>

    <section class="band band-paper" id="growing">
      <div class="band-intro">
        <p class="kicker">From seed to feast</p>
        <h2>Get the chillies growing.</h2>
      </div>
      <ol class="timeline">${growing}</ol>
    </section>

    <section class="band band-paper band-tight" id="list">
      <div class="band-intro">
        <p class="kicker">Who is already keen</p>
        <h2>Said yes in the group chat.</h2>
        <p class="aside-note">First names only. Ronan counted his household in. Sharon is coming to the feast and leaving the eating challenge. Wes is on chilli gin.</p>
      </div>
      <ul class="keen">${keen}</ul>

      <div class="rsvp-layout">
        <form class="rsvp" id="rsvp-form" action="/rsvp" method="post">
          <h2>Put your name on this page.</h2>
          <p>This list is stored on the machine running the site. It does not post back to WhatsApp.</p>
          ${banner}
          <label>
            <span>Name</span>
            <input name="name" required minlength="2" maxlength="80" autocomplete="name" placeholder="The name the group uses for you">
          </label>
          <fieldset>
            <legend>On the day</legend>
            <label class="choice"><input type="radio" name="coming" value="yes" required> Coming</label>
            <label class="choice"><input type="radio" name="coming" value="maybe"> Maybe</label>
            <label class="choice"><input type="radio" name="coming" value="tasting"> I’ll taste and vote, not compete</label>
          </fieldset>
          <label>
            <span>What you might bring</span>
            <input name="bringing" maxlength="140" placeholder="A plant, a jar, a drink, or just an appetite">
          </label>
          <label>
            <span>Note</span>
            <textarea name="note" maxlength="400" rows="3" placeholder="A date clash, a category you want, a question"></textarea>
          </label>
          <button class="button" type="submit">Put my name down</button>
        </form>
        <div class="site-list" id="site-list">
          <h2>Names added here</h2>
          ${roster}
        </div>
      </div>
    </section>
  </main>

  <footer class="foot">
    <p>${escapeHtml(event.title)}. A private group feast, not a ticketed festival.</p>
    <p>At ${escapeHtml(venue.hosts)}, ${escapeHtml(venue.lines.join(", "))}. The hour and the date are still open.</p>
  </footer>
  <script src="/site.js" defer></script>
</body>
</html>`;
}
