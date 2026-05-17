import { isSupabaseConfigured, supabase } from "./src/supabase.js";
import adoptionMeetUrl from "./assets/adoption-meet.png";
import familyWalkUrl from "./assets/family-walk.png";
import rescuePortraitUrl from "./assets/rescue-portrait.png";

const storageKeys = {
  rsvps: "fdld:rsvps",
  sponsors: "fdld:sponsors",
  teams: "fdld:teams",
  gallery: "fdld:gallery",
};

const eventDetails = {
  title: "FindADog at Lost Dog",
  location: "Lost Dog Wash Trailhead, 12601 N. 124th St., Scottsdale, AZ 85259",
  start: "20261010T150000Z",
  end: "20261010T190000Z",
  localStart: new Date("2026-10-10T08:00:00-07:00"),
  description:
    "Join FDLD for No Paw Left Behind, a dog charity walk and adoption event at Lost Dog Trail in Scottsdale.",
};

const adoptionGoal = 25;
const baselineAdoptionConversations = 17;

const bundledDogImages = {
  "assets/adoption-meet.png": adoptionMeetUrl,
  "adoption-meet.png": adoptionMeetUrl,
  "assets/family-walk.png": familyWalkUrl,
  "family-walk.png": familyWalkUrl,
  "assets/rescue-portrait.png": rescuePortraitUrl,
  "rescue-portrait.png": rescuePortraitUrl,
};

const defaultDogs = [
  {
    name: "Sunny",
    age_months: 24,
    type: "medium",
    status: "available",
    breed: "Australian cattle dog mix",
    temperament_tags: ["easy leash", "people-curious", "patient home"],
    image_url: "assets/rescue-portrait.png",
    bio: "Easy on leash, people-curious, and happiest with a patient walking partner.",
    featured: true,
  },
  {
    name: "Maple",
    age_months: 48,
    type: "large",
    status: "available",
    breed: "Shepherd mix",
    temperament_tags: ["calm", "loyal", "quiet mornings"],
    image_url: "assets/adoption-meet.png",
    bio: "Soft-eyed and steady, Maple is ready for quiet mornings and loyal routines.",
    featured: true,
  },
  {
    name: "Rio",
    age_months: 12,
    type: "medium",
    status: "available",
    breed: "Retriever mix",
    temperament_tags: ["bouncy", "treat-motivated", "quick learner"],
    image_url: "assets/family-walk.png",
    bio: "Bright, bouncy, and treat-motivated, Rio is learning how good home can feel.",
    featured: true,
  },
  {
    name: "Poppy",
    age_months: 8,
    type: "small",
    status: "available",
    breed: "Terrier mix",
    temperament_tags: ["lap naps", "friendly", "short walks"],
    image_url: "assets/rescue-portrait.png",
    bio: "A compact little shadow who loves greetings, short walks, and lap naps.",
    featured: false,
  },
  {
    name: "Cedar",
    age_months: 84,
    type: "senior",
    status: "available",
    breed: "Lab mix",
    temperament_tags: ["mellow", "great manners", "slow strolls"],
    image_url: "assets/adoption-meet.png",
    bio: "A mellow senior with excellent manners and a soft spot for slow trail strolls.",
    featured: false,
  },
  {
    name: "Juniper",
    age_months: 36,
    type: "large",
    status: "adopted",
    breed: "Husky mix",
    temperament_tags: ["adopted", "trail buddy", "weekend hiker"],
    image_url: "assets/family-walk.png",
    bio: "Juniper found a family through an FDLD meet-and-greet and now hikes every weekend.",
    featured: false,
  },
  {
    name: "Scout",
    age_months: 18,
    type: "small",
    status: "adopted",
    breed: "Chihuahua mix",
    temperament_tags: ["adopted", "bright", "small home"],
    image_url: "assets/rescue-portrait.png",
    bio: "Scout's adoption story is a reminder that the right walk can start a new life.",
    featured: false,
  },
  {
    name: "Saguaro",
    age_months: 60,
    type: "large",
    status: "available",
    breed: "Boxer mix",
    temperament_tags: ["steady", "confident handler", "outdoorsy"],
    image_url: "assets/adoption-meet.png",
    bio: "Steady, loyal, and happiest beside confident handlers who love the outdoors.",
    featured: false,
  },
];

