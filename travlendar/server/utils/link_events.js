'use strict';

module.exports.link = function (events, callback) {
  events = events.sort(function (ev1, ev2) {
    let t1 = ev1.eventStart.getTime();
    let t2 = ev2.eventStart.getTime();
    return (t1 <= t2) ? -1 : 1;
  });

  if (events.length > 1) {
    let nextCoord = undefined;
    let prevCoord = undefined;
    var sameDay = null;
    for (let index = 0; index < events.length; index++) {
      if (index == 0) {
        nextCoord = events[index + 1].eventLocationCoord ? events[index + 1].eventLocationCoord : undefined;
        sameDay = sameDayCheck(events[index], events[index + 1]);
        events[index].previousEvent_id = null;
        events[index].nextEvent_id = sameDay? events[index + 1]._id : null;
        events[index].previousEventLocationCoord = undefined;
        events[index].nextEventLocationCoord = sameDay? nextCoord : undefined
      } else if (index == events.length - 1) {
        prevCoord = events[index - 1].eventLocationCoord ? events[index - 1].eventLocationCoord : undefined;
        sameDay = sameDayCheck(events[index], events[index - 1]);
        events[index].previousEvent_id = sameDay? events[index - 1]._id : null;
        events[index].nextEvent_id = null;
        events[index].previousEventLocationCoord = sameDayCheck(events[index], events[index - 1])? prevCoord : undefined;
        events[index].nextEventLocationCoord = undefined;
      } else {
        nextCoord = events[index + 1].eventLocationCoord ? events[index + 1].eventLocationCoord : undefined;
        prevCoord = events[index - 1].eventLocationCoord ? events[index - 1].eventLocationCoord : undefined;
        sameDay = sameDayCheck(events[index], events[index - 1]);
        events[index].previousEvent_id = sameDay? events[index - 1]._id : null;
        events[index].previousEventLocationCoord = sameDay? prevCoord : undefined;
        sameDay = sameDay = sameDayCheck(events[index], events[index + 1]);
        events[index].nextEvent_id = sameDay? events[index + 1]._id : null;
        events[index].nextEventLocationCoord = sameDay? nextCoord : undefined;
      }
    }
  }

  return callback (events);
}

function sameDayCheck(eventOne, eventTwo){
  var ed1 = getDate(eventOne);
  var ed2 = getDate(eventTwo);
  return ed1 === ed2;
}

function getDate(event){
  return event.eventStart.getFullYear()*10000
      + event.eventStart.getMonth()*100
      + event.eventStart.getDate();
}