// ***************************************************************
// *** ACTION REQUIRED: UPDATE THIS LINE WITH YOUR PROXIED CSV URL ***
// ***************************************************************
const CSV_URL = 'https://cors-anywhere.herokuapp.com/https://docs.google.com/spreadsheets/d/e/2PACX-1vS28maOKEZTzlyYj1aNBCQueFiOXycVN_JkQcjPVPl1XFHWTjTel9FA0n0o7GEWAU1Wk93lt4hOMY1s/pub?gid=1596417357&single=true&output=csv'; 

// *** CORRECTION: HARD-CODED COLUMN TITLES IN CORRECT ORDER ***
const DESIRED_HEADERS = [
    "Appt ID (External)",
    "Vehicle Registration Number",
    "Vehicle Size",
    "Gate In Time",
    "No. of Invoices",
    "Units as Per Documents",
    "On Dock Time",
    "Good Units",
    "Damaged Units",
    "Short Units",
    "Total Units",
    "Manpower Deployed",
    "Unloading Start Time",
    "Unloading End Time",
    "Damaged Units Loaded",
    "Gate Out Time",
    "POD",
    "Validated",
    "CB",
    "Null Status",
    "Absconding"
];
// *************************************************************

// Helper function to convert MM/DD/YYYY to DD-MMM-YYYY
function formatDate(dateString) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Regex to match MM/DD/YYYY with optional time (HH:MM:SS) using the '/' separator
    const regex = /(\d{1,2})\/(\d{1,2})\/(\d{4})(\s.*)?/;
    const match = dateString.match(regex);
    
    if (match) {
        // match[1] = MM, match[2] = DD, match[3] = YYYY, match[4] = optional time
        let monthIndex = parseInt(match[1]) - 1; // Month is 0-indexed for array
        const day = match[2];
        const year = match[3];
        const time = match[4] ? match[4].trim() : ''; // Get time string if present

        // Get month abbreviation
        const monthAbbr = monthNames[monthIndex];

        // Format: DD-MMM-YYYY or DD-MMM-YYYY HH:MM:SS
        let formattedDate = `${day}-${monthAbbr}-${year}`;
        if (time) {
             formattedDate += ` ${time}`;
        }
        return formattedDate;
    }
    return dateString; // Return original string if no date pattern is found
}


function loadCSV() {
    $.ajax({
        url: CSV_URL,
        dataType: "text",
        success: function(data) {
            
            const allRows = data.split(/\r?\n|\r/);
            // *** CORRECTION: IGNORE the messy first row (headers) from CSV data ***
            // const headers = allRows[0].split(',').map(h => h.trim()); 
            // Start mapping the data from the second row (index 1)
            let rows = allRows.slice(1).map(row => row.split(','));

            // Loop through ALL rows and cells to apply date formatting
            rows = rows.map(row => 
                row.map(cell => formatDate(cell.trim()))
            );

            // Prepare the structure for DataTables
            // *** CORRECTION: Use the DESIRED_HEADERS array to create columns ***
            const columns = DESIRED_HEADERS.map((header, index) => ({
                title: header,
                data: index, // Since we are loading an array of arrays, data is the column index
                orderable: true // Re-enabling standard DataTables sorting
            }));
            
            // Initialize the DataTable
            const table = $('#myDataTable').DataTable({
                data: rows,
                columns: columns,
                
                dom: 'Btr', // (B)uttons, (t)able, (r)emaining processing
                paging: false, // Single-page view
                searching: false, // Disable global search
                order: [[ 0, 'asc' ]], // Default sort on first column
                
                // --- Download Button Fix: Optimized for speed and correct headers ---
                buttons: [
                    {
                        extend: 'csvHtml5',
                        header: true,
                        // Tell DataTables to use the column titles we defined above for the CSV export
                        exportOptions: {
                            stripHtml: false,
                            decodeEntities: false 
                        }
                    }
                ],
                // --- End Download Button Fix ---
                
                // --- Custom Header/Filter/Sort Logic ---
                initComplete: function () {
                    const api = this.api();

                    api.columns().every(function (colIdx) {
                        const column = this;
                        const header = $(column.header());
                        
                        // *** CORRECTION: Get the clean title directly from the DataTables config ***
                        // This ensures we get the text from the DESIRED_HEADERS array.
                        const originalText = columns[colIdx].title; 

                        // Clear the header content before rebuilding
                        header.html('');
                        // Disable DataTables default sorting classes on the <th>
                        header.removeClass('sorting sorting_asc sorting_desc');

                        const titleContainer = $('<div>')
                            .css({
                                'display': 'flex',
                                'justify-content': 'space-between',
                                'align-items': 'center',
                                'width': '100%',
                                'flex-wrap': 'nowrap' // Prevent wrapping
                            })
                            .appendTo(header);

                        // Use the clean original text for the display name
                        $('<span>').text(originalText)
                            .css({
                                'flex-shrink': '0' // Prevent title from shrinking
                            })
                            .appendTo(titleContainer);

                        const controlsContainer = $('<div>')
                            .css('display', 'flex')
                            .appendTo(titleContainer);

                        // --- Add Sort Arrows (using safe UTF-8 characters) ---
                        // Note: DataTables handles the actual sorting, these click handlers just trigger it
                        const sortAsc = $('<span>')
                            .html(' &#9650; ') // Black up-pointing triangle
                            .attr('title', 'Sort Ascending')
                            .css('cursor', 'pointer')
                            .on('click', function (e) {
                                e.stopPropagation(); // Prevent native sorting from triggering twice
                                column.order('asc').draw();
                            })
                            .appendTo(controlsContainer);

                        const sortDesc = $('<span>')
                            .html(' &#9660; ') // Black down-pointing triangle
                            .attr('title', 'Sort Descending')
                            .css('cursor', 'pointer')
                            .on('click', function (e) {
                                e.stopPropagation(); // Prevent native sorting from triggering twice
                                column.order('desc').draw();
                            })
                            .appendTo(controlsContainer);


                        // --- Add Filter Dropdown (Spreadsheet style) ---
                        const select = $('<select><option value="">Filter</option></select>')
                            .appendTo(controlsContainer)
                            .css({
                                'margin-left': '5px',
                                'max-width': '100px' // Add a max-width for better appearance
                            })
                            .on('change', function () {
                                const val = $.fn.dataTable.util.escapeRegex($(this).val());
                                column.search(val ? '^' + val + '$' : '', true, false).draw();
                            });
                        
                        // Populate the select list with unique values
                        column.data().unique().sort().each(function (d, j) {
                            select.append('<option value="' + d + '">' + d + '</option>');
                        });
                    });
                }
            });
            
            // Remove the 'Loading' message
            $('p').remove();
        },
        error: function() {
            console.log("AJAX Error: Data fetch failed.");
            $('p').html('Oops! Could not load the data. Please ensure you have **authorized the proxy** by visiting this link once: <a href="https://cors-anywhere.herokuapp.com/" target="_blank">https://cors-anywhere.herokuapp.com/</a>');
        }
    });
}

// Start the process when the page is ready
$(document).ready(function() {
    loadCSV();
});
