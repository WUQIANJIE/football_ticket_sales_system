// WU Qianjie & WANG Kaiyuan
/* eslint-disable no-undef */
var firstClassPrice = 0;
var secondClassPrice = 0;
var venueName = "";
var username = "";
var selectedSeatRow = 0;
var selectedSeatCol = 0;

$(document).ready(function() {

    fetch('/auth/me')
        .then(response => response.json())
        .then(data => {
            if (!(data.status === "success" && data.user)) {
                window.open("/login.html", "_self");
            }
            username  = data.user.username;
    });

    var eventID = getEventIdFromUrl();
    getEventDetails(eventID);
    $('#ticketPriceSelection').change(function() {
        updateDisplayedPrice();
        updateSeatMapBasedOnTicketType();
    });

    $('#resetButton').on('click', function() {
        resetAll();
    });

    $('#payment').on('click', function() {
        handlePaymentClick();
    });

    $('#paybutton').on('click', function() {
        placeOrder();
    });
});


function getEventIdFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get('eventID');
}

function getEventDetails(eventID) {
    $.ajax({
        url: '/events/' + eventID,
        type: 'GET',
        success: function(event) {
            renderEventDetails(event);
            getSeatMap(event.venueID);

            // Fetch venue name
            $.ajax({
                url: '/venues/' + event.venueID,
                type: 'GET',
                success: function(venue) {
                    $('#eventVenue').text(venue.venueName);
                    venueName = venue.venueName;
                },
                error: function() {
                    alert('Unable to get venue details!');
                }
            });
        },
        error: function() {
            alert('Unable to get event details!');
        }
    });
}


function updateSeatMapBasedOnTicketType() {
    getSeatMap(getEventIdFromUrl());
}

function renderEventDetails(event) {
    $('#eventTitle').text(event.title);
    $('#eventVenue').text(venueName);
    $('#eventPrice').text(event.prices);
    $('#eventDate').text(event.datetime);
    
    if (event.image.startsWith('static/')) {
        event.image = event.image.substring(7);
    }
    $('#eventImage').attr('src', event.image);
    
    renderTicketPrices(event.prices);
    getSeatMap(event.venueID);
}

function renderTicketPrices(prices) {
    var ticketPriceSelect = $('#ticketPriceSelection');
    ticketPriceSelect.empty(); 

    prices.forEach(function(price, index) {
        var option = $('<option></option>').attr("value", price).text("$" + price);
        ticketPriceSelect.append(option);
        if (index === 0) {
            firstClassPrice = price;
            ticketPriceSelect.val(price);
        } else {
            secondClassPrice = price;
        }
    });
    
    updateDisplayedPrice();
}

function updateDisplayedPrice() {
    var selectedPrice = $('#ticketPriceSelection').val();
    $('#price').text(selectedPrice);
}

function getSeatMap(venueID) {
    $.ajax({
        url: '/venues/seatmap/' + venueID,
        type: 'GET',
        success: function(seatMap) {
            renderSeatMap(seatMap);
        },
        error: function() {
            console.error('Unable to get seat map!');
        }
    });
}

