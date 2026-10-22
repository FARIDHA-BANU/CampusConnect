
/* =========================================
   CAMPUSCONNECT - MULTI-PAGE APPLICATION
========================================= */

function formatDate(dateString) {
    if (!dateString) return "Date to be announced";

    return new Date(dateString + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function getStatus(event) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const date = new Date(event.date + "T00:00:00");

    if (date < today) return "Completed";
    if (date.getTime() === today.getTime()) return "Today";
    return "Upcoming";
}

function escape(value) {
    return window.escapeHTML(value);
}

/* MOBILE NAVIGATION */

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
        const open = navLinks.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", String(open));
    });

    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => navLinks.classList.remove("open"));
    });
}

/* FOOTER YEAR */

const year = document.getElementById("currentYear");
if (year) year.textContent = new Date().getFullYear();

/* HOME PAGE STATISTICS */

function renderHomeStats() {
    const totalEvents = document.getElementById("totalEvents");
    const totalRegistrations = document.getElementById("totalRegistrations");

    if (totalEvents) totalEvents.textContent = window.getAllEvents().length;

    if (totalRegistrations) {
        totalRegistrations.textContent = window.getRegistrations().length;
    }
}

/* EXPLORE EVENTS PAGE */

function renderEvents() {
    const grid = document.getElementById("eventGrid");
    if (!grid) return;

    const search = document.getElementById("eventSearch");
    const category = document.getElementById("categoryFilter");
    const sort = document.getElementById("sortEvents");

    const query = search.value.trim().toLowerCase();
    const selectedCategory = category.value;

    let events = window.getAllEvents().filter(event => {
        const matchesCategory =
            selectedCategory === "All" || event.category === selectedCategory;

        const text = [event.name, event.category, event.venue, event.description]
            .join(" ").toLowerCase();

        return matchesCategory && text.includes(query);
    });

    if (sort.value === "name") {
        events.sort((a, b) => a.name.localeCompare(b.name));
    } else {
        events.sort((a, b) => a.date.localeCompare(b.date));
    }

    const count = document.getElementById("resultCount");
    if (count) count.textContent = `${events.length} events`;

    const empty = document.getElementById("emptyEvents");
    if (empty) empty.classList.toggle("hidden", events.length > 0);

    grid.innerHTML = events.map(event => {
        const total = window.getRegistrations().filter(
            item => item.eventId === event.id
        ).length;

        return `
            <article class="event-card">
                <div class="event-image">
                    <img src="${escape(event.image)}"
                         alt="${escape(event.name)}" loading="lazy">
                    <span class="category-badge">${escape(event.category)}</span>
                </div>
                <div class="event-card-content">
                    <h3>${escape(event.name)}</h3>
                    <p>${escape(event.description)}</p>
                    <div class="event-meta">
                        <span>📅 ${formatDate(event.date)}</span>
                        <span>🕒 ${escape(event.time)}</span>
                        <span>📍 ${escape(event.venue)}</span>
                        <span>👥 ${total} registered</span>
                    </div>
                    <a class="btn btn-primary"
                       href="event-details.html?id=${encodeURIComponent(event.id)}">
                       View Details →
                    </a>
                </div>
            </article>
        `;
    }).join("");
}

const eventSearch = document.getElementById("eventSearch");
const categoryFilter = document.getElementById("categoryFilter");
const sortEvents = document.getElementById("sortEvents");
const categoryChips = document.getElementById("categoryChips");

if (eventSearch) eventSearch.addEventListener("input", renderEvents);
if (categoryFilter) categoryFilter.addEventListener("change", () => {
    if (categoryChips) {
        categoryChips.querySelectorAll(".chip").forEach(chip => {
            chip.classList.toggle("active", chip.dataset.category === categoryFilter.value);
        });
    }
    renderEvents();
});
if (sortEvents) sortEvents.addEventListener("change", renderEvents);

if (categoryChips) {
    categoryChips.addEventListener("click", event => {
        const chip = event.target.closest("[data-category]");
        if (!chip) return;

        categoryFilter.value = chip.dataset.category;

        categoryChips.querySelectorAll(".chip").forEach(item => {
            item.classList.toggle("active", item === chip);
        });

        renderEvents();
    });
}

/* EVENT DETAILS PAGE */

function renderEventDetails() {
    const panel = document.getElementById("eventDetailsPanel");
    if (!panel) return;

    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));

    const event = window.getAllEvents().find(item => item.id === id);

    if (!event) {
        panel.innerHTML = `
            <div class="details-placeholder">
                <span>🔎</span>
                <h3>Event not found</h3>
                <p>Please choose an event from the Explore Events page.</p>
                <a class="btn btn-primary" href="events.html">Browse Events →</a>
            </div>`;
        return;
    }

    const registrations = window.getRegistrations().filter(
        item => item.eventId === event.id
    ).length;

    const highlights = (event.highlights || []).map(item =>
        `<li>✓ ${escape(item)}</li>`
    ).join("");

    const closed = getStatus(event) === "Completed";

    panel.innerHTML = `
        <div class="details-content">
            <img src="${escape(event.image)}" alt="${escape(event.name)}">
            <div class="details-copy">
                <span class="category-badge" style="position:static;display:inline-block">
                    ${escape(event.category)}
                </span>
                <h3>${escape(event.name)}</h3>
                <p>${escape(event.description)}</p>
                <div class="event-meta">
                    <span>📅 ${formatDate(event.date)}</span>
                    <span>🕒 ${escape(event.time)}</span>
                    <span>📍 ${escape(event.venue)}</span>
                    <span>👥 ${registrations} registered</span>
                    <span>📌 ${getStatus(event)}</span>
                </div>
                <h4>Event Highlights</h4>
                <ul class="details-highlights">${highlights}</ul>
                ${closed
                    ? '<p>Registration is closed for this event.</p>'
                    : `<a class="btn btn-primary"
                        href="registration.html?id=${encodeURIComponent(event.id)}">
                        Register Now →
                       </a>`
                }
            </div>
        </div>
    `;
}

