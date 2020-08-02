// Created by Nathaniel Young
// @nyoungstudios on GitHub

// format regular expressions to match to
var format1 = new RegExp('Daily at [0-9]{1,2}:[0-9]{2} [AP]M UTC');
var format2 = new RegExp('[A-Za-z]* [0-9]{1,2}, [0-9]{4} [0-9]{1,2}:[0-9]{2} [AP]M UTC');
var format3 = new RegExp('Hourly at :[0-9]{1,2}');

// date stuff
var d = new Date();
var offsetMinutes = d.getTimezoneOffset();
// offsetMinutes = 450;
// console.log(offsetMinutes);

var tz = d.toLocaleTimeString('en-us',{timeZoneName:'short'}).split(' ')[2];
var minutesInDay = 24 * 60;

let dateOptions = {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZoneName: 'short'};

// text to select different elements
var frequencySelector = '#scheduling-frequency-select';
var saveJobButton = 'button:contains(Save Job)';
var editSelector = '.cursor-pointer > [data-test-icon-name="edit-16"]';
var deleteSelector = '.cursor-pointer > [data-test-icon-name="delete-16"]';

// keeps track of the number of rows in the table aka the number of jobs
var numberOfRows = 0;

// specifies the sort direction of the table
sortDirection = {};

// after the document finally loads
$(document).arrive('table', {onceOnly: true}, function() {
  // updates the times for all the rows in the table
  $('table tr').each(function () {
    numberOfRows += updateRow(this);
  });

  // adds listiener for on click for each column in the table
  $('table thead th').each(function(index) {
    // initializes sort direction
    sortDirection[index] = -1;

    // makes div header appear clickable
    $(this).css("cursor", "pointer");

    // creates on click listener for each column
    $(this).on('click', function() {
      // console.log(sortDirection[index]);
      // sorts rows based on column clicked
      $('table tbody').html($('table tbody tr').sort(function(a, b) {
        var textA = $(a).find('td:eq(' + index + ')').text().trim();
        var textB = $(b).find('td:eq(' + index + ')').text().trim();

        if (index == 0) {
          // sorts commented jobs to the bottom
          var isAComment = textA.substring(2).startsWith('#');
          var isBComment = textB.substring(2).startsWith('#');
          if (isAComment && !isBComment) {
            return -1 * sortDirection[index];
          } else if (!isAComment && isBComment) {
            return 1 * sortDirection[index];
          }
        } else if (index == 2 && textA.startsWith('Daily at ') && textB.startsWith('Daily at ')) {
          // if both of the frequencies are of the daily type (format 1)

          // sorts by AM/PM first
          if (textA.includes('AM') && textB.includes('PM')) {
            return 1 * sortDirection[index];
          } else if (textA.includes('PM') && textB.includes('AM')) {
            return -1 * sortDirection[index];
          } else {
            // parses out hours and minutes
            var colonA = textA.split(':');
            var colonB = textB.split(':');
            var hoursA = parseInt(colonA[0].substring(9));
            var hoursB = parseInt(colonB[0].substring(9));
            // console.log(hoursA);
            // console.log(hoursB);

            // sorts 12 o'clock times first, then sorts by hours, and then minutes
            if (hoursA == 12 && hoursB != 12) {
              return 1 * sortDirection[index];
            } else if (hoursA != 12 && hoursB == 12) {
              return -1 * sortDirection[index];
            } else {
              if (hoursA != hoursB) {
                return (hoursA > hoursB ? -1 : 1) * sortDirection[index];
              } else {
                var minutesA = parseInt(colonA[1].substring(0, 2));
                var minutesB = parseInt(colonB[1].substring(0, 2));
                // console.log(minutesA, minutesB);
                return (minutesA > minutesB ? -1 : 1) * sortDirection[index];
              }
            }

          }

        } else if (index == 3 || index == 4) {
          // sorts Last Run and Next Due by parsing the dates
          // puts Never at the end
          if (index == 3 && textA == 'Never') {
            return -1 * sortDirection[index];
          }
          return (new Date(textA) > new Date(textB) ? -1 : 1) * sortDirection[index];
        }

        // default comparer
        return (textA > textB ? -1 : 1) * sortDirection[index];
      }));

      // reverses the sort direction
      sortDirection[index] *= -1;

      // recreates on click event handlers for all the jobs edit buttons
      $(editSelector).each(function() {
        createForEdit(this);
      });

      // recreates on click event handlers for all the jobs delete buttons
      $(deleteSelector).each(function() {
        createForDelete(this);
      });

    });
  });

  // adds listener for on click the Add Job button
  $('button:contains(Add Job)').on('click', function() {
    addJobListener();
  });

  // creates on click event handlers for all the jobs edit buttons
  $(editSelector).each(function() {
    createForEdit(this);
  });

  // creates on click event handlers for all the jobs delete buttons
  $(deleteSelector).each(function() {
    createForDelete(this);
  });

  // event handler for when the selected option changes to "Every day at..." or "Every hour at..."
  $(document).on('change', frequencySelector, function() {
    convertTimeOnSidePanel(this, true);
  });

});