// References: https://developer.mozilla.org/en-US/docs/Web/SVG/Scripting
function renderSeatMap(seatMap) {
    const seatMapContainer = $('#seatMapContainer');
    seatMapContainer.empty();
    
    // Calculate SVG dimensions
    const svgWidth = 40 + (seatMap[0].length * 40); 
    const svgHeight = 40 + (seatMap.length * 40) + 100; // 增加高度用于区域图

    const svg = $(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    svg.attr('width', svgWidth);
    svg.attr('height', svgHeight);

    // Adding the 'Stage' label
    const stage = $(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));
    stage.attr({ x: 0, y: 0, width: svgWidth - 30, height: 30, fill: 'grey' });
    svg.append(stage);

    const stageText = $(document.createElementNS('http://www.w3.org/2000/svg', 'text'));
    stageText.attr({ x: svgWidth / 2 - 30, y: 20, fill: 'white' }).text('Stage');
    svg.append(stageText);

    // Render the area map (区域图)
    const areaPolygons = [
        { points: "30,20 570,20 600,50 600,350 570,380 30,380 0,350 0,50", fill: "white", stroke: "black" },
        { points: "50,20 170,20 150,70 70,70", dataArea: "N1" },
        { points: "180,20 260,20 240,70 160,70", dataArea: "N2" },
        { points: "270,20 330,20 350,70 250,70", dataArea: "N3" },
        { points: "340,20 420,20 440,70 360,70", dataArea: "N4" },
        { points: "430,20 550,20 530,70 450,70", dataArea: "N5" },
        { points: "50,380 170,380 150,330 70,330", dataArea: "S1" },
        { points: "180,380 260,380 240,330 160,330", dataArea: "S2" },
        { points: "270,380 330,380 350,330 250,330", dataArea: "S3" },
        { points: "340,380 420,380 440,330 360,330", dataArea: "S4" },
        { points: "430,380 550,380 530,330 450,330", dataArea: "S5" },
        { points: "0,80 60,80 40,280 0,280", dataArea: "W1" },
        { points: "0,290 60,290 40,340 0,340", dataArea: "W2" },
        { points: "600,80 540,80 560,280 600,280", dataArea: "E1" },
        { points: "600,290 540,290 560,340 600,340", dataArea: "E2" }
    ];

    // Adding area polygons and labels
    areaPolygons.forEach((polygon) => {
        const areaPolygon = $(document.createElementNS('http://www.w3.org/2000/svg', 'polygon'));
        areaPolygon.attr({
            points: polygon.points,
            fill: polygon.fill || 'grey',
            stroke: polygon.stroke || 'black',
            'data-area': polygon.dataArea
        });
        svg.append(areaPolygon);
    });

    // Adding area labels
    const areaLabels = [
        { x: 110, y: 40, text: 'N1' },
        { x: 200, y: 40, text: 'N2' },
        { x: 300, y: 40, text: 'N3' },
        { x: 400, y: 40, text: 'N4' },
        { x: 490, y: 40, text: 'N5' },
        { x: 110, y: 355, text: 'S1' },
        { x: 200, y: 355, text: 'S2' },
        { x: 300, y: 355, text: 'S3' },
        { x: 400, y: 355, text: 'S4' },
        { x: 490, y: 355, text: 'S5' },
        { x: 30, y: 180, text: 'W1' },
        { x: 30, y: 310, text: 'W2' },
        { x: 570, y: 180, text: 'E1' },
        { x: 570, y: 310, text: 'E2' },
        { x: 300, y: svgHeight - 20, text: 'Please select a zone first' }
    ];

    areaLabels.forEach((label) => {
        const text = $(document.createElementNS('http://www.w3.org/2000/svg', 'text'));
        text.attr({ x: label.x, y: label.y, fill: 'black' }).text(label.text);
        svg.append(text);
    });

    // Render the seat map (座位图)
    seatMap.forEach((row, rowIndex) => {
        // Adding the row label
        const rowLabel = $(document.createElementNS('http://www.w3.org/2000/svg', 'text'));
        rowLabel.attr({ x: 0, y: 70 + rowIndex * 40 + 30, fill: 'black' }).text(rowIndex + 1);
        svg.append(rowLabel);

        row.forEach((seat, seatIndex) => {
            // Column label (only for the first row)
            if (rowIndex === 0) {
                const colLabel = $(document.createElementNS('http://www.w3.org/2000/svg', 'text'));
                colLabel.attr({ x: 20 + seatIndex * 40, y: 45 + 30, fill: 'black' }).text(seatIndex + 1);
                svg.append(colLabel);
            }

            const rect = $(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));
            rect.attr({
                x: 10 + seatIndex * 40, // Adjust x position
                y: 50 + rowIndex * 40 + 30, // Adjust y position to accommodate the area map
                width: 30,
                height: 30,
                fill: getSeatColor(rowIndex, seat),
                class: 'seat',
                'data-row': rowIndex,
                'data-seat': seatIndex
            });

            rect.on('click', function() {
                if (seat === 1) return; // Skip if seat is taken

                // Update the selected seat info display
                selectedSeatRow = rowIndex + 1;
                selectedSeatCol = seatIndex + 1;

                // Deselect all seats and select the clicked one
                $('.seat').attr('fill', s => getSeatColor(parseInt($('.seat').eq(s).attr('data-row')), seatMap[parseInt($('.seat').eq(s).attr('data-row'))][parseInt($('.seat').eq(s).attr('data-seat'))]));
                $(this).attr('fill', 'green');

                // Update selected seat info
                $('#selectedSeatInfo').text(`Selected Seat: Row ${rowIndex + 1}, Seat ${seatIndex + 1}`);
                updateTicketTypeAndPrice(rowIndex);
            });

            svg.append(rect);
        });
    });

    seatMapContainer.append(svg);
}

