
/* CAMPUSCONNECT - SHARED DATA AND FORM LOGIC */

const REGISTRATION_KEY = "campusConnectRegistrations";
const EVENT_KEY = "campusConnectCustomEvents";

window.getRegistrations = function () {
    try {
        return JSON.parse(localStorage.getItem(REGISTRATION_KEY)) || [];
    } catch {
        return [];
    }
};

window.saveRegistrations = function (items) {
    localStorage.setItem(REGISTRATION_KEY, JSON.stringify(items));
};

window.getAllEvents = function () {
    let custom = [];

    try {
        custom = JSON.parse(localStorage.getItem(EVENT_KEY)) || [];
    } catch {
        custom = [];
    }

    return [...window.CAMPUS_EVENTS, ...custom];
};

window.saveCustomEvents = function (items) {
    localStorage.setItem(EVENT_KEY, JSON.stringify(items));
};

window.escapeHTML = function (value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;"
    })[char]);
};

window.showToast = function (message) {
    const toast = document.getElementById("toast");

    if (!toast) {
        alert(message);
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
};

function showMessage(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = `form-message ${type}`;
}

/* STUDENT REGISTRATION PAGE */

const registrationForm = document.getElementById("registrationForm");

if (registrationForm) {
    registrationForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const studentName = document.getElementById("studentName").value.trim();
        const studentId = document.getElementById("studentId").value.trim();
        const studentEmail = document.getElementById("studentEmail").value.trim();
        const department = document.getElementById("department").value;
        const studentYear = document.getElementById("studentYear").value;
        const eventId = Number(document.getElementById("registrationEvent").value);
        const message = document.getElementById("registrationMessage");

        const selectedEvent = window.getAllEvents().find(item => item.id === eventId);

        if (!selectedEvent) {
            showMessage(message, "Please select an event.", "error");
            return;
        }

        if (!studentName || !studentId || !studentEmail || !department || !studentYear) {
            showMessage(message, "Complete all required fields.", "error");
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (new Date(selectedEvent.date + "T00:00:00") < today) {
            showMessage(message, "Registration is closed for this event.", "error");
            return;
        }

        const registrations = window.getRegistrations();

        const duplicate = registrations.some(item =>
            item.eventId === eventId &&
            item.studentId.toLowerCase() === studentId.toLowerCase()
        );

        if (duplicate) {
            showMessage(message, "This student ID is already registered for this event.", "error");
            return;
        }

        registrations.push({
            id: Date.now(),
            studentName,
            studentId,
            studentEmail,
            department,
            studentYear,
            eventId,
            eventName: selectedEvent.name,
            registeredAt: new Date().toISOString()
        });

        window.saveRegistrations(registrations);
        registrationForm.reset();

        showMessage(message, "Registration successful! You can view it under My Registrations.", "success");
        window.showToast("Registration successful!");

        if (typeof window.renderAll === "function") window.renderAll();
    });
}

/* ADMIN PAGE: ADD AND EDIT EVENTS */

const addEventForm = document.getElementById("addEventForm");
let editingEventId = null;

function resetAdminForm() {
    if (!addEventForm) return;

    editingEventId = null;
    addEventForm.reset();

    document.getElementById("adminFormTitle").textContent = "Add New Event";
    document.getElementById("saveEventButton").textContent = "Add Event";
    document.getElementById("cancelEditButton").classList.add("hidden");
}

