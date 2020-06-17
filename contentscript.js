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

let options = {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZoneName: 'short'};

// after the document finally loads
document.arrive('table', function() {
  $('table tr').each(function () {
    var count = 0;
    
    $('td', this).each(function () {
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
    });
  });
  
  // unbind all arrive events on document element
  document.unbindArrive();
});

$('#scheduling-frequency-select').change(function() {
  console.log('hi');
}).change();

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
  var localMinutesString;
  if (localMinutes == 0) {
    localMinutesString = '00';
  } else {
    localMinutesString = localMinutes.toString();
  }
  
  var localTimeString = 'Daily at ' + localHours.toString() + ':' + localMinutesString + ' ' + localId + ' ' + tz;
  
  return localTimeString;
  
};

// function to convert format 2 to local time
function convertFormat2ToLocal(utcTime) {
  var localString = new Date(utcTime).toLocaleTimeString('en-us', options);
  var localStringList = localString.split(',');
  var finalLocalString = localStringList[0] + ',' + localStringList[1] + localStringList[2];
  return finalLocalString;
};