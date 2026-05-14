import { isSupabaseConfigured, supabase } from "./src/supabase.js";

const storageKeys = {
  rsvps: "fdld:rsvps",
  sponsors: "fdld:sponsors",
  teams: "fdld:teams",
  gallery: "fdld:gallery",
};

const defaultDogs = [
  {
    name: "Sunny",
    age_months: 24,
    type: "medium",
    status: "available",
    image_url: "assets/rescue-portrait.png",
    bio: "Easy on leash, people-curious, and happiest with a patient walking partner.",
    featured: true,
  },
  {
    name: "Maple",
    age_months: 48,
    type: "large",
    status: "available",
    image_url: "assets/adoption-meet.png",
    bio: "Soft-eyed and steady, Maple is ready for quiet mornings and loyal routines.",
    featured: true,
  },
  {
    name: "Rio",
    age_months: 12,
    type: "medium",
    status: "available",
    image_url: "assets/family-walk.png",
    bio: "Bright, bouncy, and treat-motivated, Rio is learning how good home can feel.",
    featured: true,
  },
  {
    name: "Poppy",
    age_months: 8,
    type: "small",
    status: "available",
    image_url: "assets/rescue-portrait.png",
    bio: "A compact little shadow who loves greetings, short walks, and lap naps.",
    featured: false,
  },
  {
    name: "Cedar",
    age_months: 84,
    type: "senior",
    status: "available",
    image_url: "assets/adoption-meet.png",
    bio: "A mellow senior with excellent manners and a soft spot for slow trail strolls.",
    featured: false,
  },
  {
    name: "Juniper",
    age_months: 36,
    type: "large",
    status: "adopted",
    image_url: "assets/family-walk.png",
    bio: "Juniper found a family through an FDLD meet-and-greet and now hikes every weekend.",
    featured: false,
  },
  {
    name: "Scout",
    age_months: 18,
    type: "small",
    status: "adopted",
    image_url: "assets/rescue-portrait.png",
    bio: "Scout's adoption story is a reminder that the right walk can start a new life.",
    featured: false,
  },
  {
    name: "Saguaro",
    age_months: 60,
    type: "large",
    status: "available",
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

function dogMeta(dog) {
  const months = Number(dog.age_months || dog.ageMonths || 0);
  if (months < 12) return `${months} months old | ${dog.type} dog`;
  const years = Math.round(months / 12);
  return `${years} ${years === 1 ? "year" : "years"} old | ${dog.status}`;
}

function getDogImage(dog) {
  return dog.image_url || dog.image || "assets/rescue-portrait.png";
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

  dogRecords = data?.length ? data : [...defaultDogs];
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
        <article class="dog-card ${dog.status}">
          <img src="${getDogImage(dog)}" alt="${dog.name}, ${dogMeta(dog)}" />
          <div>
            <p class="dog-meta">${dogMeta(dog)}</p>
            <h3>${dog.name}</h3>
            <span class="status-pill ${dog.status}">${dog.status}</span>
            <p>${dog.bio || dog.description || ""}</p>
            <a href="#rsvp">${dog.status === "available" ? "Ask about adoption" : "Read adoption story"}</a>
          </div>
        </article>
      `
    )
    .join("");
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
    status.classList.add("is-success");
    status.textContent = `Thanks, ${payload.name}. Your RSVP for ${payload.party_size} is confirmed for ${interests.join(", ")}, with you ${walkMode}.`;
    form.reset();
    fields.party.value = "1";
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

["#dog-status-filter", "#dog-type-filter", "#dog-sort"].forEach((selector) => {
  document.querySelector(selector).addEventListener("change", () => renderDogs(false));
});

async function init() {
  await Promise.all([loadDogs(), loadGallery()]);
  renderHeroDogs();
  renderDogs(true);
  renderUploadedGallery();

  if (isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession();
    setAdminState(Boolean(data.session));
  } else {
    setAdminState(false);
  }
}

init();
