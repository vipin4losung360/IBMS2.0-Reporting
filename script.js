// ***************************************************************
// *** ACTION REQUIRED: UPDATE THIS LINE WITH YOUR PROXIED CSV URL ***
// ***************************************************************
const CSV_URL = 'https://cors-anywhere.herokuapp.com/https://docs.google.com/spreadsheets/d/e/2PACX-1vS28maOKEZTzlyYj1aNBCQueFiOXycVN_JkQcjPVPl1XFHWTjTel9FA0n0o7GEWAU1Wk93lt4hOMY1s/pub?gid=1596417357&single=true&output=csv'; 

// Helper function to convert MM-DD-YYYY to DD-MM-YYYY
function formatDate(dateString) {
    // Regex to match MM-DD-YYYY with optional time (HH:MM:SS)
    const regex = /(\d{1,2})-(\d{1,2})-(\d{4})(\s.*)?/;
    const match = dateString.match(regex);
    
    if (match) {
        // match[1] = MM, match[2] = DD, match[3] = YYYY, match[4] = optional time
        const month = match[1];
        const day = match[2];
        const year = match[3];
        const time = match[4] || ''; // Include time if present, otherwise empty string

        // Format: DD-MM-YYYY HH:MM:SS
        return `${day}-${month}-${year}${time}`;
    }
    return dateString; // Return original string if no date pattern is found
}


function loadCSV() {
    $.ajax({
        url: CSV_URL,
        dataType: "text",
        success: function(data) {
            
            const allRows = data.split(/\r?\n|\r/);
            const headers = allRows[0].split(',');
            // Remove the header row from the data array
            let rows = allRows.slice(1).map(row => row.split(','));

            // *** NEW: Loop through ALL rows and cells to apply date formatting ***
            rows = rows.map(row => 
                row.map(cell => formatDate(cell.trim()))
            );
            // *** END NEW SECTION ***

            // Prepare the structure for DataTables
            const columns = headers.map(header => ({
                title: header,
                data: headers.indexOf(header),
                orderable: false 
            }));
            
            // Initialize the DataTable
            const table = $('#myDataTable').DataTable({
                data: rows,
                columns: columns,
                
                dom: 'Btr', 
                paging: false, 
                searching: false, 
                order: [[ 0, 'asc' ]], 
                
                buttons: [
                    'csvHtml5',
                    'excelHtml5'
                ],
                
                // --- Custom Header/Filter/Sort Logic ---
                initComplete: function () {
                    const api = this.api();

                    api.columns().every(function (colIdx) {
                        const column = this;
                        const header = $(column.header());
                        const originalText = header.text();

                        header.html('');

                        const titleContainer = $('<div>')
                            .css({
                                'display': 'flex',
                                'justify-content': 'space-between',
                                'align-items': 'center',
                                'width': '100%'
                            })
                            .appendTo(header);

                        $('<span>').text(originalText).appendTo(titleContainer);

                        const controlsContainer = $('<div>')
                            .css('display', 'flex')
                            .appendTo(titleContainer);

                        // --- Add Sort Arrows (for manual sorting) ---
                        const sortAsc = $('<span>')
                            .html(' &#x25B2; ') 
                            .attr('title', 'Sort Ascending')
                            .css('cursor', 'pointer')
                            .on('click', function () {
                                column.order('asc').draw();
                            })
                            .appendTo(controlsContainer);

                        const sortDesc = $('<span>')
                            .html(' &#x25BC; ')
                            .attr('title', 'Sort Descending')
                            .css('cursor', 'pointer')
                            .on('click', function () {
                                column.order('desc').draw();
                            })
                            .appendTo(controlsContainer);


                        // --- Add Filter Dropdown (Spreadsheet style) ---
                        const select = $('<select><option value="">Filter</option></select>')
                            .appendTo(controlsContainer)
                            .css('margin-left', '5px') 
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