let dogRecords = [...defaultDogs];
let galleryRecords = [];
let isAdminLoggedIn = false;

const form = document.querySelector(".rsvp-form");
const status = document.querySelector(".form-status");
const sponsorForm = document.querySelector(".sponsor-form");
const sponsorStatus = document.querySelector(".sponsor-status");
const teamForm = document.querySelector(".team-form");
const teamStatus = document.querySelector(".team-status");
const dogDirectory = document.querySelector(".dog-directory");
const heroDogStrip = document.querySelector(".hero-dog-strip");
const galleryUploadForm = document.querySelector(".gallery-upload-form");
const uploadedGallery = document.querySelector(".uploaded-gallery");
const adminLogin = document.querySelector(".admin-login");
const adminDashboard = document.querySelector(".admin-dashboard");
const adminLoginStatus = document.querySelector(".admin-login-status");
const weatherTemp = document.querySelector("[data-weather-temp]");
const weatherSummary = document.querySelector("[data-weather-summary]");
const weatherWind = document.querySelector("[data-weather-wind]");
const weatherTime = document.querySelector("[data-weather-time]");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const goalFill = document.querySelector("[data-goal-meter-fill]");
const goalCount = document.querySelector("[data-goal-count]");
const goalOpen = document.querySelector("[data-goal-open]");
const goalDogs = document.querySelector("[data-goal-dogs]");
const confirmationEndpoint = import.meta.env.VITE_RSVP_CONFIRMATION_ENDPOINT;

const fields = {
  name: form.elements.name,
  email: form.elements.email,
  party: form.elements.party,
  walkMode: [...form.querySelectorAll('input[name="walkMode"]')],
  interest: [...form.querySelectorAll('input[name="interest"]')],
};

if (!isSupabaseConfigured) {
  console.info("Supabase is not configured yet. Using local browser storage for demo submissions.");
}

function readStore(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function appendStore(key, value) {
  const items = readStore(key);
  items.unshift({ ...value, created_at: new Date().toISOString() });
  writeStore(key, items);
  return items;
}

function setError(root, selectorName, fieldName, message) {
  const el = root.querySelector(`[${selectorName}="${fieldName}"]`);
  if (el) {
    el.textContent = message;
  }
}

function clearErrors(root, selectorName, fieldsToClear, statusElement) {
  fieldsToClear.forEach((field) => setError(root, selectorName, field, ""));
  statusElement.textContent = "";
  statusElement.classList.remove("is-success");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function dogMeta(dog) {
  const months = Number(dog.age_months || dog.ageMonths || 0);
  if (months < 12) return `${months} months old | ${dog.type} dog`;
  const years = Math.round(months / 12);
  return `${years} ${years === 1 ? "year" : "years"} old | ${dog.status}`;
}

function dogTags(dog) {
  if (Array.isArray(dog.temperament_tags)) return dog.temperament_tags;
  if (Array.isArray(dog.temperamentTags)) return dog.temperamentTags;
  if (typeof dog.temperament_tags === "string") return dog.temperament_tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  return [];
}

function dogShareUrl(dog) {
  const url = new URL(window.location.href);
  url.hash = "adopt";
  url.searchParams.set("dog", dog.name);
  return url.toString();
}

function setCheckedByValue(inputs, value) {
  const target = inputs.find((input) => input.value === value);
  if (target) target.checked = true;
}

function getDogImage(dog) {
  const imageUrl = dog.image_url || dog.image || "assets/rescue-portrait.png";
  if (bundledDogImages[imageUrl]) return bundledDogImages[imageUrl];
  if (imageUrl.startsWith("http") || imageUrl.startsWith("data:") || imageUrl.startsWith("/")) return imageUrl;
  return bundledDogImages[imageUrl.split("/").pop()] || rescuePortraitUrl;
}

function enrichDog(dog) {
  const sample = defaultDogs.find((defaultDog) => defaultDog.name === dog.name);
  return {
    ...dog,
    breed: dog.breed || sample?.breed,
    temperament_tags: dog.temperament_tags?.length ? dog.temperament_tags : sample?.temperament_tags || [],
  };
}

function normalizeRsvp(row) {
  return {
    name: row.name,
    email: row.email,
    party: row.party_size ?? row.party,
    walkMode: row.walk_mode ?? row.walkMode,
    interests: row.interests || [],
  };
}

function buildCalendarLinks() {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: eventDetails.title,
    dates: `${eventDetails.start}/${eventDetails.end}`,
    details: eventDetails.description,
    location: eventDetails.location,
  });
  const googleUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;
  document.querySelectorAll("[data-calendar-google]").forEach((link) => {
    link.href = googleUrl;
  });

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FDLD//FindADog at Lost Dog//EN",
    "BEGIN:VEVENT",
    `UID:findadog-lostdog-20261010@fdld`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART:${eventDetails.start}`,
    `DTEND:${eventDetails.end}`,
    `SUMMARY:${eventDetails.title}`,
    `DESCRIPTION:${eventDetails.description}`,
    `LOCATION:${eventDetails.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const icsUrl = URL.createObjectURL(new Blob([icsLines], { type: "text/calendar" }));
  document.querySelectorAll("[data-calendar-ics]").forEach((link) => {
    link.href = icsUrl;
  });
}

function updateCountdown() {
  const total = eventDetails.localStart.getTime() - Date.now();
  const remaining = Math.max(0, total);
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const pairs = [
    ["[data-countdown-days]", days],
    ["[data-countdown-hours]", hours],
    ["[data-countdown-minutes]", minutes],
    ["[data-countdown-seconds]", seconds],
  ];
  pairs.forEach(([selector, value]) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = String(value).padStart(2, "0");
  });
}

