$(document).ready(function(){
    initializePage();
})

function initializePage(){
    let base_url = "http://api.earth911.com/earth911";
    const api_key = config.earth_api_key;
    let geocodeURL = "https://maps.googleapis.com/maps/api/geocode/json?";
    const google_api_key = config.google_api_key;

    //Heroku proxy server to bypass CORS error.
    const proxyURL = "https://cors-anywhere.herokuapp.com/";

    let parseURL = new URLSearchParams(document.location.search);
    let user_material;
    let user_zip;
    let user_dist = 10;
    let user_num_results = 10;
    let user_dropoff = true;
    let user_pickup = false;

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

    $('#material_box').val(user_material);
    $('#zipBox').val(user_zip);

    let search_results = getSearchResults(user_material,user_zip,base_url,api_key, user_dist, user_num_results,user_dropoff,user_pickup);

    function getSearchResults(material, zip, base_url, api_key, user_max_dist, user_num_results,user_dropoff,user_pickup) {
    let geocodeRequestURL = (geocodeURL + "address=" + zip + "&key=" + google_api_key);

    //Ajax call that gets the current coordinates of the user.
    let coordinates = $.parseJSON(
        $.ajax({
            url: geocodeRequestURL,
            type: 'GET',
            dataType: 'json',
            crossDomain: true,
            async: false
        }).responseText);

    let lat = coordinates.results[0].geometry.location['lat'];
    let lgn = coordinates.results[0].geometry.location['lng'];

    //Get all of the material ID's related to what material the user is searching for.
    let req_url = (base_url + ".searchMaterials?" + "query=" + material + "&api_key=" + api_key);

    let mat_ids = $.parseJSON(
        $.ajax({
            url: (proxyURL + req_url),
            type: 'GET',
            dataType: 'json',
            crossDomain: 'true',
            async: false,
        }).responseText);

    let mat_ids_sum = "";

    for (i = 0; i < mat_ids['num_results']; i++) {
        mat_ids_sum += mat_ids['result'][i]['material_id'] + "&"
    }

    //Searches recycling centers based on user criterias/filters.
    let requestURL = (base_url + ".searchLocations?" + "latitude=" + lat  + "&longitude="
                    + lgn + "&max_distance=" + user_max_dist + "&max_results=" + (Number(user_num_results)+25)
                    +  "&material_id=" + mat_ids_sum + "api_key=" + api_key);

    let locationInfo = $.parseJSON(
        $.ajax({
            url: (proxyURL + requestURL),
            type: 'GET',
            dataType: 'json',
            crossDomain: true,
            async: false,
    }).responseText);

    let new_location_info = {}

    //Get the location id, location name and distance.
    for(i=0; i<locationInfo['num_results']; i++) {
        key = locationInfo['result'][i]['location_id'];
        new_location_info[key] = [locationInfo['result'][i]['description'], locationInfo['result'][i]['distance']];
    }

    let temp_location_info = [];

    //Get the full location info using location id.
    for(i=0; i<Object.keys(new_location_info).length; i++) {
        let location_id = Object.keys(new_location_info)[i];
        let locationDetailsURL = (base_url + ".getLocationDetails" + "?location_id=" + location_id + "&api_key=" + api_key);

        temp_location_info.push($.parseJSON(
        $.ajax({
            url: (proxyURL + locationDetailsURL),
            type: 'GET',
            dataType: 'json',
            crossDomain: true,
            async: false,
        }).responseText));
    }

    let full_location_info = []
    for (i=0; i<temp_location_info.length;i++) {
        let location_id = Object.keys(temp_location_info[i]['result']);
        let tempPath = temp_location_info[i]['result'][location_id];
        let info = {
            loc_id : location_id,
            description : tempPath['description'],
            address : tempPath['address'],
            city : tempPath['city'],
            state : tempPath['province'],
            zip_code : tempPath['postal_code'],
            phone_number : tempPath['phone'],
            hours : tempPath['hours'],
            materials : tempPath['materials'],
            url : tempPath['url'],
            distance : new_location_info[location_id][1]
        }
        full_location_info.push(info);
    }

    let loc_info = [];

    //Dropoff and pickup filter.
    for(i=0; i<full_location_info.length; i++) {
        if(loc_info.length == Number(user_num_results)) {
            break;
        }
        else{
            if(user_dropoff == String(full_location_info[i]['materials'][0]['dropoff']) && user_pickup == String(full_location_info[i]['materials'][0]['pickup'])) {
                loc_info.push(full_location_info[i]);
            }
        }
    }

    if(loc_info.length != 0) {
        $("#searchList").html(`
        <br>
        <h3 style=text-align:center>Search Results</h3>
        ${loc_info.map(function(locations) {
            return `
            <div class="container">
            <span class="searchClick">
                <h5>
                  <span class="centerName">${locations['description']}</span>
                </h5>
                  <span class="centerAddress">${"<b>" + "Address: " + "</b>" + locations['address']}
                    <br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    ${locations['city'] + ", " + locations['state'] + " " + locations['zip_code']}</li>
                  </span>
                <br>
                <span class="centerPhone">
                  ${"Phone Number: " +locations['phone_number']}
                </span>
                <br>
                <span class="centerHours">
                  ${"Hours of Operation: " + locations['hours']}
                </span>
                <br>
                ${locations['distance'] + " miles away from " + user_zip}
                <br>
            </span>
                <details>
                    ${"Website: " } <a href=${locations['url']}>${locations['url']}</a>
                    <br>
                    <span class="centerMaterials">
                      ${"Other Materials Accepted: "+ locations['materials'].map(material => `${material.description}`)}
                    </span>
                    <br>
                    ${"Dropoff Available? " + locations['materials'][0]['dropoff']}
                    <br>
                    ${"Pickup Available? " + locations['materials'][0]['pickup']}
                    <summary>
                        More information
                    </summary>
                </details>
            </div>
            `
        }).join('')}
        `)
    }
    else {
        $("#searchList").html(`
        <br>
        <h3 style=text-align:center>Sorry there are no matches given your filter settings.</h3>
        `
        )
    }
    return loc_info;
    }

    $('#material_box').keyup(function(event) {
    if (event.keyCode === 13 ) {
        $('#searchButton').click();
    }
    });

    $('#zipBox').keyup(function(event) {
    if(event.keyCode === 13) {
        $('#searchButton').click();
    }
    });

    $("#searchButton").click(function() {
    let user_material = $('#material_box').val();
    let zip_code = $('#zipBox').val();

    if(!user_material) {
        alert("Please type in what you want to recycle.");
    }
    else if(!zip_code){
        alert("Please type in a zip code.");
    }
    else {
        getSearchResults(user_material,zip_code,base_url,api_key,user_dist,user_num_results,user_dropoff,user_pickup);
    }
    });

    $("#filterButton").click(function() {
    let user_material = $('#material_box').val();
    let zip_code = $('#zipBox').val();

    window.document.location = './filterResults.html' + '?material=' + user_material
            + '&zip=' + zip_code + "&distance=" + user_dist + '&numresults=' + user_num_results
            + '&dropoff=' + user_dropoff + '&pickup=' + user_pickup;
    });

    $("#mapView").click(function() {
    let user_material = $('#material_box').val();
    let zip_code = $('#zipBox').val();
    let map_search_results = [];

    for(i=0; i<search_results.length; i++) {
        map_search_results.push(search_results[i]['loc_id'][0]);
    }

    window.document.location = './searchResultsMapView.html' + '?material=' + user_material
           + '&zip=' + zip_code + "&distance=" + user_dist + '&numresults=' + user_num_results
            + '&dropoff=' + user_dropoff + '&pickup=' + user_pickup +'&ids=' + map_search_results;

    })

    $(".searchClick").click(function() {
    let user_material = $('#material_box').val();
    let zip_code = $('#zipBox').val();
    let center_name = $('.centerName').html();
    let center_hours = $('.centerHours').html();
    let center_phone = $('.centerPhone').html();
    let center_materials = $('.centerMaterials').html();
    let arr = []
    let loc_id_arr = [];

    for(i=0; i<search_results.length; i++) {
        arr.push(String(search_results[i]['address']) + " " + String(search_results[i]['city']));
        loc_id_arr.push(search_results[i]['loc_id']);
    }

    window.document.location = './centerInfo.html' + '?material=' + user_material
            + '&zip=' + zip_code + "&distance=" + user_dist + '&numresults=' + user_num_results
            + '&dropoff=' + user_dropoff + '&pickup=' + user_pickup + '&centerName=' + center_name
            + '&address=' + arr[0] + '&phone='+ center_phone + '&hours=' + center_hours + '&materials='
            + center_materials + '&ids=' + loc_id_arr[0];
    })

    $("#backButton").click(function() {
    let user_material = $('#material_box').val();
    let zip_code = $('#zipBox').val();

    window.document.location = './index.html' + '?material=' + user_material
            + '&zip=' + zip_code + "&distance=" + user_dist + '&numresults=' + user_num_results
            + '&dropoff=' + user_dropoff + '&pickup=' + user_pickup;
    })
}