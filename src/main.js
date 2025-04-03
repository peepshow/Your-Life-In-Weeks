import './style.css'
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
// import 'tippy.js/themes/light.css'; // We are using a custom theme

// --- Constants ---
const WEEKS_IN_YEAR = 52;

// Life Phases Configuration
const lifePhases = [
    { name: 'Childhood', startAge: 0, endAge: 13, className: 'phase-childhood' },
    { name: 'Adolescence', startAge: 13, endAge: 20, className: 'phase-adolescence' },
    { name: 'Early Adulthood', startAge: 20, endAge: 40, className: 'phase-early-adulthood' },
    { name: 'Middle Age', startAge: 40, endAge: 65, className: 'phase-middle-age' },
    { name: 'Late Adulthood', startAge: 65, endAge: Infinity, className: 'phase-late-adulthood' },
];

// Historical Events Dataset
const historicalEvents = [
    { date: '1969-07-20', title: 'Moon Landing' },
    { date: '1989-11-09', title: 'Fall of Berlin Wall' },
    { date: '1991-08-06', title: 'World Wide Web' },
    { date: '2001-09-11', title: '9/11 Attacks' },
    { date: '2008-09-15', title: 'Global Financial Crisis' },
    { date: '2020-03-11', title: 'COVID-19 Pandemic' },
    { date: '2022-02-24', title: 'Russia Invades Ukraine' },
    // Add more events as needed
];

// --- DOM Elements ---
const birthdateInput = document.getElementById('birthdate');
const lifespanInput = document.getElementById('lifespan');
const showEventsToggle = document.getElementById('showEvents');
const showPhasesToggle = document.getElementById('showPhases');
const weeksGrid = document.getElementById('weeksGrid');

// Configure default Tippy options
tippy.setDefaultProps({
    theme: 'custom',
    animation: 'shift-away',
    arrow: true,
    placement: 'top',
    duration: [200, 150],
    delay: [100, 0],
});

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
 * Finds events that occurred during a specific week.
 * @param {Date} weekDate - The date of the week to check.
 * @returns {Array} Array of events that occurred during that week.
 */
function findEventsForWeek(weekDate) {
    return historicalEvents.filter(event => {
        const eventDate = new Date(event.date);
        const weekStart = new Date(weekDate);
        const weekEnd = new Date(weekDate);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        return eventDate >= weekStart && eventDate < weekEnd;
    });
}

/**
 * Renders the life weeks grid.
 * @param {number} weeksPassed - The number of weeks that have passed.
 * @param {number} totalWeeks - The total number of weeks in the lifespan.
 * @param {Date} birthDate - The user's birth date.
 */
function renderGrid(weeksPassed, totalWeeks, birthDate) {
    // Clear previous grid and tooltips
    weeksGrid.innerHTML = '';
    const existingTippys = weeksGrid._tippyInstances;
    if (existingTippys) {
        existingTippys.forEach(instance => instance.destroy());
    }

    let currentPhaseIndex = -1;

    // Create a container for the phases and grid
    const gridContainer = document.createElement('div');
    gridContainer.className = 'phases-and-grid';

    // Create the weeks container
    const weeksContainer = document.createElement('div');
    weeksContainer.className = 'weeks-container';

    for (let i = 0; i < totalWeeks; i++) {
        const weekElement = document.createElement('div');
        weekElement.classList.add('week');

        // Calculate age for the current week
        const ageInYears = i / WEEKS_IN_YEAR;

        // Check for phase change and add separator if phases are shown
        if (showPhasesToggle.checked) {
            const phaseIndex = lifePhases.findIndex(phase => 
                ageInYears >= phase.startAge && ageInYears < phase.endAge
            );

            if (phaseIndex !== currentPhaseIndex) {
                currentPhaseIndex = phaseIndex;
                const phase = lifePhases[phaseIndex];
                
                if (phase) {
                    // Create phase separator
                    const phaseSeparator = document.createElement('div');
                    phaseSeparator.className = 'phase-separator';
                    
                    // Calculate phase duration
                    const duration = phase.endAge === Infinity 
                        ? `${phase.startAge}+ years`
                        : `${phase.startAge}-${phase.endAge} years`;

                    phaseSeparator.innerHTML = `
                        <div class="phase-info">
                            <span class="phase-name">${phase.name}</span>
                            <span class="phase-duration">${duration}</span>
                        </div>
                    `;
                    weeksContainer.appendChild(phaseSeparator);
                }
            }

            // Apply phase class
            const currentPhase = lifePhases[currentPhaseIndex];
            if (currentPhase) {
                weekElement.classList.add(currentPhase.className);
            }
        }

        if (i < weeksPassed) {
            weekElement.classList.add('past');
        }

        // Calculate the date for this week (used for events)
        const weekDate = new Date(birthDate);
        weekDate.setDate(weekDate.getDate() + (i * 7));

        // Add event markers if enabled
        if (showEventsToggle.checked) {
            const events = findEventsForWeek(weekDate);
            if (events.length > 0) {
                weekElement.classList.add('event');
                const eventDetails = events.map(e => {
                    const eventDate = new Date(e.date);
                    const formattedDate = eventDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    return `<div class="event-tooltip">
                        <div class="event-title">${e.title}</div>
                        <div class="event-date">${formattedDate}</div>
                    </div>`;
                }).join('');
                
                tippy(weekElement, {
                    content: eventDetails,
                    allowHTML: true,
                    maxWidth: 300,
                    interactive: true,
                });
            }
        }

        weeksContainer.appendChild(weekElement);
    }

    // Add the weeks container to the main container
    gridContainer.appendChild(weeksContainer);
    
    // Replace the old grid with the new container
    weeksGrid.appendChild(gridContainer);
}

/**
 * Updates the visualization based on current input values.
 */
function updateVisualization() {
    const birthdateString = birthdateInput.value;
    if (!birthdateString) {
        weeksGrid.innerHTML = '';
        return;
    }

    try {
        const birthDate = new Date(birthdateString);
        const today = new Date();
        const lifespan = parseInt(lifespanInput.value) || 90;
        const totalWeeks = lifespan * WEEKS_IN_YEAR;

        // Basic validation
        if (birthDate > today) {
            alert("Birth date cannot be in the future.");
            weeksGrid.innerHTML = '';
            birthdateInput.value = '';
            return;
        }

        if (lifespan < 1 || lifespan > 120) {
            alert("Lifespan must be between 1 and 120 years.");
            lifespanInput.value = "90";
            return;
        }

        const weeksPassed = calculateWeeksPassed(birthDate, today);
        renderGrid(weeksPassed, totalWeeks, birthDate);

    } catch (error) {
        console.error("Error processing date:", error);
        alert("Invalid date format. Please try again.");
        weeksGrid.innerHTML = '';
    }
}

// --- Event Listeners ---
birthdateInput.addEventListener('change', updateVisualization);
lifespanInput.addEventListener('change', updateVisualization);
lifespanInput.addEventListener('input', updateVisualization);
showEventsToggle.addEventListener('change', updateVisualization);
showPhasesToggle.addEventListener('change', updateVisualization);