async function loadDogs() {
  if (!isSupabaseConfigured) {
    dogRecords = [...defaultDogs];
    return;
  }

  const { data, error } = await supabase
    .from("dogs")
    .select("id,name,age_months,type,status,bio,image_url,featured,created_at")
    .order("featured", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    console.warn("Dog table read failed; using sample dogs.", error.message);
    dogRecords = [...defaultDogs];
    return;
  }

  dogRecords = data?.length ? data.map(enrichDog) : [...defaultDogs];
}

async function loadGallery() {
  if (!isSupabaseConfigured) {
    galleryRecords = readStore(storageKeys.gallery);
    return;
  }

  const { data, error } = await supabase
    .from("gallery_photos")
    .select("id,caption,image_url,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Gallery read failed; using local gallery fallback.", error.message);
    galleryRecords = readStore(storageKeys.gallery);
    return;
  }

  galleryRecords = data || [];
}

function renderHeroDogs() {
  heroDogStrip.innerHTML = dogRecords
    .filter((dog) => dog.featured)
    .slice(0, 3)
    .map(
      (dog) => `
        <a href="#adopt" class="hero-dog-card">
          <img src="${getDogImage(dog)}" alt="${dog.name}, ${dogMeta(dog)}" />
          <span>${dog.name}</span>
          <small>${dog.status}</small>
        </a>
      `
    )
    .join("");
}

