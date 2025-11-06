// ***************************************************************
// *** ACTION REQUIRED: UPDATE THIS LINE WITH YOUR PROXIED CSV URL ***
// ***************************************************************
const CSV_URL = 'https://cors-anywhere.herokuapp.com/https://docs.google.com/spreadsheets/d/e/2PACX-1vS28maOKEZTzlyYj1aNBCQueFiOXycVN_JkQcjPVPl1XFHWTjTel9FA0n0o7GEWAU1Wk93lt4hOMY1s/pub?gid=1596417357&single=true&output=csv'; 

// *** 🌟 MASTER LIST OF ALL HEADERS IN THE CORRECT DISPLAY ORDER 🌟 ***
const MASTER_HEADERS = [
    "Row ID",
    "Appt Type", 
    "FC", 
    "Client", 
    "Brand",
    "Item Classification", 
    "Units", 
    "Notification Date",
    "Requisite Date", 
    "Scheduled Date",
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

// *** DATE AND DATE-TIME COLUMNS FOR TARGETED FORMATTING ***
const DATE_HEADERS = [
    "Notification Date",
    "Requisite Date", 
    "Scheduled Date",
    "Gate In Time", 
    "On Dock Time", 
    "Unloading Start Time", 
    "Unloading End Time", 
    "Gate Out Time"
];

// Helper function to convert MM/DD/YYYY [HH:MM:SS] to DD-MMM-YYYY [HH:MM:SS]
function formatDate(dateString) {
    // 1. Strip leading/trailing quotes and trim whitespace
    let cleanDateString = dateString.replace(/^"|"$/g, '').trim();

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Regex handles various M/D/YYYY formats with optional time
    // Group 1: Month (1 or 2 digits)
    // Group 2: Day (1 or 2 digits)
    // Group 3: Year (4 digits)
    // Group 4: Optional Time/rest of the string
    const regex = /(\d{1,2})\/(\d{1,2})\/(\d{4})(.*)?/;
    const match = cleanDateString.match(regex);
    
    if (match) {
        // match[1] = MM, match[2] = DD, match[3] = YYYY
        let monthIndex = parseInt(match[1]) - 1;
        // Ensure day is padded for DD format
        const day = match[2].padStart(2, '0');
        const year = match[3];
        
        // Match[4] contains the time/rest (if present)
        const time = match[4] ? match[4].trim() : '';
        const monthAbbr = monthNames[monthIndex];

        let formattedDate = `${day}-${monthAbbr}-${year}`;
        if (time) {
             formattedDate += ` ${time}`;
        }
        return formattedDate;
    }
    // If the regex doesn't match, return the cleaned string
    return cleanDateString; 
}

function loadCSV() {
    $.ajax({
        url: CSV_URL,
        dataType: "text",
        success: function(data) {
            
            const allRows = data.split(/\r?\n|\r/);
            const dataRowsOnly = allRows.slice(1); 
            const csvHeaders = allRows[0].split(',').map(h => h.trim());

            // 1. Create a map for quick lookup of original CSV index by header name
            const headerIndexMap = new Map(csvHeaders.map((header, index) => [header, index]));

            // 2. Map MASTER_HEADERS to the original CSV column index (including Row ID = index 0)
            const masterHeaderMap = new Map();
            MASTER_HEADERS.forEach(masterHeader => {
                let originalIndex;
                if (masterHeader === "Row ID") {
                    originalIndex = 0; // Map 'Row ID' to the raw CSV's first column
                } else {
                    originalIndex = headerIndexMap.get(masterHeader);
                }
                if (originalIndex !== undefined) {
                    masterHeaderMap.set(masterHeader, originalIndex);
                }
            });

            // 3. Reconstruct the data rows according to the MASTER_HEADERS order and apply formatting
            let processedRows = dataRowsOnly
                .filter(row => row.trim() !== '')
                .map(row => {
                    // Splitting handles standard CSV, but we use the map to correctly locate data
                    const originalCells = row.split(',');
                    const newRow = []; 
                    
                    MASTER_HEADERS.forEach(masterHeader => {
                        const originalIndex = masterHeaderMap.get(masterHeader);
                        let cellValue = '';

                        if (originalIndex !== undefined && originalCells[originalIndex] !== undefined) {
                            // Trim the raw cell value
                            cellValue = originalCells[originalIndex].trim();
                        }
                        
                        // Apply date formatting to all identified date/time columns
                        if (DATE_HEADERS.includes(masterHeader)) {
                            // Use the new, robust formatDate function
                            cellValue = formatDate(cellValue);
                        }
                        
                        newRow.push(cellValue);
                    });
                    
                    return newRow;
                });
            
            // 4. Prepare the DataTables columns based on MASTER_HEADERS
            const columns = MASTER_HEADERS.map((header, index) => ({
                title: header,
                data: index,
                orderable: !DATE_HEADERS.includes(header)
            }));

            // Initialize the DataTable
            const table = $('#myDataTable').DataTable({
                data: processedRows, 
                columns: columns,
                
                dom: 'Btr',
                paging: false,
                searching: false,
                order: [[ 0, 'asc' ]],
                
                // --- CSV Download Fix (Unchanged) ---
                buttons: [
                    {
                        extend: 'csvHtml5',
                        customize: function(csv) {
                            const rows = csv.split('\n');
                            rows[0] = '"' + MASTER_HEADERS.join('","') + '"';
                            return rows.join('\n');
                        },
                        exportOptions: {
                            modifier: {
                                page: 'all', 
                                search: 'applied' 
                            },
                            format: {
                                body: function ( data, row, column, node ) {
                                    return $(node).html();
                                }
                            }
                        }
                    }
                ],
                // --- End CSV Download Fix ---
                
                // Forcefully clear all header cells before custom rendering
                headerCallback: function( thead, data, start, end, display ) {
                    $(thead).find('th').empty();
                },
                
                // --- Custom Header/Filter/Sort Logic (Unchanged) ---
                initComplete: function () {
                    const api = this.api();

                    api.columns().every(function (colIdx) {
                        const column = this;
                        const header = $(column.header());
                        const originalText = MASTER_HEADERS[colIdx];

                        header.html('');
                        header.removeClass('sorting sorting_asc sorting_desc');

                        const titleContainer = $('<div>')
                            .css({
                                'display': 'flex',
                                'justify-content': 'space-between',
                                'align-items': 'center',
                                'width': '100%',
                                'flex-wrap': 'nowrap'
                            })
                            .appendTo(header);

                        $('<span>').text(originalText)
                            .css({'flex-shrink': '0'})
                            .appendTo(titleContainer);

                        // Only add controls if it's NOT a custom date column
                        if (!DATE_HEADERS.includes(originalText)) {
                            const controlsContainer = $('<div>')
                                .css('display', 'flex')
                                .appendTo(titleContainer);

                            // --- Add Sort Arrows ---
                            $('<span>')
                                .html(' &#x25B2; ')
                                .attr('title', 'Sort Ascending')
                                .css('cursor', 'pointer')
                                .on('click', function (e) {
                                    e.stopPropagation();
                                    column.order('asc').draw();
                                })
                                .appendTo(controlsContainer);

                            $('<span>')
                                .html(' &#x25BC; ')
                                .attr('title', 'Sort Descending')
                                .css('cursor', 'pointer')
                                .on('click', function (e) {
                                    e.stopPropagation(); 
                                    column.order('desc').draw();
                                })
                                .appendTo(controlsContainer);


                            // --- Add Filter Dropdown ---
                            const select = $('<select><option value="">Filter</option></select>')
                                .appendTo(controlsContainer)
                                .css('margin-left', '5px') 
                                .on('change', function () {
                                    const val = $.fn.dataTable.util.escapeRegex($(this).val());
                                    column.search(val ? '^' + val + '$' : '', true, false).draw();
                                });
                            
                            // Populate the select list with unique values
                            column.data().unique().sort().each(function (d, j) {
                                if(d !== null && d.toString().trim() !== '') {
			                        select.append('<option value="' + d + '">' + d + '</option>');
                                }
                            });
                        }
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
