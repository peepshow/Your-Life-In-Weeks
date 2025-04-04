import './style.css'
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import html2canvas from 'html2canvas';
// import 'tippy.js/themes/light.css'; // We are using a custom theme

// --- Constants ---
const WEEKS_IN_YEAR = 52;
const MONTHS_IN_YEAR = 12;
const EXPORT_WIDTH = 1080;
const EXPORT_HEIGHT = 1920;
const EXPORT_PADDING = 48; // var(--spacing-xxl)
const LIFESPAN = 80; // Fixed lifespan in years

const VIEW_MODES = {
  WEEKS: 'Weeks',
  MONTHS: 'Months',
  YEARS: 'Years'
};

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
    viewModeSelect: document.getElementById('viewMode'),
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

// --- State ---
let currentViewMode = VIEW_MODES.WEEKS; // Default to weeks view

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
 * Calculates the number of months between two dates
 * @param {Date} startDate - The start date
 * @param {Date} endDate - The end date
 * @returns {number} The number of months elapsed
 */
function calculateMonthsPassed(startDate, endDate) {
    let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
    months -= startDate.getMonth();
    months += endDate.getMonth();
    return months <= 0 ? 0 : months;
}

/**
 * Calculates the number of years between two dates
 * @param {Date} startDate - The start date
 * @param {Date} endDate - The end date
 * @returns {number} The number of years elapsed
 */
function calculateYearsPassed(startDate, endDate) {
    const years = endDate.getFullYear() - startDate.getFullYear();
    // Adjust if the birthday hasn't happened yet this year
    if (endDate.getMonth() < startDate.getMonth() || 
       (endDate.getMonth() === startDate.getMonth() && endDate.getDate() < startDate.getDate())) {
        return Math.max(0, years - 1);
    }
    return Math.max(0, years);
}

/**
 * Finds events that occurred during a specific week
 * @param {Date} weekDate - The start date of the week to check
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
 * Finds events that occurred during a specific month
 * @param {Date} monthDate - A date within the month to check (typically the 1st)
 * @returns {Array} Array of events that occurred during that month
 */
function findEventsForMonth(monthDate) {
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    
    return historicalEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= monthStart && eventDate < monthEnd;
    });
}

/**
 * Finds events that occurred during a specific year
 * @param {Date} yearDate - A date within the year to check (typically the 1st)
 * @returns {Array} Array of events that occurred during that year
 */
