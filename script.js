// ***************************************************************
// *** ACTION REQUIRED: UPDATE THIS LINE WITH YOUR PROXIED CSV URL ***
// ***************************************************************
const CSV_URL = 'https://cors-anywhere.herokuapp.com/https://docs.google.com/spreadsheets/d/e/2PACX-1vS28maOKEZTzlyYj1aNBCQueFiOXycVN_JkQcjPVPl1XFHWTjTel9FA0n0o7GEWAU1Wk93lt4hOMY1s/pub?gid=1596417357&single=true&output=csv'; 

function loadCSV() {
    $.ajax({
        url: CSV_URL,
        dataType: "text",
        success: function(data) {
            // Split the CSV text into rows and columns
            const allRows = data.split(/\r?\n|\r/);
            const headers = allRows[0].split(',');
            const rows = allRows.slice(1).map(row => row.split(','));

            // Prepare the structure for DataTables
            const columns = headers.map(header => ({
                title: header,
                data: headers.indexOf(header)
            }));
            
            // Initialize the DataTable
            const table = $('#myDataTable').DataTable({
                data: rows,
                columns: columns,
                
                // (B)uttons, (t)able, (r)emaining processing - removes global search and pagination info
                dom: 'Btr', 
                
                // Disable pagination to show all rows on one page
                paging: false, 
                
                // Disable global searching since we use column searching
                searching: false, 

                // Default Sorting: Sorts by the first column (0) ascending ('asc')
                order: [[ 0, 'asc' ]], 

                // --- Download Buttons ---
                buttons: [
                    'csvHtml5',
                    'excelHtml5'
                ],
                
                // --- Select Dropdown Filtering Logic (Spreadsheet style) ---
                initComplete: function () {
                    this.api()
                        .columns()
                        .every(function () {
                            const column = this;
                            
                            // 1. Create the select list for each column
                            const select = $('<select><option value=""></option></select>')
                                .appendTo($(column.header()))
                                .on('change', function () {
                                    // Escape special characters and perform the search
                                    const val = $.fn.dataTable.util.escapeRegex($(this).val());
                                    // Search uses regex to match exact value from dropdown
                                    column.search(val ? '^' + val + '$' : '', true, false).draw();
                                });
                            
                            // 2. Clear the header text and append the select dropdown
                            $(column.header()).html(''); 
                            $(column.header()).append(select);
                            
                            // 3. Populate the select list with unique values from the data
                            column.data().unique().sort().each(function (d, j) {
                                select.append('<option value="' + d + '">' + d + '</option>');
                            });
                        });
                }
            });
            
            // Remove the 'Loading' message after successful data load
            $('p').remove();
        },
        error: function() {
            // Display instructions if the data fails to load (likely proxy issue)
            console.log("AJAX Error: Data fetch failed.");
            $('p').html('Oops! Could not load the data. Please ensure you have **authorized the proxy** by visiting this link once: <a href="https://cors-anywhere.herokuapp.com/" target="_blank">https://cors-anywhere.herokuapp.com/</a>');
        }
    });
}

// Start the process when the page is ready
$(document).ready(function() {
    loadCSV();
});
