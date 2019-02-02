var chart;
var lastDate = moment();

var dataLabels = [];
var dataValues = [];

var peakPowerUsed = 0.0
var basePowerUsed = 0.0

var totalPeakCost = 0.0
var totalBaseCost = 0.0

var summerMonths = [4, 5, 8, 9];
var midSummerMonths = [6, 7];

var summerPeakHours = [13, 14, 15, 16, 17, 18, 19, 20];
var winterPeakHours = [5, 6, 7, 8, 9, 17, 18, 19, 20, 21];

const FLAT = 20.0;

//Dollars per kWh
const MID_SUMMER_PEAK_PRICE = 0.2206;
const MID_SUMMER_BASE_PRICE = 0.0721;
const SUMMER_PEAK_PRICE = 0.1937;
const SUMMER_BASE_PRICE = 0.0718;
const WINTER_PEAK_PRICE = 0.101;
const WINTER_BASE_PRICE = 0.0701;

$(document).ready(function(){
  createDateDropdown();

  todayStr = moment().format('MMMM YYYY');
  getData(todayStr);

  $('#data-type-drop').change(function(){
    var selectedOption = ""
    $( "select option:selected" ).each(function() {
      selectedOption = $( this ).text();
      lastDate = moment(selectedOption, 'MMMM YYYY').endOf('month')
    });
    getData(selectedOption);
  });
});

//- - - - - - - - - - HELPER FUNCTIONS - - - - - - - - - - -
function getData(month) {
  var data = {month: month};
  $.ajax({
    url: "http://asuleaps.com/hems/energy_totals/",
    type: 'GET',
    data: data,
    traditional: true,
    success: function(resp) {
      resetValues();

      for (i = 0; i < resp.data.length; i++) {
        var date = resp.data[i][0];
        var value = resp.data[i][1];

        //calculates the total for how many kWh were used on a particular hour.
        var result = calculateTotals(date, value);

        //append to totals
        if (result.onPeak == true){
          peakPowerUsed += value;
          totalPeakCost += result.cost;
        } else {
          basePowerUsed += value;
          totalBaseCost += result.cost;
        }

        //arrays for graph
        dataLabels.push(date);
        dataValues.push(value);
      }
      peakPowerUsed = Math.round(peakPowerUsed * 100) / 100;
      basePowerUsed = Math.round(basePowerUsed * 100) / 100;
      totalPeakCost = Math.round(totalPeakCost * 100) / 100;
      totalBaseCost = Math.round(totalBaseCost * 100) / 100;

      if (!chart) {
        drawChart();
      } else {
        updateChart();
      }
      fillTable();

      console.log("Peak Cost: " + totalPeakCost);
      console.log("Base Cost: " + totalBaseCost);
      console.log("Peak Power Used: " + peakPowerUsed);
      console.log("Base Power Used: " + basePowerUsed);
    }
  });
}

function calculateTotals(date, value){
  var date_obj = new Date(date);
  var month = date_obj.getMonth();
  var hour = date_obj.getHours();

  function constructReturn(isPeak, cost) {
    return {onPeak: isPeak, cost: cost}
  }
  //TODO: add 3 cent for negative values
  //SUMMER PEAK MONTH
  if ($.inArray(month, midSummerMonths) != -1) {
    //PEAK HOURS
    if ($.inArray(hour, summerPeakHours) != -1){
      return constructReturn(true, value * MID_SUMMER_PEAK_PRICE);
    } else { //BASE HOURS
      return constructReturn(false, value * MID_SUMMER_BASE_PRICE);
    }

  //SUMMER BASE MONTH
  } else if ($.inArray(month, midSummerMonths) != -1) {
    //PEAK HOURS
    if ($.inArray(hour, summerPeakHours) != -1){
      return constructReturn(true, value * SUMMER_PEAK_PRICE);
    } else { //BASE HOURS
      return constructReturn(false, value * SUMMER_BASE_PRICE);
    }

  //WINTER
  } else {
    //PEAK HOURS
    if ($.inArray(hour, summerPeakHours) != -1){
      return constructReturn(true, value * WINTER_PEAK_PRICE);
    } else { //BASE HOURS
      return constructReturn(false, value * WINTER_BASE_PRICE);
    }
  }

}


function fillTable() {
  $(".flat-price").text(FLAT);
  $("#peak-power-used").text(peakPowerUsed);
  $("#peak-cost").text(totalPeakCost);
  $("#base-power-used").text(basePowerUsed);
  $("#base-cost").text(totalBaseCost);
  $("#total-cost").text(FLAT + totalPeakCost + totalBaseCost)
}


function resetValues() {
  dataLabels = [];
  dataValues = [];

  peakPowerUsed = 0.0;
  basePowerUsed = 0.0;

  totalPeakCost = 0.0;
  totalBaseCost = 0.0;
}

//- - - - - - - - - - CHART - - - - - - - - - -
function drawChart() {
  var ctx = $('#graph1');

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dataLabels,
      datasets: [
          {
              label: "Energy Usage (kWh)",
              fill: true,
              lineTension: 0.1,
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              borderColor: "rgba(255,99,132,1)",
              borderCapStyle: 'butt',
              borderDash: [],
              borderDashOffset: 0.0,
              borderJoinStyle: 'miter',
              pointBorderColor: "rgba(255,99,132,1)",
              pointBackgroundColor: "#fff",
              pointBorderWidth: 1,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: "rgba(255, 99, 132, 0.2)",
              pointHoverBorderColor: "rgba(255,99,132,1)",
              pointHoverBorderWidth: 2,
              pointRadius: 1,
              pointHitRadius: 10,
              data: dataValues,
              spanGaps: false,
          }
      ]
    },
    options: {
      scales: {
        xAxes: [{
          display: true,
          type: 'time',
          time: {
            max: moment()
          }
        }]
      }
    }
  });
}

function updateChart() {
  chart.data.datasets[0].data = dataValues;
  chart.data.labels = dataLabels;
  chart.options.scales.xAxes[0].time.max = lastDate
  chart.update();
}

function createDateDropdown() {
  firstMonth = moment(first_month, 'MMMM YYYY');
  today = moment();
  selector = $('#date-select')

  //create options
  for (var m = moment(firstMonth); m.diff(today, 'months') <= 0; m.add(1, 'months')) {
    monthYearStr = m.format('MMMM YYYY');
    selector.append($("<option></option>")
                     .attr("value",monthYearStr)
                     .text(monthYearStr));
  }

  //select last value
  todayStr = today.format('MMMM YYYY')
  $('#date-select option:contains("' + todayStr + '")').prop('selected', true)

}