function renderDogs(limitToFeatured = true) {
  const statusFilter = document.querySelector("#dog-status-filter").value;
  const typeFilter = document.querySelector("#dog-type-filter").value;
  const sort = document.querySelector("#dog-sort").value;

  let visibleDogs = [...dogRecords];
  if (statusFilter !== "all") {
    visibleDogs = visibleDogs.filter((dog) => dog.status === statusFilter);
  }
  if (typeFilter !== "all") {
    visibleDogs = visibleDogs.filter((dog) => dog.type === typeFilter);
  }
  if (limitToFeatured && statusFilter === "all" && typeFilter === "all" && sort === "featured") {
    visibleDogs = visibleDogs.filter((dog) => dog.featured);
  }

  visibleDogs.sort((a, b) => {
    if (sort === "age-asc") return Number(a.age_months) - Number(b.age_months);
    if (sort === "age-desc") return Number(b.age_months) - Number(a.age_months);
    if (sort === "name") return a.name.localeCompare(b.name);
    return Number(b.featured) - Number(a.featured);
  });

  dogDirectory.innerHTML = visibleDogs
    .map(
      (dog) => `
        <article class="dog-card ${escapeHtml(dog.status)}" data-dog-name="${escapeHtml(dog.name)}">
          <img src="${getDogImage(dog)}" alt="${escapeHtml(dog.name)}, ${escapeHtml(dogMeta(dog))}" />
          <div>
            <p class="dog-meta">${escapeHtml(dogMeta(dog))}</p>
            <h3>${escapeHtml(dog.name)}</h3>
            <span class="status-pill ${escapeHtml(dog.status)}">${escapeHtml(dog.status)}</span>
            <p class="dog-breed">${escapeHtml(dog.breed || "Breed mix pending")}</p>
            <div class="dog-tags">${dogTags(dog).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
            <p>${escapeHtml(dog.bio || dog.description || "")}</p>
            <div class="dog-actions">
              <button class="link-button" type="button" data-meet-dog="${escapeHtml(dog.name)}">${dog.status === "available" ? "Request meetup" : "Ask about story"}</button>
              <button class="link-button" type="button" data-share-dog="${escapeHtml(dog.name)}">Share this dog</button>
            </div>
          </div>
        </article>
      `
    )
    .join("");

  const requestedDog = new URLSearchParams(window.location.search).get("dog");
  if (requestedDog) {
    const card = [...dogDirectory.querySelectorAll("[data-dog-name]")].find((item) => item.dataset.dogName === requestedDog);
    if (card) card.classList.add("is-requested");
  }
}

function renderUploadedGallery() {
  uploadedGallery.innerHTML = galleryRecords
    .map(
      (photo) => `
        <figure>
          <img src="${photo.image_url || photo.src}" alt="${photo.caption}" />
          <figcaption>${photo.caption}</figcaption>
        </figure>
      `
    )
    .join("");
}

function weatherDescription(code) {
  const descriptions = {
    0: "Clear desert skies.",
    1: "Mostly clear.",
    2: "Partly cloudy.",
    3: "Cloudy.",
    45: "Foggy.",
    48: "Depositing fog.",
    51: "Light drizzle.",
    53: "Drizzle.",
    55: "Heavy drizzle.",
    61: "Light rain.",
    63: "Rain.",
    65: "Heavy rain.",
    71: "Light snow.",
    80: "Light showers.",
    81: "Showers.",
    82: "Heavy showers.",
    95: "Thunderstorm risk.",
  };
  return descriptions[code] || "Current trail conditions available.";
}

function heatGuidance(temp) {
  if (temp >= 95) return " High heat: shorten walks, avoid hot ground, and prioritize shade.";
  if (temp >= 85) return " Warm trail: bring extra water and plan frequent shade breaks.";
  if (temp >= 75) return " Comfortable but sunny: check paw surfaces before starting.";
  return " Mild conditions: still carry water and watch each dog closely.";
}

async function loadWeather() {
  if (!weatherTemp) return;

  try {
    const response = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=33.60034&longitude=-111.8119&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FPhoenix"
    );
    if (!response.ok) throw new Error("Weather service unavailable");

    const data = await response.json();
    const current = data.current;
    const temp = Math.round(current.temperature_2m);
    weatherTemp.textContent = `${temp}°F`;
    weatherSummary.textContent = `${weatherDescription(current.weather_code)}${heatGuidance(temp)}`;
    weatherWind.textContent = `${Math.round(current.wind_speed_10m)} mph`;
    weatherTime.textContent = new Date(current.time).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch (error) {
    weatherTemp.textContent = "--";
    weatherSummary.textContent = "Live weather is unavailable. Check Scottsdale conditions before leaving for the trail.";
    weatherWind.textContent = "--";
    weatherTime.textContent = "--";
  }
}