// if the page loads with the add new/edit job panel open
if (window.location.href.includes('?job=new')) {
  addJobListener();
} else if (window.location.href.includes('?job=')) {
  // gets job id on page load
  var jobId = window.location.href.split('?job=')[1];
//  console.log(jobId);

  // need to get thatParent (aka which row the job id referrers to)

  // listener for the side panel to open
  $('#hk-slide-panels').arrive(frequencySelector, {onceOnly: true}, function(elem) {
    convertTimeOnSidePanel(frequencySelector, false);

    // console.log(elem);
  });

}

// function to listen for side panel to open for add job
function addJobListener() {
  // listener for the side panel to open
  $('#hk-slide-panels').arrive(frequencySelector, {onceOnly: true}, function() {

    // listen for the save button to be clicked
    $(saveJobButton).on('click', function() {

      // listen for the new row to be created in the table
      $(document).arrive('table tr', {fireOnAttributesModification: true, onceOnly: true}, function() {

        var tableTr = $('table tr');
        createForEdit(tableTr.find(editSelector).get(numberOfRows));
        createForDelete(tableTr.find(deleteSelector).get(numberOfRows));
        numberOfRows += updateRow(tableTr.get(numberOfRows));
//        console.log(numberOfRows);
      });
    });

  });
};

// function to create click handler for a job edit button
function createForEdit(trEdit) {
  $(trEdit).on('click', function() {
    var thatParent = this.parentElement.parentElement.parentElement.parentElement.parentElement;

    // listener for the side panel to open
    $('#hk-slide-panels').arrive(frequencySelector, {onceOnly: true}, function(elem) {
      convertTimeOnSidePanel(frequencySelector, false);

      // event handler for the Save Job button to be clicked
      $(saveJobButton).on('click', function() {
        var selectedOption = $(elem).find("option:selected").text();

        // based on selected option, update table row appropriately
        if (selectedOption.includes('Every day at...')) {
          var newTime = $('#scheduling-offset-select').find("option:selected").text();
          updateRowNewTimes(thatParent, updateFormat1ToNewTime(newTime), updateFormat2ToNewTime(newTime));
        } else if (selectedOption.includes('Every 10 minutes')) {
          updateRowNewTimes(thatParent, 'Every 10 minutes', updateFormat2ToNewTime10Minutes());
        } else if (selectedOption.includes('Every hour at...')) {
          var newTime = $('#scheduling-offset-select').find("option:selected").text();
          var newTimeTrim = newTime.trim().substring(1);

          if (newTimeTrim == '00') {
            newTimeTrim = '0';
          }

          updateRowNewTimes(thatParent, 'Hourly at :' + newTimeTrim, updateFormat2ToNewTime1Hour(parseInt(newTimeTrim)));
        }
      });
    });

  });
};

// function to create click handler for a job delete button
function createForDelete(trDelete) {
  $(trDelete).on('click', function() {
    var thatParent = this.parentElement.parentElement.parentElement.parentElement.parentElement;

    // listener for when the delete pop up is created
    $('#modal-overlays').arrive('.modal-box', {onceOnly: true}, function() {
      // event handler for when the delete button is clicked
      $('.btn.btn-danger.async-button.default.ember-view').on('click', function() {
        // updates row count variable
        numberOfRows--;
//        console.log(numberOfRows);

        // removes row from main table
        thatParent.remove();
      });
    });

  });
};

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
      } else if (format3.test(utcTime)) {
        $(span).text(convertFormat3ToLocal(utcTime));
      }

    }

    count += 1;
  })

  return 1;
};

