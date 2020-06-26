// Created by Nathaniel Young
// @nyoungstudios on GitHub

// format regular expressions to match to
var format1 = new RegExp('Daily at [0-9]{1,2}:[0-9]{2} [AP]M UTC');
var format2 = new RegExp('[A-Za-z]* [0-9]{1,2}, [0-9]{4} [0-9]{1,2}:[0-9]{2} [AP]M UTC');

// date stuff
var d = new Date();
var offsetMinutes = d.getTimezoneOffset();
var tz = d.toLocaleTimeString('en-us',{timeZoneName:'short'}).split(' ')[2];
var minutesInDay = 24 * 60;

let dateOptions = {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZoneName: 'short'};

var frequencySelector = '#scheduling-frequency-select';
var saveJobButton = 'button:contains(Save Job)';

var numberOfRows = 0;

// after the document finally loads
$(document).arrive('table', {onceOnly: true}, function() {
  // updates the times for all the rows in the table
  $('table tr').each(function () {
    updateRow(this);
    numberOfRows++;   
  });
  
  // adds listener for on click the Add Job button
  $('button:contains(Add Job)').on('click', function() {
    console.log('Add Job');
    // listen to the side panel to open
    $(document).arrive('#scheduler-job-editor', {onceOnly: true}, function() {
      console.log('hi');
      // listen for the save button to be clicked
      $(saveJobButton).on('click', function() {
        console.log('saving job');
        console.log(numberOfRows);
        // listen for the new row to be created in the table
        $(document).arrive('table tr', {fireOnAttributesModification: true, onceOnly: true}, function() {
          updateRow($('table tr').get(numberOfRows));
          numberOfRows++;
        });
      });

    });
  });
  
  // creates on click event handlers for all the jobs edit buttons
  $('.cursor-pointer > [data-test-icon-name="edit-16"]').each(function() {
    $(this).on('click', function() {
      console.log('testing');
      $(document).arrive(frequencySelector, {onceOnly: true}, function() {
        convertTimeOnSidePanel(frequencySelector);
      });
      
    });
  });
  
  // event handler for when the selected option changes to "Every day at..."
  $(document).on('change', frequencySelector, function() {
    convertTimeOnSidePanel(this);
  });
  
});

// function to update the times in a row
function updateRow(tr) {
  var count = 0;

  // for each column
  $('td', tr).each(function () {
    if (count >= 2 && count <= 4) {
      var span = $(this).children('span')[0];
      var utcTime = $(span).text();

      if (format1.test(utcTime)) {
        $(span).text(convertFormat1ToLocal(utcTime));
      } else if (format2.test(utcTime)) {
        $(span).text(convertFormat2ToLocal(utcTime));
      }

    }

    count += 1;
  })
};

// helper function to update time on UI for side panel popout
function convertTimeOnSidePanel(elem) {
  var selectedOption = $(elem).find("option:selected").text();
//  console.log(selectedOption);
  if (selectedOption.includes('Every day at...')) {
    var offsetSelector = $('#scheduling-offset-select');
    
    // this doesn't work
//    offsetSelector.find('option:contains("' + convertMinutesToHoursMinutes(offsetMinutes, true) + '")').prop('selected',true);
//    console.log(convertMinutesToHoursMinutes(offsetMinutes, true));

    $('#scheduling-offset-select > option').each(function () {
      var oldMinutes = $(this).val();
      var newMinutes = convertMinutesToLocal(oldMinutes);
//        $(this).val(newMinutes);
      $(this).text(convertMinutesToHoursMinutes(newMinutes, true));
    });

    // sorts the options
    offsetSelector.html(offsetSelector.find('option').sort(function(a, b) {
      var textA = $(a).text();
      var textB = $(b).text();

      if (textA.includes('AM') && textB.includes('PM')) {
        return -1;
      } else if (textA.includes('PM') && textB.includes('AM')) {
        return 1;
      } else if (textA.substring(0,2) == '12' && textB.substring(0,2) != '12') {
        return -1;
      } else if (textA.substring(0,2) != '12' && textB.substring(0,2) == '12') {
        return 1;
      } else {
        return textA > textB ? 1 : -1;
      }

    }));

//      offsetSelector.find('option:contains("12:00 AM")').prop('selected',true);

//      $.when(sorting()).done(function () {
//        offsetSelector.get(0).selectedIndex = 0;
//      });
    

    // updates the timezone name
    offsetSelector.next().text(tz);
  }
};

// helper function to convert utc minutes to local minutes
function convertMinutesToLocal(utcMinutes) {
  var minutes = utcMinutes - offsetMinutes;
  
  if (minutes < 0) {
    minutes += minutesInDay;
  } else if (minutes >= minutesInDay) {
    minutes -= minutesInDay;
  }
  
  return minutes;
};

// helper function to convert minutes to a string of hours and minutes
function convertMinutesToHoursMinutes(minutes, paddedHours) {
  var localHours = Math.floor(minutes/60);
  var localId;
  
  if (localHours > 12) {
    localId = 'PM';
    localHours -= 12
  } else if (localHours == 12) {
    localId = 'PM';
  } else if (localHours == 0) {
    localHours += 12
    localId = 'AM';
  } else {
    localId = 'AM';
  }
  
  var localMinutes = minutes % 60;
  var localMinutesString = localMinutes.toString();
  if (localMinutesString.length == 1) {
    localMinutesString = '0' + localMinutesString;
  }  
  
  var localHoursString = localHours.toString();
  if (paddedHours && localHoursString.length == 1) {
    localHoursString = '0' + localHoursString;
  }
  
  return localHoursString + ':' + localMinutesString + ' ' + localId;
  
};

// function to convert format 1 to local time
function convertFormat1ToLocal(utcTime) {
  var utcTimeList = utcTime.split(' ');
  var hmList = utcTimeList[6].split(':');
  var hours = parseInt(hmList[0]);
  var minutes = parseInt(hmList[1]);
  var id = utcTimeList[7];
  
  if (hours == 12) {
    hours -= 12;
  }
  
  var minutes = (hours * 60) + minutes;
  if (id == 'PM') {
    minutes += (12 * 60);
  }
  
  minutes = convertMinutesToLocal(minutes);
  
//  console.log(minutes);
  
  return 'Daily at ' + convertMinutesToHoursMinutes(minutes, false) + ' ' + tz;
  
};

// function to convert format 2 to local time
function convertFormat2ToLocal(utcTime) {
  var localString = new Date(utcTime).toLocaleTimeString('en-us', dateOptions);
  var localStringList = localString.split(',');
  var finalLocalString = localStringList[0] + ',' + localStringList[1] + localStringList[2];
  return finalLocalString;
};