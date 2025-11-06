// ***************************************************************
// *** STEP A: PASTE YOUR COPIED CSV URL HERE (WITH PROXY) ***
// NOTE: This must be updated with your specific Google Sheet publish link.
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
                
                // --- Column Filtering Logic ---
                initComplete: function () {
                    this.api()
                        .columns()
                        .every(function () {
                            const column = this;
                            // Create an input text box for each column filter
                            const input = $('<input type="text" class="form-control form-control-sm" placeholder="Filter ' + $(column.header()).text() + '" />')
                                .appendTo($(column.header()).empty())
                                .on('keyup change clear', function () {
                                    if (column.search() !== this.value) {
                                        column.search(this.value).draw();
                                    }
                                });
                        });
                }, 
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
