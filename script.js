// ***************************************************************
// *** ACTION REQUIRED: UPDATE THIS LINE WITH YOUR PROXIED CSV URL ***
// ***************************************************************
const CSV_URL = 'https://cors-anywhere.herokuapp.com/https://docs.google.com/spreadsheets/d/e/2PACX-1vS28maOKEZTzlyYj1aNBCQueFiOXycVN_JkQcjPVPl1XFHWTjTel9FA0n0o7GEWAU1Wk93lt4hOMY1s/pub?gid=1596417357&single=true&output=csv'; 

// *** 🌟 MASTER LIST OF ALL HEADERS IN THE CORRECT DISPLAY ORDER 🌟 ***
// This list dictates the order the columns will appear in the table AND the CSV export.
const MASTER_HEADERS = [
    "Row ID", // This will now map to the value in the CSV's original first column (index 0)
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

// *** DATE COLUMNS FOR TARGETED FORMATTING ***
const DATE_HEADERS = [
    "Gate In Time", 
    "On Dock Time", 
    "Unloading Start Time", 
    "Unloading End Time", 
    "Gate Out Time",
    "Notification Date",
    "Requisite Date", 
    "Scheduled Date"
];

// Helper function to convert MM/DD/YYYY to DD-MMM-YYYY
function formatDate(dateString) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const regex = /(\d{1,2})\/(\d{1,2})\/(\d{4})(\s.*)?/;
    const match = dateString.match(regex);
    
    if (match) {
        let monthIndex = parseInt(match[1]) - 1;
        const day = match[2];
        const year = match[3];
        const time = match[4] ? match[4].trim() : '';
        const monthAbbr = monthNames[monthIndex];

        let formattedDate = `${day}-${monthAbbr}-${year}`;
        if (time) {
             formattedDate += ` ${time}`;
        }
        return formattedDate;
    }
    return dateString;
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
            // The first column data is currently unlabeled in this map, but its index is 0.
            const headerIndexMap = new Map(csvHeaders.map((header, index) => [header, index]));

            // 2. Determine which headers in MASTER_HEADERS correspond to which original column index
            // This includes the implicit mapping of 'Row ID' to CSV index 0.
            const masterHeaderMap = new Map();
            MASTER_HEADERS.forEach((masterHeader, index) => {
                if (masterHeader === "Row ID") {
                    // Map 'Row ID' to the first column of the raw CSV data
                    masterHeaderMap.set(masterHeader, 0); 
                } else {
                    // Map all other headers by looking up their index in the CSV header list
                    const originalIndex = headerIndexMap.get(masterHeader);
                    if (originalIndex !== undefined) {
                        masterHeaderMap.set(masterHeader, originalIndex);
                    }
                }
            });

            // 3. Reconstruct the data rows according to the MASTER_HEADERS order
            let processedRows = dataRowsOnly
                .filter(row => row.trim() !== '')
                .map((row, rowIndex) => {
                    const originalCells = row.split(',');
                    const newRow = []; 
                    
                    // Iterate through MASTER_HEADERS in the desired display order
                    MASTER_HEADERS.forEach(masterHeader => {
                        // Find the original index for this master header
                        const originalIndex = masterHeaderMap.get(masterHeader);
                        let cellValue = '';

                        if (originalIndex !== undefined && originalCells[originalIndex] !== undefined) {
                            cellValue = originalCells[originalIndex].trim();
                        }
                        
                        // Check if this column needs date formatting (including the date fix)
                        if (DATE_HEADERS.includes(masterHeader)) {
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
                orderable: !DATE_HEADERS.includes(header) // Keep date columns not orderable if they contain custom format
            }));

            // Initialize the DataTable
            const table = $('#myDataTable').DataTable({
                data: processedRows, 
                columns: columns,
                
                dom: 'Btr',
                paging: false,
                searching: false,
                order: [[ 0, 'asc' ]], // Default sort on Row ID (the actual data value)
                
                // --- Download Button Fix ---
                buttons: [
                    {
                        extend: 'csvHtml5',
                        customize: function(csv) {
                            const rows = csv.split('\n');
                            rows[0] = '"' + MASTER_HEADERS.join('","') + '"';
                            return rows.join('\n');
                        }
                    }
                ],
                // --- End Download Button Fix ---
                
                // Forcefully clear all header cells before custom rendering
                headerCallback: function( thead, data, start, end, display ) {
                    $(thead).find('th').empty();
                },
                
                // --- Custom Header/Filter/Sort Logic ---
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