async function loadPublicStats() {
  let adoptionCount = baselineAdoptionConversations;
  let totalRsvps = 0;

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc("fdld_public_stats");
    if (!error && data) {
      const row = Array.isArray(data) ? data[0] : data;
      adoptionCount = Math.max(baselineAdoptionConversations, Number(row.adoption_interests || 0));
      totalRsvps = Number(row.total_rsvps || 0);
    }
  } else {
    const localRsvps = readStore(storageKeys.rsvps).map(normalizeRsvp);
    totalRsvps = localRsvps.length;
    adoptionCount = Math.max(
      baselineAdoptionConversations,
      localRsvps.filter((rsvp) => rsvp.interests.includes("adopt")).length
    );
  }

  const openSlots = Math.max(0, adoptionGoal - adoptionCount);
  if (goalFill) goalFill.style.width = `${Math.min(100, Math.round((adoptionCount / adoptionGoal) * 100))}%`;
  if (goalCount) goalCount.textContent = `${adoptionCount}/${adoptionGoal}`;
  if (goalOpen) goalOpen.textContent = openSlots;
  if (goalDogs) goalDogs.textContent = dogRecords.filter((dog) => dog.featured).length || 3;
  document.querySelectorAll("[data-rsvp-count]").forEach((el) => {
    el.textContent = totalRsvps;
  });
}

async function sendOptionalRsvpConfirmation(payload) {
  if (!confirmationEndpoint) return;

  try {
    await fetch(confirmationEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        event: eventDetails,
      }),
    });
  } catch (error) {
    console.warn("RSVP confirmation email hook failed.", error);
  }
}

function requestDogMeetup(dogName) {
  setCheckedByValue(fields.walkMode, "walking with an adoptable dog");
  fields.interest.forEach((input) => {
    if (input.value === "adopt" || input.value === "walk") input.checked = true;
  });
  form.elements.dogInterest.value = dogName;
  const notePrefix = `I would like to meet ${dogName}.`;
  if (!form.elements.note.value.includes(notePrefix)) {
    form.elements.note.value = `${notePrefix}${form.elements.note.value ? ` ${form.elements.note.value}` : ""}`;
  }
  document.querySelector("#rsvp").scrollIntoView({ behavior: "smooth", block: "start" });
  status.classList.add("is-success");
  status.textContent = `${dogName} has been added to your RSVP note.`;
}

async function shareDog(dogName) {
  const dog = dogRecords.find((record) => record.name === dogName);
  if (!dog) return;
  const shareData = {
    title: `${dog.name} at FindADog at Lost Dog`,
    text: `Meet ${dog.name}, ${dog.breed || dogMeta(dog)}, at FDLD's Lost Dog Trail adoption walk.`,
    url: dogShareUrl(dog),
  };

  if (navigator.share) {
    await navigator.share(shareData);
    return;
  }

  await navigator.clipboard.writeText(shareData.url);
  const button = [...document.querySelectorAll("[data-share-dog]")].find((item) => item.dataset.shareDog === dogName);
  if (button) button.textContent = "Link copied";
}

function validateRsvp() {
  clearErrors(form, "data-error-for", ["name", "email", "party", "walkMode", "interest"], status);
  let valid = true;

  if (!fields.name.value.trim()) {
    setError(form, "data-error-for", "name", "Please enter your name.");
    valid = false;
  }
  if (!fields.email.value.trim()) {
    setError(form, "data-error-for", "email", "Please enter your email.");
    valid = false;
  } else if (!isValidEmail(fields.email.value.trim())) {
    setError(form, "data-error-for", "email", "Please enter a valid email address.");
    valid = false;
  }

  const party = Number(fields.party.value);
  if (!Number.isInteger(party) || party < 1 || party > 12) {
    setError(form, "data-error-for", "party", "Party size must be between 1 and 12.");
    valid = false;
  }
  if (!fields.walkMode.some((input) => input.checked)) {
    setError(form, "data-error-for", "walkMode", "Choose how you are joining the walk.");
    valid = false;
  }
  if (!fields.interest.some((input) => input.checked)) {
    setError(form, "data-error-for", "interest", "Choose at least one way to participate.");
    valid = false;
  }

  return valid;
}