function findEventsForYear(yearDate) {
    const yearStart = new Date(yearDate.getFullYear(), 0, 1); // January 1st
    const yearEnd = new Date(yearDate.getFullYear() + 1, 0, 1); // January 1st of next year
    
    return historicalEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= yearStart && eventDate < yearEnd;
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
 * Creates a unit element (week/month/year) with appropriate classes
 * @param {number} unitIndex - The index of the unit
 * @param {number} unitsPassed - Number of units that have passed
 * @param {Date | null} birthDate - The user's birth date
 * @param {string} viewMode - The current view mode (Weeks, Months, Years)
 * @returns {HTMLElement} The unit element
 */
function createUnitElement(unitIndex, unitsPassed, birthDate, viewMode) {
    const unitElement = document.createElement('div');
    unitElement.classList.add('unit');

    // Apply phase class if phase toggle is checked (regardless of view mode)
    if (elements.showPhasesToggle.checked) {
        // Calculate age in years based on the current view mode
        let ageInYears;
        if (viewMode === VIEW_MODES.WEEKS) {
            ageInYears = unitIndex / WEEKS_IN_YEAR;
        } else if (viewMode === VIEW_MODES.MONTHS) {
            ageInYears = unitIndex / MONTHS_IN_YEAR;
        } else { // Years view
            ageInYears = unitIndex;
        }
        
        // Find and apply the corresponding phase class
        const phaseIndex = lifePhases.findIndex(phase => 
            ageInYears >= phase.startAge && ageInYears < phase.endAge
        );
        if (phaseIndex !== -1) {
            unitElement.classList.add(lifePhases[phaseIndex].className);
        }
    }

    // Mark as past if applicable and birthDate is set
    if (birthDate && unitIndex < unitsPassed) {
        unitElement.classList.add('past');
    }

    // Event marker logic (Weeks, Months, and Years views)
    const shouldShowEvents = elements.showEventsToggle.checked && birthDate && 
                             (viewMode === VIEW_MODES.WEEKS || viewMode === VIEW_MODES.MONTHS || viewMode === VIEW_MODES.YEARS);
                             
    if (shouldShowEvents) {
        let unitStartDate;
        let findEventsFunction;

        if (viewMode === VIEW_MODES.WEEKS) {
            unitStartDate = new Date(birthDate);
            unitStartDate.setDate(birthDate.getDate() + (unitIndex * 7));
            findEventsFunction = findEventsForWeek;
        } else if (viewMode === VIEW_MODES.MONTHS) {
            unitStartDate = new Date(birthDate.getFullYear(), birthDate.getMonth() + unitIndex, 1);
            findEventsFunction = findEventsForMonth;
        } else { // Years view
            unitStartDate = new Date(birthDate.getFullYear() + unitIndex, 0, 1); // January 1st of the target year
            findEventsFunction = findEventsForYear;
        }
        
        const events = findEventsFunction(unitStartDate);
        
        if (events.length > 0) {
            unitElement.classList.add('event');
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
            
            const contentContainer = document.createElement('div');
            contentContainer.className = 'week-content'; // Keep class for styling consistency
            unitElement.appendChild(contentContainer);
            
            tippy(unitElement, {
                content: eventDetails,
                allowHTML: true,
                maxWidth: window.innerWidth < 768 ? 250 : 300,
                interactive: true,
                onShow(instance) {
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

    return unitElement;
}

/**
 * Renders the life grid based on the selected view mode
 * @param {number} unitsPassed - Number of units (weeks/months/years) that have passed
 * @param {number} totalUnits - Total number of units in the lifespan
 * @param {Date | null} birthDate - The user's birth date
 * @param {string} viewMode - The current view mode (Weeks, Months, Years)
 */
function renderGrid(unitsPassed, totalUnits, birthDate, viewMode) {
    // Update the main title
    const titleElement = elements.exportFrame.querySelector('.export-header h1');
    if (titleElement) {
        titleElement.textContent = `My Life in ${viewMode}`;
    }
    
    // Calculate lifespan for logging (still based on years)
    const lifespanYears = (viewMode === VIEW_MODES.YEARS) ? totalUnits : 
                       (viewMode === VIEW_MODES.MONTHS) ? totalUnits / MONTHS_IN_YEAR : 
                       totalUnits / WEEKS_IN_YEAR;
    
    // Clear previous grid and tooltips
    elements.weeksGrid.innerHTML = '';
    const oldTippyInstances = document.querySelectorAll('[data-tippy-root]');
    oldTippyInstances.forEach(instance => instance._tippy && instance._tippy.destroy());

    // Set view mode class on grid container
    elements.weeksGrid.className = `grid-container grid-view-${viewMode.toLowerCase()}`;

    // Determine if we need to render phases (Weeks, Months, or Years view)
    const shouldRenderPhases = (viewMode === VIEW_MODES.WEEKS || viewMode === VIEW_MODES.MONTHS || viewMode === VIEW_MODES.YEARS) 
                               && elements.showPhasesToggle.checked;

    // The main container for grid content
    const weeksContainer = document.createElement('div');
    weeksContainer.className = 'weeks-container'; 

    let currentPhaseWeeksContainer = null;
    let currentPhaseIndex = -1;

    // Create and add unit elements
    for (let i = 0; i < totalUnits; i++) {
        const unitElement = createUnitElement(i, unitsPassed, birthDate, viewMode);

        if (shouldRenderPhases) {
            // Calculate age based on view mode
            let ageInYears;
            if (viewMode === VIEW_MODES.WEEKS) {
                ageInYears = i / WEEKS_IN_YEAR;
            } else if (viewMode === VIEW_MODES.MONTHS) {
                ageInYears = i / MONTHS_IN_YEAR;
            } else { // Years view
                ageInYears = i;
            }
            
            const phaseIndex = lifePhases.findIndex(phase => 
                ageInYears >= phase.startAge && ageInYears < phase.endAge
            );

            if (phaseIndex !== -1 && phaseIndex !== currentPhaseIndex) {
                // Create and add phase separator
                const phaseSeparator = createPhaseSeparator(lifePhases[phaseIndex]);
                weeksContainer.appendChild(phaseSeparator);

                // Create a new container for this phase's units
                currentPhaseWeeksContainer = document.createElement('div');
                currentPhaseWeeksContainer.className = 'phase-weeks'; // Keep this class
                weeksContainer.appendChild(currentPhaseWeeksContainer);
                
                currentPhaseIndex = phaseIndex;
            }

            // Add unit to the current phase container (if it exists)
            if (currentPhaseWeeksContainer) {
                currentPhaseWeeksContainer.appendChild(unitElement);
            }
        } else {
            // No phases: Need a single container for all units
            if (!currentPhaseWeeksContainer) {
                 // Create the container if it doesn't exist
                currentPhaseWeeksContainer = document.createElement('div');
                 // Apply appropriate class based on view mode for column styling
                currentPhaseWeeksContainer.className = `phase-weeks view-${viewMode.toLowerCase()}`;
                weeksContainer.appendChild(currentPhaseWeeksContainer);
                currentPhaseIndex = 0; // Mark as having a container
            }
            currentPhaseWeeksContainer.appendChild(unitElement);
        }
    }
    
    elements.weeksGrid.appendChild(weeksContainer);
    
    console.log(`Grid rendered: ${unitsPassed} ${viewMode} passed out of ${totalUnits} total ${viewMode} (${lifespanYears} years)`);
}

/**
 * Exports the visualization as an image
 * @returns {Promise<void>}
 */
async function exportImage() {
    const exportFrame = document.getElementById('exportFrame');
    const saveButton = document.querySelector('.save-button');
    
    try {
        // Disable save button and show loading state
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
        
        // Add export mode class for correct dimensions
        exportFrame.classList.add('export-mode');
        
        // Wait longer for export mode to be applied
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Capture the frame
        const canvas = await html2canvas(exportFrame, {
            width: EXPORT_WIDTH,
            height: EXPORT_HEIGHT,
            scale: 2, // Higher quality
            useCORS: true,
            backgroundColor: null, // Preserve transparency
            logging: true, // Enable logging for debugging
            onclone: (clonedDoc) => {
                // Apply export mode styles to the cloned document
                const clonedExportFrame = clonedDoc.getElementById('exportFrame');
                if (clonedExportFrame) {
                    // Add export mode class to ensure proper styling
                    clonedExportFrame.classList.add('export-mode');
                    
                    // Create a style element to override responsive styles
                    const styleOverride = clonedDoc.createElement('style');
                    styleOverride.textContent = `
                        /* Force desktop styling in export mode */
                        .export-frame.export-mode {
                            width: ${EXPORT_WIDTH}px !important;
                            height: ${EXPORT_HEIGHT}px !important;
                            padding: ${EXPORT_PADDING}px !important;
                            box-sizing: border-box !important;
                            transform: none !important;
                            margin: 0 !important;
                            max-width: none !important;
                            max-height: none !important;
                            --header-height: 250px !important;
                            --footer-height: 250px !important;
                        }
                        
                        /* Force fixed header/footer heights */
                        .export-frame.export-mode .export-header {
                            height: 250px !important;
                            min-height: 250px !important;
                            flex-shrink: 0 !important;
                            display: flex !important;
                            flex-direction: column !important;
                            justify-content: flex-end !important;
                        }
                        
                        .export-frame.export-mode .export-footer {
                            height: 250px !important;
                            min-height: 250px !important;
                            flex-shrink: 0 !important;
                            display: flex !important;
                            flex-direction: column !important;
                            justify-content: flex-start !important;
                        }
                        
                        /* Phase weeks and unit sizing */
                        .export-frame.export-mode .phase-weeks {
                            flex: none !important;
                            display: grid !important;
                            grid-auto-rows: 1fr !important;
                            gap: var(--grid-gap) !important;
                            min-height: 0 !important;
                        }
                        
                        .export-frame.export-mode .grid-view-weeks .phase-weeks,
                        .export-frame.export-mode .phase-weeks.view-weeks {
                            grid-template-columns: repeat(52, 1fr) !important;
                        }
                        
                        .export-frame.export-mode .grid-view-months .phase-weeks,
                        .export-frame.export-mode .phase-weeks.view-months {
                            grid-template-columns: repeat(24, 1fr) !important;
                        }
                        
                        .export-frame.export-mode .grid-view-years .phase-weeks,
                        .export-frame.export-mode .phase-weeks.view-years {
                            grid-template-columns: repeat(10, 1fr) !important;
                        }
                        
                        .export-frame.export-mode .unit {
                            aspect-ratio: 1/1 !important;
                            min-width: 0 !important;
                            min-height: 0 !important;
                        }
                        
                        .export-frame.export-mode .unit::after {
                            content: "" !important;
                            display: block !important;
                            padding-bottom: 100% !important;
                        }
                        
                        /* Typography overrides - use non-fluid fixed sizes */
                        .export-frame.export-mode h1 {
                            font-size: 80px !important;
                            line-height: 1.1 !important;
                        }
                        
                        .export-frame.export-mode .tagline {
                            font-size: 64px !important;
                            line-height: 1.2 !important;
                        }
                        
                        .export-frame.export-mode .phase-name {
                            font-size: 14px !important;
                        }
                        
                        .export-frame.export-mode .phase-duration {
                            font-size: 12px !important;
                        }
                        
                        .export-frame.export-mode .credits {
                            font-size: 14px !important;
                        }
                        
                        /* Disable any media queries */
                        @media (max-width: 1024px) {
                            .export-frame.export-mode {
                                transform: none !important;
                                margin: 0 !important;
                            }
                        }
                        
                        @media (max-width: 768px) {
                            .export-frame.export-mode {
                                transform: none !important;
                                margin: 0 !important;
                            }
                        }
                    `;
                    
                    // Add the style element to the cloned document
                    clonedDoc.head.appendChild(styleOverride);
                    
                    // Force explicit dimensions and styling
                    clonedExportFrame.style.width = `${EXPORT_WIDTH}px`;
                    clonedExportFrame.style.height = `${EXPORT_HEIGHT}px`;
                    clonedExportFrame.style.padding = `${EXPORT_PADDING}px`;
                    clonedExportFrame.style.boxSizing = 'border-box';
                    clonedExportFrame.style.display = 'flex';
                    clonedExportFrame.style.flexDirection = 'column';
                    clonedExportFrame.style.transform = 'none';
                    clonedExportFrame.style.margin = '0';
                    
                    // Apply styles to content wrapper
                    const contentWrapper = clonedExportFrame.querySelector('.content-wrapper');
                    if (contentWrapper) {
                        contentWrapper.style.flex = '1';
                        contentWrapper.style.display = 'flex';
                        contentWrapper.style.flexDirection = 'column';
                        contentWrapper.style.height = `${EXPORT_HEIGHT - (2 * EXPORT_PADDING) - 500}px`; // 500px = header (250px) + footer (250px)
                        contentWrapper.style.overflow = 'hidden';
                    }
                    
                    // Apply styles to grid container
                    const gridContainer = clonedExportFrame.querySelector('.grid-container');
                    if (gridContainer) {
                        gridContainer.style.flex = '1';
                        gridContainer.style.display = 'flex';
                        gridContainer.style.flexDirection = 'column';
                        gridContainer.style.minHeight = '0';
                        gridContainer.style.overflow = 'hidden';
                        gridContainer.style.width = '100%';
                        gridContainer.style.maxWidth = 'none';
                        gridContainer.style.margin = '0';
                        gridContainer.style.padding = '20px';
                    }
                    
                    // Apply styles to weeks container
                    const weeksContainer = clonedExportFrame.querySelector('.weeks-container');
                    if (weeksContainer) {
                        weeksContainer.style.flex = '1';
                        weeksContainer.style.display = 'flex';
                        weeksContainer.style.flexDirection = 'column';
                        weeksContainer.style.minHeight = '0';
                        weeksContainer.style.overflow = 'hidden';
                    }
                    
                    // Apply styles to phase-weeks containers
                    const phaseWeeksContainers = clonedExportFrame.querySelectorAll('.phase-weeks');
                    phaseWeeksContainers.forEach(container => {
                        // Remove flex: 1 and use grid properties instead
                        container.style.flex = 'none';
                        container.style.display = 'grid';
                        container.style.gridAutoRows = '1fr';
                        container.style.gap = 'var(--grid-gap)';
                        
                        // Keep the columns based on view mode
                        if (container.classList.contains('view-weeks') || 
                            container.closest('.grid-view-weeks')) {
                            container.style.gridTemplateColumns = 'repeat(52, 1fr)';
                        } else if (container.classList.contains('view-months') || 
                            container.closest('.grid-view-months')) {
                            container.style.gridTemplateColumns = 'repeat(24, 1fr)';
                        } else if (container.classList.contains('view-years') || 
                            container.closest('.grid-view-years')) {
                            container.style.gridTemplateColumns = 'repeat(10, 1fr)';
                        }
                    });
                    
                    // Ensure consistent unit sizing
                    const units = clonedExportFrame.querySelectorAll('.unit');
                    units.forEach(unit => {
                        unit.style.aspectRatio = '1/1';
                        unit.style.minWidth = '0';
                        unit.style.minHeight = '0';
                    });
                    
                    // Force typography to desktop sizes
                    const heading = clonedExportFrame.querySelector('h1');
                    if (heading) {
                        heading.style.fontSize = '80px';
                        heading.style.lineHeight = '1.1';
                        heading.style.textAlign = 'center';
                        heading.style.marginBottom = '12px';
                    }
                    
                    const tagline = clonedExportFrame.querySelector('.tagline');
                    if (tagline) {
                        tagline.style.fontSize = '64px';
                        tagline.style.lineHeight = '1.2';
                        tagline.style.textAlign = 'center';
                    }
                    
                    const phaseNames = clonedExportFrame.querySelectorAll('.phase-name');
                    phaseNames.forEach(name => {
                        name.style.fontSize = '14px';
                    });
                    
                    const phaseDurations = clonedExportFrame.querySelectorAll('.phase-duration');
                    phaseDurations.forEach(duration => {
                        duration.style.fontSize = '12px';
                    });
                    
                    const credits = clonedExportFrame.querySelector('.credits');
                    if (credits) {
                        credits.style.fontSize = '14px';
                    }
                    
                    // Set explicit heights for header and footer
                    const header = clonedExportFrame.querySelector('.export-header');
                    if (header) {
                        header.style.height = '250px';
                        header.style.minHeight = '250px';
                        header.style.flexShrink = '0';
                        header.style.display = 'flex';
                        header.style.flexDirection = 'column';
                        header.style.justifyContent = 'flex-end';
                    }
                    
                    const footer = clonedExportFrame.querySelector('.export-footer');
                    if (footer) {
                        footer.style.height = '250px';
                        footer.style.minHeight = '250px';
                        footer.style.flexShrink = '0';
                        footer.style.display = 'flex';
                        footer.style.flexDirection = 'column';
                        footer.style.justifyContent = 'flex-start';
                    }
                }
                
                // Ensure the cloned document has the same button state
                const clonedButton = clonedDoc.querySelector('.save-button');
                if (clonedButton) {
                    clonedButton.disabled = true;
                    clonedButton.textContent = 'Saving...';
                }
            }
        });
        
        // Remove export mode class
        exportFrame.classList.remove('export-mode');
        
        // Convert to blob and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 'my-life-in-weeks.png';
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            
            // Reset button state
            saveButton.disabled = false;
            saveButton.textContent = 'SAVE A COPY';
        }, 'image/png');
        
    } catch (error) {
        console.error('Export failed:', error);
        saveButton.disabled = false;
        saveButton.textContent = 'SAVE A COPY';
        exportFrame.classList.remove('export-mode');
    }
}

// --- Event Handlers ---

/**
 * Updates the grid when any input changes
 */
function updateGrid() {
    const birthDate = elements.birthdateInput.value ? new Date(elements.birthdateInput.value) : null;
    const today = new Date();

    let unitsPassed = 0;
    let totalUnits = 0;

    switch (currentViewMode) {
        case VIEW_MODES.MONTHS:
            unitsPassed = birthDate ? calculateMonthsPassed(birthDate, today) : 0;
            totalUnits = LIFESPAN * MONTHS_IN_YEAR;
            break;
        case VIEW_MODES.YEARS:
            unitsPassed = birthDate ? calculateYearsPassed(birthDate, today) : 0;
            totalUnits = LIFESPAN;
            break;
        case VIEW_MODES.WEEKS:
        default:
            unitsPassed = birthDate ? calculateWeeksPassed(birthDate, today) : 0;
            totalUnits = LIFESPAN * WEEKS_IN_YEAR;
            break;
    }
    
    renderGrid(unitsPassed, totalUnits, birthDate, currentViewMode);
}

// --- Event Listeners ---
elements.birthdateInput.addEventListener('change', updateGrid);
elements.showEventsToggle.addEventListener('change', updateGrid);
elements.showPhasesToggle.addEventListener('change', updateGrid);
elements.viewModeSelect.addEventListener('change', (event) => {
    currentViewMode = event.target.value;
    updateGrid();
});
elements.saveButton.addEventListener('click', exportImage);

// Initial render
console.log('Starting initial render...');
console.log('DOM Elements:', elements);
updateGrid();

