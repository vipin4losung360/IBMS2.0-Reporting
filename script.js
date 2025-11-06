// ***************************************************************
// *** ACTION REQUIRED: UPDATE THIS LINE WITH YOUR PROXIED CSV URL ***
// ***************************************************************
const CSV_URL = 'https://cors-anywhere.herokuapp.com/https://docs.google.com/spreadsheets/d/e/2PACX-1vS28maOKEZTzlyYj1aNBCQueFiOXycVN_JkQcjPVPl1XFHWTjTel9FA0n0o7GEWAU1Wk93lt4hOMY1s/pub?gid=1596417357&single=true&output=csv'; 

function loadCSV() {
    $.ajax({
        url: CSV_URL,
        dataType: "text",
        success: function(data) {
            
            const allRows = data.split(/\r?\n|\r/);
            const headers = allRows[0].split(',');
            const rows = allRows.slice(1).map(row => row.split(','));

            // Prepare the structure for DataTables
            const columns = headers.map(header => ({
                title: header,
                data: headers.indexOf(header),
                // *** CORRECTION: Disable sorting by clicking the header area ***
                orderable: false 
            }));
            
            // Initialize the DataTable
            const table = $('#myDataTable').DataTable({
                data: rows,
                columns: columns,
                
                dom: 'Btr', // (B)uttons, (t)able, (r)emaining processing
                paging: false, // Single-page view
                searching: false, // Disable global search
                order: [[ 0, 'asc' ]], // Default sort on first column
                
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

                        // 1. Clear the header content
                        header.html('');

                        // 2. Create a container for the title and controls
                        const titleContainer = $('<div>')
                            .css({
                                'display': 'flex',
                                'justify-content': 'space-between',
                                'align-items': 'center',
                                'width': '100%'
                            })
                            .appendTo(header);

                        // 3. Add the header title
                        $('<span>').text(originalText).appendTo(titleContainer);

                        // 4. Create a container for the sort arrows and filter dropdown
                        const controlsContainer = $('<div>')
                            .css('display', 'flex')
                            .appendTo(titleContainer);

                        // --- Add Sort Arrows (for manual sorting) ---
                        const sortAsc = $('<span>')
                            .html(' &#x25B2; ') // Up arrow
                            .attr('title', 'Sort Ascending')
                            .css('cursor', 'pointer')
                            .on('click', function () {
                                column.order('asc').draw();
                            })
                            .appendTo(controlsContainer);

                        const sortDesc = $('<span>')
                            .html(' &#x25BC; ') // Down arrow
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
                                // Search performs exact match filtering
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