/* REGISTRATION PAGE */

function renderRegistrationPage() {
    const select = document.getElementById("registrationEvent");
    if (!select) return;

    const params = new URLSearchParams(window.location.search);
    const requestedId = Number(params.get("id"));

    const events = window.getAllEvents().filter(
        event => getStatus(event) !== "Completed"
    );

    select.innerHTML = `
        <option value="">Choose an event</option>
        ${events.map(event => `
            <option value="${event.id}">
                ${escape(event.name)} — ${formatDate(event.date)}
            </option>
        `).join("")}
    `;

    if (events.some(event => event.id === requestedId)) {
        select.value = String(requestedId);
    }

    function updatePreview() {
        const event = events.find(item => item.id === Number(select.value));
        const title = document.getElementById("registrationEventTitle");
        const description = document.getElementById("registrationEventDescription");
        const image = document.getElementById("registrationImage");

        title.textContent = event ? event.name : "Choose your next event";
        description.textContent = event
            ? `${event.description} Date: ${formatDate(event.date)}. Venue: ${event.venue}.`
            : "Select an event to see its information here.";

        if (event) {
            image.src = event.image;
            image.alt = event.name;
        } else {
            image.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80";
            image.alt = "Students learning together";
        }
    }

    select.addEventListener("change", updatePreview);
    updatePreview();
}

/* MY REGISTRATIONS PAGE */

function renderMyRegistrations() {
    const list = document.getElementById("myRegistrationList");
    if (!list) return;

    const registrations = window.getRegistrations();
    const empty = document.getElementById("emptyRegistrations");

    list.innerHTML = registrations.map(registration => {
        const event = window.getAllEvents().find(
            item => item.id === registration.eventId
        );

        const name = event ? event.name : registration.eventName;
        const date = event ? formatDate(event.date) : "Date unavailable";
        const venue = event ? event.venue : "Venue unavailable";
        const image = event ? event.image : "";
        const status = event ? getStatus(event) : "Event unavailable";

        return `
            <article class="my-registration-item">
                <img src="${escape(image)}" alt="${escape(name)}" loading="lazy">
                <div>
                    <h3>${escape(name)}</h3>
                    <p>📅 ${date}</p>
                    <p>📍 ${escape(venue)}</p>
                    <p>Student ID: ${escape(registration.studentId)}</p>
                </div>
                <div>
                    <span class="status-badge">${status}</span>
                    <p style="margin-top:10px">${escape(registration.studentName)}</p>
                </div>
            </article>
        `;
    }).join("");

    if (empty) empty.classList.toggle("hidden", registrations.length > 0);

    const count = document.getElementById("myRegistrationCount");
    const total = document.getElementById("myTotal");
    const upcoming = document.getElementById("myUpcoming");

    if (count) count.textContent = `${registrations.length} registrations`;
    if (total) total.textContent = registrations.length;

    if (upcoming) {
        upcoming.textContent = registrations.filter(registration => {
            const event = window.getAllEvents().find(
                item => item.id === registration.eventId
            );
            return event && ["Upcoming", "Today"].includes(getStatus(event));
        }).length;
    }
}

/* ADMIN DASHBOARD */

function renderAdminPage() {
    const table = document.getElementById("adminEventTable");
    if (!table) return;

    const events = window.getAllEvents();
    const registrations = window.getRegistrations();

    document.getElementById("adminTotalEvents").textContent = events.length;
    document.getElementById("adminTotalRegistrations").textContent = registrations.length;
    document.getElementById("adminCategories").textContent =
        new Set(events.map(event => event.category)).size;

    table.innerHTML = events.map(event => {
        const count = registrations.filter(
            item => item.eventId === event.id
        ).length;

        return `
            <tr>
                <td>${escape(event.name)}</td>
                <td>${formatDate(event.date)}</td>
                <td>${count}</td>
                <td>
                    <button class="table-action" data-edit-event="${event.id}">Edit</button>
                    <button class="table-action delete" data-delete-event="${event.id}">Delete</button>
                </td>
            </tr>
        `;
    }).join("");

    table.onclick = event => {
        const edit = event.target.closest("[data-edit-event]");
        const remove = event.target.closest("[data-delete-event]");

        if (edit) window.editCampusEvent(Number(edit.dataset.editEvent));
        if (remove) window.deleteCampusEvent(Number(remove.dataset.deleteEvent));
    };
}

/* REFRESH VISIBLE PAGE AFTER DATA CHANGES */

window.renderAll = function () {
    renderHomeStats();
    renderEvents();
    renderEventDetails();
    renderRegistrationPage();
    renderMyRegistrations();
    renderAdminPage();
};

window.renderAll();