function validateSponsor() {
  clearErrors(sponsorForm, "data-sponsor-error-for", ["sponsorName", "sponsorEmail", "sponsorSpot", "sponsorLevel"], sponsorStatus);
  let valid = true;

  if (!sponsorForm.elements.sponsorName.value.trim()) {
    setError(sponsorForm, "data-sponsor-error-for", "sponsorName", "Please enter the sponsor name.");
    valid = false;
  }
  if (!sponsorForm.elements.sponsorEmail.value.trim()) {
    setError(sponsorForm, "data-sponsor-error-for", "sponsorEmail", "Please enter a contact email.");
    valid = false;
  } else if (!isValidEmail(sponsorForm.elements.sponsorEmail.value.trim())) {
    setError(sponsorForm, "data-sponsor-error-for", "sponsorEmail", "Please enter a valid email address.");
    valid = false;
  }
  if (!sponsorForm.elements.sponsorSpot.value) {
    setError(sponsorForm, "data-sponsor-error-for", "sponsorSpot", "Choose a preferred trail spot.");
    valid = false;
  }
  if (!sponsorForm.elements.sponsorLevel.value) {
    setError(sponsorForm, "data-sponsor-error-for", "sponsorLevel", "Choose a sponsorship level.");
    valid = false;
  }

  return valid;
}

function validateTeam() {
  clearErrors(teamForm, "data-team-error-for", ["teamName", "captainEmail", "teamGoal"], teamStatus);
  let valid = true;

  if (!teamForm.elements.teamName.value.trim()) {
    setError(teamForm, "data-team-error-for", "teamName", "Please enter a team name.");
    valid = false;
  }
  if (!teamForm.elements.captainEmail.value.trim()) {
    setError(teamForm, "data-team-error-for", "captainEmail", "Please enter the captain email.");
    valid = false;
  } else if (!isValidEmail(teamForm.elements.captainEmail.value.trim())) {
    setError(teamForm, "data-team-error-for", "captainEmail", "Please enter a valid email address.");
    valid = false;
  }
  if (!teamForm.elements.teamGoal.value) {
    setError(teamForm, "data-team-error-for", "teamGoal", "Choose a fundraising goal.");
    valid = false;
  }

  return valid;
}

async function fetchAdminTables() {
  if (!isSupabaseConfigured || !isAdminLoggedIn) {
    return {
      rsvps: readStore(storageKeys.rsvps).map(normalizeRsvp),
      sponsors: readStore(storageKeys.sponsors),
      teams: readStore(storageKeys.teams),
    };
  }

  const [rsvpsResult, sponsorsResult, teamsResult] = await Promise.all([
    supabase.from("rsvps").select("*").order("created_at", { ascending: false }),
    supabase.from("sponsors").select("*").order("created_at", { ascending: false }),
    supabase.from("teams").select("*").order("created_at", { ascending: false }),
  ]);

  const firstError = rsvpsResult.error || sponsorsResult.error || teamsResult.error;
  if (firstError) {
    throw firstError;
  }

  return {
    rsvps: rsvpsResult.data.map(normalizeRsvp),
    sponsors: sponsorsResult.data,
    teams: teamsResult.data,
  };
}

