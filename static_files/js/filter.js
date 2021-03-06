/* Javascript file for the filters functionality of the app.
 *
 * Takes filter information from listview through URL.
 * Sends modified filter information back to listview through URL.
 * 
 * https://github.com/debbievo/WeCycleIt
 */

function goBack() {
    window.history.back();
}

$(document).ready(() => {
    //gets the current values for these ids
    $("#distance_span").html($("#myRange").val());
    $("#results_span").html($("#myNumResults").val());

    //URL query variables
    let parseURL = new URLSearchParams(document.location.search);
    let user_material;
    let user_zip;
    let user_dist = 0;
    let user_num_results = 0;
    let user_dropoff = true;
    let user_pickup = false;

    //checks the url for specified inputs
    if(parseURL.has('material')) {
        user_material = parseURL.get('material');
    }
    if(parseURL.has('zip')) {
        user_zip = parseURL.get('zip');
    }
    if(parseURL.has('distance')) {
        user_dist = parseURL.get('distance');
    }
    if(parseURL.has('numresults')) {
        user_num_results = parseURL.get('numresults');
    }
    if(parseURL.has('dropoff')) {
        user_dropoff = parseURL.get('dropoff');
    }
    if(parseURL.has('pickup')) {
        user_pickup = parseURL.get('pickup');
    }

    //sets the value of the ids
    $("#myRange").val(user_dist);
    $("#myNumResults").val(user_num_results);

    //gets the ids
    $("#distance_span").html(user_dist);
    $("#results_span").html(user_num_results);

    //checks whether user has checkmarked it
    if(user_dropoff == String(true)) {
        $('#dropoff_available').prop('checked',true);
    }
    else{
        $('#dropoff_available').prop('checked',false);
    }

    //checks whether user has checkmarked it
    if(user_pickup == String(true)) {
        $('#pickup_available').prop('checked',true);
    }
    else{
        $('#pickup_available').prop('checked',false);
    }

    // Update the current slider value (each time you drag the slider handle)
    $("#myRange").on("input", function(e) {
        $("#distance_span").html(this.value);
        user_dist = this.value;
    })

    $("#myNumResults").on("input", function(e) {
        $("#results_span").html(this.value);
        user_num_results = this.value;
    })

    //changes value based off of whether checkbox is checked
    $('#dropoff_available').click(function(){
        if($(this).is(":checked")){
            user_dropoff = String(true);
    }
        else if($(this).is(":not(:checked)")){
            user_dropoff = String(false);
        }
    });

    //changes value based off of whether checkbox is checked
    $('#pickup_available').click(function(){
        if($(this).is(":checked")){
            user_pickup = String(true);
    }
        else if($(this).is(":not(:checked)")){
            user_pickup = String(false);
        }
    });

    //goes to the list view page upon selecting the desired filters and changes the url based off of them
    $('#filtersButton').click(function() {
        window.document.location = './searchResultsListView.html' + '?material=' + user_material
            + '&zip=' + user_zip + '&distance=' + user_dist + '&numresults=' + user_num_results
            + '&dropoff=' + user_dropoff + '&pickup=' + user_pickup;
    });

});
