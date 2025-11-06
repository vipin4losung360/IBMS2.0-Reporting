// ***************************************************************
// *** STEP A: PASTE YOUR COPIED CSV URL HERE (WITH PROXY) ***
// ***************************************************************
// NOTE: Your users MUST manually authorize the proxy at https://cors-anywhere.herokuapp.com/
// before viewing the report, or it will fail with a 403 error.
const CSV_URL = 'https://cors-anywhere.herokuapp.com/https://docs.google.com/spreadsheets/d/e/2PACX-1vS28maOKEZTzlyYj1aNBCQueFiOXycVN_JkQcjPVPl1XFHWTjTel9FA0n0o7GEWAU1Wk93lt4hOMY1s/pub?gid=1596417357&single=true&output=csv'; 

// This function tells the Robot how to fetch the data
function loadCSV() {
    $.ajax({
        url: CSV_URL,
        dataType: "text",
        success: function(data) {
            // 1. First, split the big text file into rows and columns
            const allRows = data.split(/\r?\n|\r/);
            const headers = allRows[0].split(',');
            const rows = allRows.slice(1).map(row => row.split(','));

            // 2. We set up the table with column titles
            const columns = headers.map(header => ({
                title: header,
                data: headers.indexOf(header)
            }));

            // 3. We use the DataTables tool to make the table interactive!
            $('#myDataTable').DataTable({
                data: rows,
                columns: columns,
                
                // (B)uttons, (f)ilter/search, (t)able, (r)emaining processing
                // Note: We removed 'i' (info) and 'p' (pagination) for single page
                dom: 'Bftr',
                
                // *** NEW OPTION 1: All Entries on One Page (Disables Pagination) ***
                paging: false, 

                // *** NEW OPTION 2: Default Formatting/Sorting ***
                // Sorts by the first column (0) ascending ('asc')
                order: [[ 0, 'asc' ]], 

                // --- EXISTING BUTTONS ---
                buttons: [
                    'csvHtml5', // CSV download button
                    'excelHtml5' // Excel download button
                ]
            });
            
            // The job is done, remove the 'Loading' message
            $('p').remove();
        },
        error: function() {
            // Log error for debugging, display user-friendly message
            console.log("AJAX Error: Data fetch failed.");
            $('p').text('Oops! Could not load the data. Please ensure you have authorized the proxy: https://cors-anywhere.herokuapp.com/');
        }
    });
}

// Start the Robot when the page is ready
$(document).ready(function() {
    loadCSV();
});
