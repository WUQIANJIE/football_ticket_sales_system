// WU Qianjie 22102977D & WANG Kaiyuan 22101552D
/* eslint-disable no-undef */
$(document).ready(function() {

    fetch('/auth/me')
      .then(response => response.json())
      .then(data => {
          if (!(data.status === "success" && data.user.role === "admin")) {
              window.open("/login.html", "_self");
              alert("You are not authorized to access this page! Please log in as an admin.");
          }
          username = data.user.username;
    });

    getVenues();

    getAllData();

    $('#venueSelection').change(function() {
        selectedVenueID = $(this).val();
        // if select on -2 to create new venue, display the input for name
        if (selectedVenueID == "-2") {
            $('#newVenueDiv').removeClass('d-none');
            $('#seatMapContainer').empty();
            $('#seatUserInfo').text('Enter Venue Name and Row and Column to create a new venue.');
        } else {
            $('#newVenueDiv').addClass('d-none');
            getSeatMap(selectedVenueID);
            $('#seatUserInfo').text('Click on a seat to view user information.');
        }

        

    });

  $('#applyButton').on('click', function() {
      var venueID = $('#venueSelection').val();
      if (venueID == "-2") {
        // for new venue name
        venueID = $('#newVenueName').val();
      }
      var rows = $('#numberOfRows').val();
      var cols = $('#numberOfColumns').val();

      if ((venueID != "-1") && rows && cols) {
          checkSeatAvailabilityBeforeUpdate(venueID, rows, cols);
      } else {
          alert('Please select/enter a venue and specify rows and columns');
      }
  });


});

var allUsersTransactions = [];
var eventList = [];
var venueList = [];
var selectedVenueID;

function getVenues() {
    $.ajax({
        url: '/venues',
        type: 'GET',
        success: function(venues) {
            renderVenueDropdown(venues);
        },
        error: function() {
            alert('Failed to get venues');
        }
    });
}

function renderVenueDropdown(venues) {
    const venueSelect = $('#venueSelection');
    venueSelect.empty();
    venueSelect.append($('<option>', { value: '-1', text: 'Please Select' }));

    venues.forEach(function(venue) {
        venueSelect.append($('<option>', {
            value: venue.venueID,
            text: venue.venueName
        }));
    });
    // for selecting new venue
    venueSelect.append($('<option>', { value: '-2', text: 'Create New Venue' }));
}

function getSeatMap(venueID) {
    $.ajax({
        url: '/venues/seatmap/' + venueID,
        type: 'GET',
        success: function(seatMap) {
          $('#seatMessage').text('Please enter the number of rows and columns to update the seat map');
          renderSeatMap(seatMap);
        },
        error: function() {
            console.error('No seat map!');
            $('#seatMapContainer').empty();
            $('#seatMessage').text('No seat map available for this venue, please create one.');
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
                displayUserInfoForSeat(selectedVenueID, rowIndex, seatIndex);
            });
            // Append the seat icon to the group
            seatGroup.append(seatIcon);

            // Append the group to the main SVG
            svg.append(seatGroup);
        });
    });

    seatMapContainer.append(svg);
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

function checkSeatAvailabilityBeforeUpdate(venueID, rows, cols) {
    var selectedID = $('#venueSelection').val();
      if (selectedID == "-2") {
        updateVenue($('#newVenueName').val(), rows, cols);
      } else {
        $.ajax({
            url: '/venues/availability/' + venueID,
            type: 'GET',
            success: function(seatAvailability) {
                if (seatAvailability.totalSeats !== seatAvailability.availableSeats) {
                    alert('Some seats are already booked in this venue. Cannot modify seat map.');
                } else {
                    updateSeatMap(venueID, rows, cols);
                }
            },
            error: function() {
                console.error('Unable to get seat availability!');
            }
        });
      }
}

function updateSeatMap(venueID, rows, cols) {
    // check for at least 40 seats
    if (rows * cols < 40 || rows < 3 || cols < 3) {
        alert('A seat map must have at least 40 seats and 3 rows and columns');
        return;
    }
    $.ajax({
        url: '/venues/seatmap',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ venueID, rows, cols }),
        success: function(response) {
            alert('Seat map updated successfully');
            getSeatMap(venueID); // Refresh
        },
        error: function(xhr, status, error) {
            alert('Error updating seat map: ' + xhr.responseText);
        }
    });
}

function updateVenue(venueName, rows, cols) {
    // check for at least 40 seats
    if (rows * cols < 100 || rows < 10 || cols < 10) {
        alert('A seat map must have at least 100 seats and 10 rows and 10 columns');
        return;
    }
    if (rows * cols > 600 || rows > 20 || cols > 30) {
        alert('A seat map must have at most 300 seats and 20 rows and 30 columns');
        return;
    }
    var venueID = venueList.length;
    $.ajax({
        url: '/venues',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ venueID, venueName, rows, cols }),
        success: function(response) {
            alert('Venue create successfully');
            getSeatMap(venueID); // Refresh
        },
        error: function(error) {
            alert('Error create venue: ' + error);
        }
    });
}

// For seat user info
function getAllData() {
    $.ajax({
        url: '/user/alltransactions/',
        type: 'GET',
        success: function(data) {
            allUsersTransactions = data.data;
        },
        error: function(error) {
            console.error('Error get user transactions:', error);
        }
    });

    $.ajax({
        url: '/events',
        type: 'GET',
        success: function(data) {
            eventList = data;
        },
        error: function(error) {
            console.error('Error get events:', error);
        }
    });

    $.ajax({
        url: '/venues',
        type: 'GET',
        success: function(data) {
            venueList = data;
        },
        error: function(error) {
            console.error('Error get venues:', error);
        }
    });
}

function displayUserInfoForSeat(venueID, row, col) {
    venueID = parseInt(venueID);
    console.log(row+" "+col);

    const event = eventList.find(e => e.venueID === venueID);
    if (!event) {
        alert("Event not found for this venue.");
        return;
    }

    let occupantUsername = null;
    for (const user of allUsersTransactions) {
        
        if (!user.transactions) continue;
        console.log(user.transactions);
        const userTransaction = user.transactions.find(t => 
            t.eventID == event.eventID && 
            t.seatCoord[0] == row && 
            t.seatCoord[1] == col
        );

        if (userTransaction) {
            occupantUsername = user.username;
            break; 
        }
    }

    // Check if found an occupant
    if (occupantUsername) {
        $('#seatUserInfo').text("Seat " + (row + 1) + "-" + (col + 1) + " is occupied by " + occupantUsername + " for event " + event.title + " at " + venueList.find(v => v.venueID === venueID).venueName + ".");
    } else {
        $('#seatUserInfo').text("Seat " + (row + 1) + "-" + (col + 1) + " is currently unoccupied.");
    }
}


