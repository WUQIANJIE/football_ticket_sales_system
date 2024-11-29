// WU Qianjie 22102977D & WANG Kaiyuan 22101552D
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

function getVenueIDFromEvent(eventID) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '/events/' + eventID,
            type: 'GET',
            success: function(event) {
                // 提取 venueID
                const venueID = event.venueID;
                resolve(venueID);
            },
            error: function() {
                alert('Unable to get event details!');
                reject(new Error('Failed to get event details'));
            }
        });
    });
}


function updateSeatMapBasedOnTicketType() {
    getVenueIDFromEvent(getEventIdFromUrl())
    .then(venueID => {
        getSeatMap(venueID);
        console.log(venueID);
    })
    .catch(err => {
        console.error(err.message);
    });
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

function renderSeatMap(seatMap) {
    const seatMapContainer = $('#seatMapContainer');
    seatMapContainer.empty();

    // Calculate SVG dimensions
    const svgWidth = 55 + (seatMap[0].length * 40); 
    const svgHeight = 50 + (seatMap.length * 40);


    const svg = $(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    svg.attr('width', svgWidth);
    svg.attr('height', svgHeight);

    // Add the court image in the center
    const courtImage = $(document.createElementNS('http://www.w3.org/2000/svg', 'image'));
    const imageWidth = (seatMap[0].length*3/5+1)*40; // Adjust width as needed
    const imageHeight = (seatMap.length*3/5-1)*40; // Adjust height as needed
    courtImage.attr({
        href: 'https://s1.locimg.com/2024/11/22/3dd49d5b0c6ba.png', // 替换为你的图像路径
        x: 45 + (seatMap[0].length/5-1)*40,
        y: 70 + (seatMap.length/5)*40, // Y 位置可以根据需要调整
        width: imageWidth,
        height: imageHeight,
        opacity: 0.5 // 可选：设置图片透明度
    });
    svg.append(courtImage); // 将图像添加到 SVG

    seatMap.forEach((row, rowIndex) => {
        // Adding the row label
        const rowLabel = $(document.createElementNS('http://www.w3.org/2000/svg', 'text'));
        rowLabel.attr({ x: 0, y: 80 + rowIndex * 40, fill: 'white' }).text(rowIndex + 1);
        svg.append(rowLabel);
        

        row.forEach((seat, seatIndex) => {
            // Column label (only for the first row)
            if (rowIndex === 0) {
                const colLabel = $(document.createElementNS('http://www.w3.org/2000/svg', 'text'));
                if(seatIndex < 9){
                    colLabel.attr({ x: 45 + seatIndex * 40, y: 50, fill: 'white' }).text(seatIndex + 1);
                }
                else{
                    colLabel.attr({ x: 40 + seatIndex * 40, y: 50, fill: 'white' }).text(seatIndex + 1);
                }
                svg.append(colLabel);
            }

             // Create a group (`<g>`) for the seat icon
             const seatGroup = $(document.createElementNS('http://www.w3.org/2000/svg', 'g'));

             // Scaling factor for 30x30 size
             const scaleFactor = 30 / 1024;
 
             seatGroup.attr({
                 transform: `translate(${35 + seatIndex * 40}, ${60 + rowIndex * 40}) scale(${scaleFactor})`,
                 class: 'seat',
                 'data-row': rowIndex,
                 'data-seat': seatIndex
             });
 
             // Add the SVG path for the seat icon
             const seatIcon = $(document.createElementNS('http://www.w3.org/2000/svg', 'path'));
             if( seatIndex<seatMap[0].length/5-1 || rowIndex<seatMap.length/5 || seatIndex>seatMap[0].length*4/5 || rowIndex>seatMap.length*4/5-1 ){
                seatIcon.attr({
                    d: "M115.968 927.936A112 112 0 0 1 0 816v-512c0-50.88 33.92-93.792 80.32-107.456A192 192 0 0 1 272 16h480a192 192 0 0 1 191.68 180.544A112.064 112.064 0 0 1 1024 304v512a112 112 0 0 1-115.968 111.936A191.744 191.744 0 0 1 752 1008h-480a191.744 191.744 0 0 1-156.032-80.064z",
                    fill: getSeatColor(seatMap,rowIndex,seatIndex,seat)
                });
             }

            seatGroup.on('click', function() {
                if(seat === 1) return; // Skip if seat is taken

                // Update the selected seat info display
                selectedSeatRow = rowIndex + 1;
                selectedSeatCol = seatIndex + 1;

                // Deselect all seats and select the clicked one
                $('.seat path').attr('fill', (index, currentColor) =>
                    getSeatColor(
                        seatMap,
                        parseInt($('.seat').eq(index).attr('data-row')),
                        parseInt($('.seat').eq(index).attr('data-seat')),
                        seatMap[parseInt($('.seat').eq(index).attr('data-row'))][parseInt($('.seat').eq(index).attr('data-seat'))]
                    )
                );
                seatIcon.attr('fill', 'yellow');

                // Update selected seat info
                $('#selectedSeatInfo').text(`Selected Seat: Row ${rowIndex + 1}, Seat ${seatIndex + 1}`);
                updateTicketTypeAndPrice(seatMap,rowIndex,seatIndex);
            });
            // Append the seat icon to the group
            seatGroup.append(seatIcon);

            // Append the group to the main SVG
            svg.append(seatGroup);
        });
    });

    seatMapContainer.append(svg);
}
// References: https://developer.mozilla.org/en-US/docs/Web/SVG/Scripting


function updateTicketTypeAndPrice(seatMap,rowIndex,seatIndex) {
    let ticketType, price;
    if (seatIndex>=seatMap[0].length/5-2 && rowIndex>=seatMap.length/5-1 && seatIndex<=seatMap[0].length*4/5+1 && rowIndex<=seatMap.length*4/5) {
        ticketType = 'First Class';
        price = firstClassPrice;
    } else {
        ticketType = 'Second Class';
        price = secondClassPrice;
    }
    $('#ticketTypeInfo').text(`${ticketType}`);
    $('#price').text(price);
}

function getSeatColor(seatMap,rowIndex,seatIndex,seat) {
    if (seat == 1) return 'grey'; // Seat is taken
    if(seatIndex>=seatMap[0].length/5-2 && rowIndex>=seatMap.length/5-1 && seatIndex<=seatMap[0].length*4/5+1 && rowIndex<=seatMap.length*4/5 ){
        return 'pink';
    }
    else{
        return 'white';
    }
}

function resetAll() {
    // Clear selected seat info
    $('#selectedSeatInfo').text('Not selected');
    $('#ticketTypeInfo').text('Not selected');
    $('#price').text('0');

    // Reset the seat map
    updateSeatMapBasedOnTicketType();

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

    // Fetch event details to get venueID
    $.ajax({
        url: '/events/' + eventID,
        type: 'GET',
        success: function(event) {
            const venueID = event.venueID; // Extract venueID from event details
            
            // Prepare the order data
            const orderData = {
                username: username,
                eventID: eventID,
                venueID: venueID, // Add venueID to order data
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
        },
        error: function() {
            alert('Unable to get event details!');
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