async function renderAdmin() {
  if (!adminDashboard.hidden) {
    try {
      const { rsvps, sponsors, teams } = await fetchAdminTables();
      const adoptionCount = rsvps.filter((rsvp) => rsvp.interests.includes("adopt")).length;

      document.querySelector('[data-admin-count="rsvps"]').textContent = rsvps.length;
      document.querySelector('[data-admin-count="adoption"]').textContent = adoptionCount;
      document.querySelector('[data-admin-count="sponsors"]').textContent = sponsors.length;
      document.querySelector('[data-admin-count="teams"]').textContent = teams.length;

      document.querySelector('[data-admin-table="rsvps"]').innerHTML =
        rsvps
          .map(
            (rsvp) => `
              <tr>
                <td>${rsvp.name}</td>
                <td>${rsvp.email}</td>
                <td>${rsvp.party}</td>
                <td>${rsvp.walkMode}</td>
                <td>${rsvp.interests.join(", ")}</td>
              </tr>
            `
          )
          .join("") || `<tr><td colspan="5">No RSVPs yet.</td></tr>`;

      document.querySelector('[data-admin-list="sponsors"]').innerHTML =
        sponsors
          .map((sponsor) => `<li><strong>${sponsor.name}</strong><span>${sponsor.spot} | ${sponsor.level}</span></li>`)
          .join("") || "<li>No sponsor requests yet.</li>";

      document.querySelector('[data-admin-list="teams"]').innerHTML =
        teams
          .map((team) => `<li><strong>${team.name}</strong><span>${team.goal} goal | ${team.captain_email || team.email}</span></li>`)
          .join("") || "<li>No teams yet.</li>";
    } catch (error) {
      adminLoginStatus.textContent = `Admin data could not load: ${error.message}`;
    }
  }
}

function setAdminState(isLoggedIn) {
  isAdminLoggedIn = isLoggedIn;
  adminDashboard.hidden = !isLoggedIn;
  adminLogin.hidden = isLoggedIn;
  if (isLoggedIn) {
    renderAdmin();
  }
}

async function insertOrStore(table, storageKey, payload) {
  if (!isSupabaseConfigured) {
    appendStore(storageKey, payload);
    return;
  }

  const { error } = await supabase.from(table).insert(payload);
  if (error) {
    throw error;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateRsvp()) {
    status.textContent = "Please fix the highlighted fields.";
    return;
  }

  const interests = fields.interest.filter((input) => input.checked).map((input) => input.value);
  const walkMode = fields.walkMode.find((input) => input.checked).value;
  const payload = {
    name: fields.name.value.trim(),
    email: fields.email.value.trim(),
    party_size: Number(fields.party.value),
    walk_mode: walkMode,
    interests,
    note: form.elements.note.value.trim(),
  };

  try {
    await insertOrStore("rsvps", storageKeys.rsvps, payload);
    await sendOptionalRsvpConfirmation(payload);
    status.classList.add("is-success");
    status.textContent = `Thanks, ${payload.name}. Your RSVP for ${payload.party_size} is confirmed for ${interests.join(", ")}, with you ${walkMode}.`;
    form.reset();
    fields.party.value = "1";
    form.elements.dogInterest.value = "";
    await loadPublicStats();
    await renderAdmin();
  } catch (error) {
    status.textContent = `RSVP could not be saved: ${error.message}`;
  }
});

sponsorForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateSponsor()) {
    sponsorStatus.textContent = "Please fix the highlighted sponsor fields.";
    return;
  }

  const payload = {
    name: sponsorForm.elements.sponsorName.value.trim(),
    email: sponsorForm.elements.sponsorEmail.value.trim(),
    spot: sponsorForm.elements.sponsorSpot.value,
    level: sponsorForm.elements.sponsorLevel.value,
    note: sponsorForm.elements.sponsorNote.value.trim(),
  };

  try {
    await insertOrStore("sponsors", storageKeys.sponsors, payload);
    sponsorStatus.classList.add("is-success");
    sponsorStatus.textContent = `${payload.name} is queued for ${payload.spot} as a ${payload.level} sponsor.`;
    sponsorForm.reset();
    await renderAdmin();
  } catch (error) {
    sponsorStatus.textContent = `Sponsor request could not be saved: ${error.message}`;
  }
});

teamForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateTeam()) {
    teamStatus.textContent = "Please fix the highlighted team fields.";
    return;
  }

  const payload = {
    name: teamForm.elements.teamName.value.trim(),
    captain_email: teamForm.elements.captainEmail.value.trim(),
    goal: teamForm.elements.teamGoal.value,
  };

  try {
    await insertOrStore("teams", storageKeys.teams, payload);
    teamStatus.classList.add("is-success");
    teamStatus.textContent = `${payload.name} is queued as a walking team with a ${payload.goal} fundraising goal.`;
    teamForm.reset();
    await renderAdmin();
  } catch (error) {
    teamStatus.textContent = `Team could not be saved: ${error.message}`;
  }
});

galleryUploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = galleryUploadForm.elements.galleryPhoto.files[0];
  const caption = galleryUploadForm.elements.galleryCaption.value.trim();
  const uploadStatus = document.querySelector(".gallery-upload-status");

  setError(galleryUploadForm, "data-gallery-error-for", "galleryCaption", "");
  uploadStatus.classList.remove("is-success");

  if (!file || !caption) {
    setError(galleryUploadForm, "data-gallery-error-for", "galleryCaption", "Choose a photo and add a caption.");
    uploadStatus.textContent = "Please choose a photo and caption.";
    return;
  }

  if (!isSupabaseConfigured || !isAdminLoggedIn) {
    uploadStatus.textContent = "Log in with Supabase admin access before uploading photos.";
    return;
  }

  const safeName = file.name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
  const filePath = `${crypto.randomUUID()}-${safeName}`;

  try {
    const { error: uploadError } = await supabase.storage.from("fdld-gallery").upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from("fdld-gallery").getPublicUrl(filePath);
    const { error: insertError } = await supabase.from("gallery_photos").insert({
      caption,
      image_url: publicUrlData.publicUrl,
    });
    if (insertError) throw insertError;

    uploadStatus.classList.add("is-success");
    uploadStatus.textContent = "Photo uploaded to Supabase Storage and added to the public gallery.";
    galleryUploadForm.reset();
    await loadGallery();
    renderUploadedGallery();
  } catch (error) {
    uploadStatus.textContent = `Photo upload failed: ${error.message}. Confirm the fdld-gallery bucket exists and policies allow authenticated uploads.`;
  }
});

adminLogin.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = adminLogin.elements.adminEmail.value.trim();
  const password = adminLogin.elements.adminPassword.value;
  clearErrors(adminLogin, "data-admin-error-for", ["adminEmail", "adminPassword"], adminLoginStatus);

  if (!isSupabaseConfigured) {
    adminLoginStatus.textContent = "Supabase is not configured.";
    return;
  }
  if (!isValidEmail(email)) {
    setError(adminLogin, "data-admin-error-for", "adminEmail", "Enter the admin email.");
    return;
  }
  if (!password) {
    setError(adminLogin, "data-admin-error-for", "adminPassword", "Enter the admin password.");
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    adminLoginStatus.textContent = `Admin login failed: ${error.message}`;
    return;
  }

  adminLoginStatus.classList.add("is-success");
  adminLoginStatus.textContent = "Logged in.";
  setAdminState(true);
});

document.querySelector("[data-admin-logout]").addEventListener("click", async () => {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
  setAdminState(false);
});

document.querySelector("[data-show-all-dogs]").addEventListener("click", () => {
  renderDogs(false);
});

dogDirectory.addEventListener("click", async (event) => {
  const meetupButton = event.target.closest("[data-meet-dog]");
  const shareButton = event.target.closest("[data-share-dog]");
  if (meetupButton) {
    requestDogMeetup(meetupButton.dataset.meetDog);
  }
  if (shareButton) {
    try {
      await shareDog(shareButton.dataset.shareDog);
    } catch (error) {
      console.warn("Dog share failed.", error);
    }
  }
});

document.querySelector("[data-volunteer-cta]").addEventListener("click", () => {
  fields.interest.forEach((input) => {
    if (input.value === "volunteer") input.checked = true;
  });
});

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    navLinks.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

["#dog-status-filter", "#dog-type-filter", "#dog-sort"].forEach((selector) => {
  document.querySelector(selector).addEventListener("change", () => renderDogs(false));
});

async function init() {
  buildCalendarLinks();
  updateCountdown();
  setInterval(updateCountdown, 1000);
  await Promise.all([loadDogs(), loadGallery(), loadWeather()]);
  renderHeroDogs();
  renderDogs(true);
  renderUploadedGallery();
  await loadPublicStats();

  if (isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession();
    setAdminState(Boolean(data.session));
  } else {
    setAdminState(false);
  }
}

init();
