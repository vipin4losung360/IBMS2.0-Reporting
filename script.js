// ***************************************************************
// *** ACTION REQUIRED: UPDATE THIS LINE WITH YOUR PROXIED CSV URL ***
// ***************************************************************
const CSV_URL = 'https://cors-anywhere.herokuapp.com/https://docs.google.com/spreadsheets/d/e/2PACX-1vS28maOKEZTzlyYj1aNBCQueFiOXycVN_JkQcjPVPl1XFHWTjTel9FA0n0o7GEWAU1Wk93lt4hOMY1s/pub?gid=1596417357&single=true&output=csv'; 

// *** HARD-CODED COLUMN TITLES IN CORRECT ORDER ***
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
            // Remove the header row from data sent to DataTables
            const dataRowsOnly = allRows.slice(1);
            
            // Split the remaining rows into cells (array of arrays)
            let rows = dataRowsOnly.map(row => row.split(','));

            // Loop through ALL rows and cells to apply date formatting
            rows = rows.map(row => 
                row.map(cell => formatDate(cell.trim()))
            );

            // Prepare the structure for DataTables
            const columns = DESIRED_HEADERS.map((header, index) => ({
                title: header,
                data: index, // Data is the column index
                orderable: true 
            }));
            
            // Initialize the DataTable
            const table = $('#myDataTable').DataTable({
                data: rows,
                columns: columns,
                
                dom: 'Btr',
                paging: false,
                searching: false,
                order: [[ 0, 'asc' ]],

                // 🌟 CSV DOWNLOAD FIX IS HERE 🌟
                buttons: [
                    {
                        extend: 'csvHtml5',
                        header: true,
                        exportOptions: {
                            // CRITICAL FIX: Strip all HTML from the exported data (including the header)
                            stripHtml: true, 
                            decodeEntities: true,
                            // Ensure data rows are also cleaned if necessary (though the header is the main issue)
                            format: {
                                header: function ( data, column, row ) {
                                    // Use a temporary div to strip HTML, then trim and return plain text
                                    const tempDiv = document.createElement("div");
                                    tempDiv.innerHTML = data;
                                    return tempDiv.textContent || tempDiv.innerText || "";
                                }
                            }
                        }
                    }
                ],
                // 🌟 END CSV DOWNLOAD FIX 🌟
                
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
                        const originalText = columns[colIdx].title; 

                        // Clear the header content (already done by headerCallback, but good for safety)
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

                        // Use the clean original text for the display name
                        $('<span>').text(originalText)
                            .css({'flex-shrink': '0'})
                            .appendTo(titleContainer);

                        const controlsContainer = $('<div>')
                            .css('display', 'flex')
                            .appendTo(titleContainer);

                        // --- Add Sort Arrows (using safe UTF-8 characters) ---
                        $('<span>')
                            .html(' &#9650; ') // Up Arrow
                            .attr('title', 'Sort Ascending')
                            .css('cursor', 'pointer')
                            .on('click', function (e) {
                                e.stopPropagation();
                                column.order('asc').draw();
                            })
                            .appendTo(controlsContainer);

                        $('<span>')
                            .html(' &#9660; ') // Down Arrow
                            .attr('title', 'Sort Descending')
                            .css('cursor', 'pointer')
                            .on('click', function (e) {
                                e.stopPropagation(); 
                                column.order('desc').draw();
                            })
                            .appendTo(controlsContainer);

                        // --- Add Filter Dropdown (Spreadsheet style) ---
                        const select = $('<select><option value="">Filter</option></select>')
                            .appendTo(controlsContainer)
                            .css({
                                'margin-left': '5px',
                                'max-width': '100px' 
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