// function to update the new times in a row
function updateRowNewTimes(tr, frequency, nextDue) {
  var count = 0;

  // for each column
  $('td', tr).each(function () {
    if (count == 2) {
      var span = $(this).children('span')[0];
      $(span).text(frequency);
    } else if (count == 4) {
      var span = $(this).children('span')[0];
      $(span).text(nextDue);
    }

    count += 1;
  })
};

// helper function to update time on UI for side panel popout
function convertTimeOnSidePanel(elem, isNewJob) {
  var selectedOption = $(elem).find("option:selected").text();
//  console.log(selectedOption);
  if (selectedOption.includes('Every day at...')) {
    var offsetSelector = $('#scheduling-offset-select');

    // this doesn't work
//    offsetSelector.find('option:contains("' + convertMinutesToHoursMinutes(offsetMinutes, true) + '")').prop('selected',true);
//    console.log(convertMinutesToHoursMinutes(offsetMinutes, true));
//    offsetSelector.get(0).selectedIndex = 0;

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

    // if (isNewJob) {
    //   offsetSelector.get(0).selectedIndex = 0;
    //   offsetSelector.trigger('change');
    // }

    // updates the timezone name
    offsetSelector.next().text(tz);
  } else if(selectedOption.includes('Every hour at...')) {
    var offsetSelector = $('#scheduling-offset-select');

    $('#scheduling-offset-select > option').each(function () {
      var oldMinutes = $(this).val();
      var newMinutes = calcMinuteOffset(oldMinutes);
      // $(this).val(newMinutes);
      $(this).text(calcMinuteOffsetString(newMinutes, true));
    });

    // sorts the options
    offsetSelector.html(offsetSelector.find('option').sort(function(a, b) {
      var textA = $(a).text();
      var textB = $(b).text();
      return textA > textB ? 1 : -1;
    }));

    // if (isNewJob) {
    //   offsetSelector.get(0).selectedIndex = 0;
    //   offsetSelector.trigger('change');
    // }

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

// helper function to calculate just the 0 to 60 minute utc offset
function calcMinuteOffset(minutes) {
  return convertMinutesToLocal(minutes) % 60;
}

// helper function to return the minute offset string for the scheduling offset side panels
function calcMinuteOffsetString(minutes, paddedZero) {
  if (paddedZero) {
    return minutes == 0 ? ':0' + minutes  : ':' + minutes;
  } else {
    return minutes == 0 ? ':' + minutes  : ':' + minutes;
  }
}

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

// function to convert format 3 to local time
function convertFormat3ToLocal(utcTime) {
  var minutes = utcTime.split(':')[1];
  return 'Hourly at ' + calcMinuteOffsetString(calcMinuteOffset(parseInt(minutes)));
};

// function to update format 1 to new time
function updateFormat1ToNewTime(newTime) {
  if (newTime[0] == '0') {
    newTime = newTime.substring(1);
  }

  return 'Daily at ' + newTime + ' ' + tz;
};

// helper function to parse hours and minutes from job scheduler menu
function parseSidecarTime(newTime) {
  var hmList = newTime.split(':');
  var hours = parseInt(hmList[0]);
  var secondHalf = hmList[1].split(' ');
  var minutes = secondHalf[0];

  if (secondHalf[1] == 'PM' && hours != 12) {
    hours += 12;
  } else if (secondHalf[1] == 'AM' && hours == 12) {
    hours -= 12;
  }

  return [hours, minutes]
};

// function to update format 2 to new time
function updateFormat2ToNewTime(newTime) {
  var parsedTime = parseSidecarTime(newTime);
  var hours = parsedTime[0]
  var minutes = parsedTime[1];

  var today = new Date();
  var newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
  if (newDate < today) {
    newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, hours, minutes);
  }

  return convertFormat2ToLocal(newDate);
};

// function to update format 2 to new time for 10 minute interval
function updateFormat2ToNewTime10Minutes() {
  var today = new Date();
  var newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours(), today.getMinutes() + 10);

  return convertFormat2ToLocal(newDate);
};

// function to update format 2 to new time for 1 hour interval
function updateFormat2ToNewTime1Hour(minutes) {
  var today = new Date();
  var newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours(), minutes);
  if (newDate < today) {
    newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours() + 1, minutes);
  }

  return convertFormat2ToLocal(newDate);
};
