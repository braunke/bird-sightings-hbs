var moment = require('moment');
//converting time into local time
function dateFormat(date) {
  m = moment.utc(date);
  return m.parseZone().format("dddd, MMMM Do YYYY, h:mm a");
}

var helpers = {
  dateFormatter : dateFormat
};

module.exports = helpers;