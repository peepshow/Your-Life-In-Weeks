import './style.css'
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import html2canvas from 'html2canvas';
// import 'tippy.js/themes/light.css'; // We are using a custom theme

// --- Constants ---
const WEEKS_IN_YEAR = 52;
const EXPORT_WIDTH = 1080;
const EXPORT_HEIGHT = 1920;
const EXPORT_PADDING = 48; // var(--spacing-xxl)
const LIFESPAN = 80; // Fixed lifespan in years

/**
 * Configuration for different life phases
 * @type {Array<{name: string, startAge: number, endAge: number, className: string}>}
 */
const lifePhases = [
    { name: 'Childhood', startAge: 0, endAge: 13, className: 'childhood' },
    { name: 'Adolescence', startAge: 13, endAge: 20, className: 'adolescence' },
    { name: 'Early Adulthood', startAge: 20, endAge: 40, className: 'early-adulthood' },
    { name: 'Middle Age', startAge: 40, endAge: 65, className: 'middle-age' },
    { name: 'Late Adulthood', startAge: 65, endAge: Infinity, className: 'late-adulthood' }
];

/**
 * Dataset of significant historical events
 * @type {Array<{date: string, title: string}>}
 */
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
const elements = {
    birthdateInput: document.getElementById('birthdate'),
    showEventsToggle: document.getElementById('showEvents'),
    showPhasesToggle: document.getElementById('showPhases'),
    weeksGrid: document.getElementById('weeksGrid'),
    saveButton: document.getElementById('saveButton'),
    exportFrame: document.getElementById('exportFrame')
};

// Configure default Tippy options
tippy.setDefaultProps({
    theme: 'custom',
    animation: 'shift-away',
    arrow: true,
    placement: 'top',
    duration: [200, 150],
    delay: [100, 0],
    maxWidth: 300,
    interactive: true,
    appendTo: () => document.body, // Ensures tooltips are always visible
    popperOptions: {
        modifiers: [{
            name: 'preventOverflow',
            options: {
                altAxis: true,
                padding: 10
            }
        }]
    }
});

// --- Helper Functions ---

/**
 * Calculates the number of weeks between two dates
 * @param {Date} startDate - The start date
 * @param {Date} endDate - The end date
 * @returns {number} The number of weeks elapsed
 */
function calculateWeeksPassed(startDate, endDate) {
    const msInWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.floor((endDate.getTime() - startDate.getTime()) / msInWeek);
}

/**
 * Finds events that occurred during a specific week
 * @param {Date} weekDate - The date of the week to check
 * @returns {Array} Array of events that occurred during that week
 */
function findEventsForWeek(weekDate) {
    const weekStart = new Date(weekDate);
    const weekEnd = new Date(weekDate);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    return historicalEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= weekStart && eventDate < weekEnd;
    });
}

/**
 * Creates a phase separator element
 * @param {Object} phase - The phase object containing name and age range
 * @returns {HTMLElement} The phase separator element
 */
function createPhaseSeparator(phase) {
    const phaseSeparator = document.createElement('div');
    phaseSeparator.className = 'phase-separator';
    
    const duration = phase.endAge === Infinity 
        ? `${phase.startAge}+ years`
        : `${phase.startAge}-${phase.endAge} years`;

    phaseSeparator.innerHTML = `
        <div class="phase-info">
            <span class="phase-name">${phase.name}</span>
            <span class="phase-duration">${duration}</span>
        </div>
    `;
    
    return phaseSeparator;
}

/**
 * Creates a container for phase weeks
 * @param {Array<HTMLElement>} weeks - Array of week elements
 * @returns {HTMLElement} The phase weeks container
 */
function createPhaseWeeksContainer(weeks) {
    const container = document.createElement('div');
    container.className = 'phase-weeks';
    weeks.forEach(week => container.appendChild(week));
    return container;
}

/**
 * Creates a week element with appropriate classes and event handlers
 * @param {number} weekIndex - The index of the week
 * @param {number} weeksPassed - Number of weeks that have passed
 * @param {Date} birthDate - The user's birth date
 * @returns {HTMLElement} The week element
 */
function createWeekElement(weekIndex, weeksPassed, birthDate) {
    const weekElement = document.createElement('div');
    weekElement.classList.add('week');

    const ageInYears = weekIndex / WEEKS_IN_YEAR;

    // Add phase class if enabled
    if (elements.showPhasesToggle.checked) {
        const phaseIndex = lifePhases.findIndex(phase => 
            ageInYears >= phase.startAge && ageInYears < phase.endAge
        );
        
        if (phaseIndex !== -1) {
            weekElement.classList.add(lifePhases[phaseIndex].className);
        }
    }

    // Mark as past if applicable
    if (weekIndex < weeksPassed) {
        weekElement.classList.add('past');
    }

    // Add event marker if enabled
    if (elements.showEventsToggle.checked) {
        const weekDate = new Date(birthDate);
        weekDate.setDate(weekDate.getDate() + (weekIndex * 7));
        
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
                maxWidth: window.innerWidth < 768 ? 250 : 300,
                interactive: true,
                onShow(instance) {
                    // Ensure tooltip is positioned within viewport
                    const rect = instance.reference.getBoundingClientRect();
                    if (window.innerWidth < 768) {
                        instance.setProps({
                            placement: rect.top < window.innerHeight / 2 ? 'bottom' : 'top'
                        });
                    }
                }
            });
        }
    }

    return weekElement;
}

