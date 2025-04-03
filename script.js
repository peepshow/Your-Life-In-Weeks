// --- Constants ---
const WEEKS_IN_YEAR = 52;
const DEFAULT_LIFE_EXPECTANCY_YEARS = 90;
const TOTAL_WEEKS = WEEKS_IN_YEAR * DEFAULT_LIFE_EXPECTANCY_YEARS;

// --- DOM Elements ---
const birthdateInput = document.getElementById('birthdate');
const weeksGrid = document.getElementById('weeksGrid');

// --- Functions ---

/**
 * Calculates the number of weeks between two dates.
 * @param {Date} startDate - The start date.
 * @param {Date} endDate - The end date.
 * @returns {number} The total number of weeks elapsed.
 */
function calculateWeeksPassed(startDate, endDate) {
    const msInWeek = 1000 * 60 * 60 * 24 * 7;
    const diffInMs = endDate.getTime() - startDate.getTime();
    return Math.floor(diffInMs / msInWeek);
}

/**
 * Renders the life weeks grid.
 * @param {number} weeksPassed - The number of weeks that have passed.
 */
function renderGrid(weeksPassed) {
    // Clear previous grid
    weeksGrid.innerHTML = '';

    for (let i = 0; i < TOTAL_WEEKS; i++) {
        const weekElement = document.createElement('div');
        weekElement.classList.add('week');

        if (i < weeksPassed) {
            weekElement.classList.add('past');
        }
        // Optionally add a 'future' class if needed for styling
        // else {
        //     weekElement.classList.add('future');
        // }

        // Add a title for hover effect showing week number (optional)
        weekElement.title = `Week ${i + 1}`;

        weeksGrid.appendChild(weekElement);
    }
}

// --- Event Listener ---
birthdateInput.addEventListener('change', (event) => {
    const birthdateString = event.target.value;
    if (!birthdateString) {
        // Clear grid if date is cleared
        weeksGrid.innerHTML = '';
        return;
    }

    try {
        const birthDate = new Date(birthdateString);
        const today = new Date();

        // Basic validation: Ensure birthdate is not in the future
        if (birthDate > today) {
            alert("Birth date cannot be in the future.");
            weeksGrid.innerHTML = ''; // Clear grid on invalid input
            event.target.value = ''; // Reset input
            return;
        }

        const weeksPassed = calculateWeeksPassed(birthDate, today);
        renderGrid(weeksPassed);

    } catch (error) {
        console.error("Error processing date:", error);
        alert("Invalid date format. Please try again.");
        weeksGrid.innerHTML = ''; // Clear grid on error
    }
});

// --- Initial State ---
// Optional: Render an empty grid or a message on initial load
// renderGrid(0); // Example: Render all future weeks initially
// Or leave it empty until the user selects a date. 