if (addEventForm) {
    addEventForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("newEventName").value.trim();
        const category = document.getElementById("newEventCategory").value;
        const date = document.getElementById("newEventDate").value;
        const time = document.getElementById("newEventTime").value.trim();
        const venue = document.getElementById("newEventVenue").value.trim();
        const image = document.getElementById("newEventImage").value.trim();
        const description = document.getElementById("newEventDescription").value.trim();
        const message = document.getElementById("adminMessage");

        if (!name || !category || !date || !time || !venue || !description) {
            showMessage(message, "Please complete all required fields.", "error");
            return;
        }

        const todayString = [
            new Date().getFullYear(),
            String(new Date().getMonth() + 1).padStart(2, "0"),
            String(new Date().getDate()).padStart(2, "0")
        ].join("-");

        if (date < todayString) {
            showMessage(message, "Choose today or a future date.", "error");
            return;
        }

        if (image) {
            try {
                const parsed = new URL(image);
                if (!["http:", "https:"].includes(parsed.protocol)) throw Error();
            } catch {
                showMessage(message, "Please enter a valid image URL.", "error");
                return;
            }
        }

        let custom = [];

        try {
            custom = JSON.parse(localStorage.getItem(EVENT_KEY)) || [];
        } catch {
            custom = [];
        }

        if (editingEventId !== null) {
            const index = custom.findIndex(item => item.id === editingEventId);

            if (index === -1) {
                showMessage(message, "This sample event cannot be edited in the demo.", "error");
                return;
            }

            custom[index] = {
                ...custom[index], name, category, date, time, venue, description,
                image: image || custom[index].image
            };
        } else {
            custom.push({
                id: Date.now(),
                name, category, date, time, venue, description,
                image: image || "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=900&q=80",
                highlights: ["Participate and learn", "Connect with students"]
            });
        }

        window.saveCustomEvents(custom);
        resetAdminForm();
        showMessage(message, "Event saved successfully.", "success");
        window.showToast("Event saved successfully!");

        if (typeof window.renderAll === "function") window.renderAll();
    });

    document.getElementById("cancelEditButton").addEventListener("click", resetAdminForm);
}

window.editCampusEvent = function (id) {
    let custom = [];

    try {
        custom = JSON.parse(localStorage.getItem(EVENT_KEY)) || [];
    } catch {}

    const item = custom.find(event => event.id === id);

    if (!item) {
        window.showToast("Only custom events can be edited in this demo.");
        return;
    }

    editingEventId = id;
    document.getElementById("newEventName").value = item.name;
    document.getElementById("newEventCategory").value = item.category;
    document.getElementById("newEventDate").value = item.date;
    document.getElementById("newEventTime").value = item.time;
    document.getElementById("newEventVenue").value = item.venue;
    document.getElementById("newEventImage").value = item.image || "";
    document.getElementById("newEventDescription").value = item.description;

    document.getElementById("adminFormTitle").textContent = "Edit Event";
    document.getElementById("saveEventButton").textContent = "Save Changes";
    document.getElementById("cancelEditButton").classList.remove("hidden");

    document.getElementById("admin").scrollIntoView({ behavior: "smooth" });
};

window.deleteCampusEvent = function (id) {
    let custom = [];

    try {
        custom = JSON.parse(localStorage.getItem(EVENT_KEY)) || [];
    } catch {}

    const item = custom.find(event => event.id === id);

    if (!item) {
        window.showToast("Sample events cannot be deleted in this demo.");
        return;
    }

    if (!confirm(`Delete "${item.name}"?`)) return;

    window.saveCustomEvents(custom.filter(event => event.id !== id));

    if (editingEventId === id) resetAdminForm();

    window.showToast("Event deleted.");

    if (typeof window.renderAll === "function") window.renderAll();
};

/* EXPORT REGISTRATIONS TO CSV */

const exportButton = document.getElementById("exportRegistrations");

if (exportButton) {
    exportButton.addEventListener("click", function () {
        const registrations = window.getRegistrations();

        if (!registrations.length) {
            window.showToast("No registrations to export.");
            return;
        }

        const columns = [
            "studentName", "studentId", "studentEmail",
            "department", "studentYear", "eventName", "registeredAt"
        ];

        const csvValue = value =>
            `"${String(value ?? "").replace(/"/g, '""')}"`;

        const csv = [
            columns.join(","),
            ...registrations.map(item =>
                columns.map(column => csvValue(item[column])).join(",")
            )
        ].join("\r\n");

        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "campusconnect-registrations.csv";
        link.click();

        URL.revokeObjectURL(url);
        window.showToast("CSV downloaded.");
    });
}