/**
 * Renders the life weeks grid
 * @param {number} weeksPassed - Number of weeks that have passed
 * @param {number} totalWeeks - Total number of weeks in the lifespan
 * @param {Date} birthDate - The user's birth date
 */
function renderGrid(weeksPassed, totalWeeks, birthDate) {
    const lifespan = totalWeeks / WEEKS_IN_YEAR;
    
    // Clear previous grid and tooltips
    elements.weeksGrid.innerHTML = '';
    if (elements.weeksGrid._tippyInstances) {
        elements.weeksGrid._tippyInstances.forEach(instance => instance.destroy());
    }

    // Create containers
    const phasesAndGrid = document.createElement('div');
    phasesAndGrid.className = 'phases-and-grid';

    const weeksContainer = document.createElement('div');
    weeksContainer.className = 'weeks-container';

    let currentPhaseIndex = -1;
    let currentPhaseWeeks = [];

    // Create and add week elements
    for (let i = 0; i < totalWeeks; i++) {
        const weekElement = createWeekElement(i, weeksPassed, birthDate);
        
        if (elements.showPhasesToggle.checked) {
            const ageInYears = i / WEEKS_IN_YEAR;
            const phaseIndex = lifePhases.findIndex(phase => 
                ageInYears >= phase.startAge && ageInYears < phase.endAge
            );
            
            if (phaseIndex !== -1 && phaseIndex !== currentPhaseIndex) {
                // Add previous phase's weeks
                if (currentPhaseWeeks.length > 0) {
                    weeksContainer.appendChild(createPhaseWeeksContainer(currentPhaseWeeks));
                    currentPhaseWeeks = [];
                }

                // Add new phase separator
                currentPhaseIndex = phaseIndex;
                weeksContainer.appendChild(createPhaseSeparator(lifePhases[phaseIndex]));
            }
        }

        currentPhaseWeeks.push(weekElement);
    }

    // Add any remaining weeks
    if (currentPhaseWeeks.length > 0) {
        weeksContainer.appendChild(createPhaseWeeksContainer(currentPhaseWeeks));
    }

    // Assemble and add to DOM
    phasesAndGrid.appendChild(weeksContainer);
    elements.weeksGrid.appendChild(phasesAndGrid);
}

/**
 * Exports the visualization as an image
 * @returns {Promise<void>}
 */
async function exportImage() {
    try {
        // Show loading state
        const originalText = elements.saveButton.textContent;
        elements.saveButton.textContent = 'Exporting...';
        elements.saveButton.disabled = true;

        // Capture the export frame
        const canvas = await html2canvas(elements.exportFrame, {
            width: EXPORT_WIDTH,
            height: EXPORT_HEIGHT,
            scale: 2, // Render at 2x for better quality
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
        });

        // Convert to blob
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png', 1.0);
        });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'my-life-in-weeks.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Reset button state
        elements.saveButton.textContent = originalText;
        elements.saveButton.disabled = false;
    } catch (error) {
        console.error('Error exporting image:', error);
        alert('Failed to export image. Please try again.');
        // Reset button state
        elements.saveButton.textContent = originalText;
        elements.saveButton.disabled = false;
    }
}

// --- Event Handlers ---

/**
 * Updates the grid when any input changes
 */
function updateGrid() {
    console.log('Updating grid...');
    const birthDate = new Date(elements.birthdateInput.value);
    const totalWeeks = LIFESPAN * WEEKS_IN_YEAR;
    const weeksPassed = calculateWeeksPassed(birthDate, new Date());
    
    console.log('Grid parameters:', {
        birthDate,
        lifespan: LIFESPAN,
        totalWeeks,
        weeksPassed
    });
    
    renderGrid(weeksPassed, totalWeeks, birthDate);
}

// --- Event Listeners ---
elements.birthdateInput.addEventListener('change', updateGrid);
elements.showEventsToggle.addEventListener('change', updateGrid);
elements.showPhasesToggle.addEventListener('change', updateGrid);
elements.saveButton.addEventListener('click', exportImage);

// Initial render
console.log('Starting initial render...');
console.log('DOM Elements:', elements);
updateGrid();
