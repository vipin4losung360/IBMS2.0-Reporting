// ***************************************************************
// *** STEP A: PASTE YOUR COPIED CSV URL HERE (inside the quotes)***
// ***************************************************************
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
                // 'Bfrtip' means: Show Buttons, Filter (Search), Table, Info, Pagination
                dom: 'Bfrtip', 
                buttons: [
                    'csvHtml5', // This is the button that lets people download as CSV
                    'excelHtml5' // This lets people download as Excel
                ]
            });
            
            // The job is done, remove the 'Loading' message
            $('p').remove();
        },
        error: function() {
            $('p').text('Oops! The Robot could not find the data. Check the link.');
        }
    });
}

// Start the Robot when the page is ready
$(document).ready(function() {
    loadCSV();

});