function updateTicketTypeAndPrice(rowIndex) {
    let ticketType, price;
    if (rowIndex < 2) {
        ticketType = 'First Class';
        price = firstClassPrice;
    } else {
        ticketType = 'Second Class';
        price = secondClassPrice;
    }
    $('#ticketTypeInfo').text(`${ticketType}`);
    $('#price').text(price);
}

function getSeatColor(rowIndex, seat) {
    if (seat == 1) return 'grey'; // Seat is taken
    return rowIndex < 2 ? 'red' : 'blue'; // First-class seats are red, second-class are blue
}

function resetAll() {
    // Clear selected seat info
    $('#selectedSeatInfo').text('Not selected');
    $('#ticketTypeInfo').text('Not selected');
    $('#price').text('0');

    // Reset the seat map
    const venueID = getEventIdFromUrl();
    getSeatMap(venueID);

    // Reset the payment info fields
    $('#paymentInfoContainer').hide();
}

// Payment handling
function handlePaymentClick() {
    if ($('#selectedSeatInfo').text() === 'Not selected') {
        alert('Please select a seat!');
        return;
    }

    $('.seat').off('click');

    // Show payment info fields
    $('#paymentInfoContainer').show();

    $('html, body').animate({
        scrollTop: $('#paymentInfoContainer').offset().top
    }, 0);
}

function placeOrder() {
    // Check credit card input
    const creditName = $('#creditName').val();
    const creditNo = $('#creditNo').val();
    const creditCVV = $('#creditCVV').val();
    if (creditName === '' || creditNo === '' || creditCVV === '') {
        alert('Please fill in all credit card details!');
        return;
    }
    // Retrieve user input
    const eventID = getEventIdFromUrl();
    const price = parseInt($('#price').text());
    const bookingDateTime = new Date().toLocaleString();

    // Prepare the order data
    const orderData = {
        username: username,
        eventID: eventID,
        seatRow: selectedSeatRow - 1, // 0-base
        seatCol: selectedSeatCol - 1, // 0-base
        price: price
    };

    console.log(orderData);

    // Send order data to back-end
    $.ajax({
        url: '/order/placeOrder',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(orderData),
        success: function(response) {
            // Show success message
            $('#placeOrderMessage').show();
            $('#confirmationTicket').show(); // Show confirmation ticket
            
            $('html, body').animate({
                scrollTop: $('#confirmationTicket').offset().top
            }, 0);

            // Populate confirmation ticket details
            getConfirmationTicket(eventID, price, bookingDateTime);
        
        },
        error: function(xhr, status, error) {
            // Show error message
            alert('Error placing order: ' + xhr.responseText);
        }
    });
}

function getConfirmationTicket(eventID, price, bookingDateTime) {
    // Populate ticket details
    $('#ticketImage').attr('src', $('#eventImage').attr('src'));
    $('#ticketTitle').text($('#eventTitle').text());
    $('#ticketVenue').text(venueName);
    $('#ticketDate').text($('#eventDate').text());
    $('#ticketPrice').text(`$${price}`);
    $('#ticketSeat').text(`Row ${selectedSeatRow}, Seat ${selectedSeatCol}`);
    $('#ticketName').text(username);
    $('#bookingDateTime').text(bookingDateTime);
}
