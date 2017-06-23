
//Prob easiest to have a few set sizes for the map, which change at broswer size breakpoints. So `pageSize` will be determined by some function which tests browser size (e.g. IS_MOBILE() functions in past projects). I don't think it's as straightforward to have a continuously resizing graphic. Note that these values are just placeholders, they'll need to be tested/updated, and potentially more or fewer sizes are needed
var pageSize = "huge"
var mapSizes = {
"huge": { "width": 1200, "height": 1570, "scale": 4300, "translate": [410,240], "chartWidth": 96, "chartMargin": 11},
"large": { "width": 750, "height": 600, "scale": 3100, "translate": [300,200], "chartWidth": 62, "chartMargin": 5},
"medium": { "width": 900, "height": 1270, "scale": 3800, "translate": [380,220], "chartWidth": 76, "chartMargin": 8},
"small": { "width": 900, "height": 1270, "scale": 3800, "translate": [380,220], "chartWidth": 76, "chartMargin": 8}
}

var startYear = 1994;
var endYear = 2014;

var mapMargin = {top: 30, right: 20, bottom: 30, left: 50},
mapWidth = mapSizes[pageSize]["width"] - mapMargin.left - mapMargin.right,
mapHeight = mapSizes[pageSize]["height"] - mapMargin.top - mapMargin.bottom;



d3.csv("data/data.csv", function(error, trendsDataFull) {
        trendsDataFull.forEach(function(d) {

        })


  function  renderMap(startYear, endYear) {


  console.log(startYear+ endYear)


  //function called on load to create the svg and draw an initial set of line charts. trendsData is passed in from a csv, and startYear/endYear are just for the file uploader (will be constants in final features)

    // generateButtons(trendsData, startYear, endYear) //just for the file uploader

    //generate an svg, position it
    var trendsData = trendsDataFull.filter(function(d) { 
      return d.State !== "USA"
    })

    mapSvg = d3.select("#vis")
      .data([trendsData])
      .append("svg")
        .attr("width", mapWidth + mapMargin.left + mapMargin.right)
        .attr("height", mapHeight + mapMargin.top + mapMargin.bottom)
        .append("g")
          .attr("transform", "translate(" + mapMargin.left + "," + mapMargin.top + ")");

    //Filter data by year. Note that `startYear` and `endYear` will be fixed for the actual feature, they're just variables here for purposes of the tester/file uploader
    trendsData = trendsData.filter(function(o){ 
      return +o.Year >= startYear
    })

    //cast everything except the `State` and `Year` columns to float
    trendsData.forEach(function(d) {
      keys = Object.keys(d);
      for(var i = 0; i<keys.length; i++){
        var key = keys[i]
        if(key == "State" || key == "Year"){
          continue;
        }else{
          d[key] = +d[key]
        }
      }
    });

    //reshape data, nesting by State
    var trendsDataNest = d3.nest()
      .key(function(d) {return d.State })
      .entries(trendsData);

    //generate a list of states in the dataset. For any states not in the dataset (stored temporarily in tmpKeys) but in the `stateData` object (which is in the global scope, stored in `stateData.js`, create a new data set, just for the blank states (not in data csv), which wil be greyed out
    var tmpKeys = []
    for(var i = 0; i < trendsDataNest.length; i++){
      var obj = trendsDataNest[i]
      if(obj.hasOwnProperty("key")){
        tmpKeys.push(obj.key)
      }
    }

    var blankStateData = stateData.features.filter(function(o) { return tmpKeys.indexOf(o.properties.abbr) == -1})


    //tile grid map projection and geo path
    var projection = d3.geoEquirectangular()
      .scale(mapSizes[pageSize]["scale"])
      .center([-96.03542,41.69553])
      .translate(mapSizes[pageSize]["translate"]);

    var geoPath = d3.geoPath()
      .projection(projection);

    //for each non blank state, create a group which will hold the line chart
    var chartWidth = mapSizes[pageSize]["chartWidth"]
    var chartMargin = mapSizes[pageSize]["chartMargin"]
    var map = mapSvg
      .selectAll(".state")
      .data(trendsDataNest)
      .enter()
      .append("g")
        .attr("class","state")
        .attr("transform", function(d,i){
          //grab the element in statesData corresponding to the correct trendsData state, and position accordingly
          var tmp = stateData.features.filter(function(o) { return o.properties.abbr == d.key} )
          return "translate(" + geoPath.centroid(tmp[0]) + ")"
        })

    //draw greyed out blank states
    var blank = mapSvg
      .selectAll(".blank")
      .data(blankStateData)
      .enter()
      .append("g")
        .attr("class","blank")
        .attr("transform", function(d,i){
          return "translate(" + geoPath.centroid(d) + ")"
        })

    //blank sate background
    blank.append("rect")
      .attr("width",chartWidth-2*chartMargin + 8)
      .attr("height",chartWidth-2*chartMargin + 8)
      .attr("x",chartMargin - 4)
      .attr("y",chartMargin - 4)
      .style("fill","#b3b3b3") 

    //chart background
    map.append("rect")
      .attr("width",chartWidth-2*chartMargin + 8)
      .attr("height",chartWidth-2*chartMargin + 8)
      .attr("x",chartMargin - 4)
      .attr("y",chartMargin - 4)
      .style("fill","#1696d2") 



    //set up scales for charts. THe code here assumes all states are on the same x/y scale. Alaska and the US avg will prob need to have special scales written for them, since they will be on a separate scale (I think). Also note currently there is no US average chart/tile.
    var mapX = d3.scaleLinear().range([chartMargin, chartWidth-chartMargin]);
    var mapY = d3.scaleLinear().range([chartWidth-chartMargin, chartMargin]);

    //this is just for the file uploader, setting the key onload to whatever column is first in the data file, other than State/Year. In the real feature, firstKey will just be a constant
    var firstKey = "adj_revratio_all"
    var keys = Object.keys(trendsData[0])
    // for(var i = 0; i < keys.length; i++){
    //   if(keys[i] == "State" || keys[i] == "Year"){ console.log(keys[i])
    //    continue
    //   }else{ 
    //   firstKey = keys[i];
    //   console.log(firstKey);
    //     break;
    //   }
    // }
    mapX.domain([startYear,endYear]);
    console.log(startYear+ endYear)

    mapY.domain([d3.min(trendsData, function(d) { return d[firstKey]; }), d3.max(trendsData, function(d) { return d[firstKey]; })]); 



    //line chart axes
    var mapXAxis = d3.axisBottom(mapX)
    var mapYAxis = d3.axisLeft(mapY)

    //line chart line
    var mapline = d3.line()
      .x(function(d) { return mapX(d.Year); })
      .y(function(d) { return mapY(d[firstKey]); });

    //A white line at y=1. This is just a placeholder. In the final feature, we want some sort of distinction of y=1 for the ratio graphs, but not the level graphs. Will likely be two rects (above and below y=1) instead of a line, but TBD
    map.append("line")
      .attr("x1",chartMargin)
      .attr("x2",chartWidth-chartMargin)
      .attr("y1",mapY(1))
      .attr("y2",mapY(1))
      .attr("class","ratioOneLine")

    //draw the line on the chart!
    map.append("path")
      .attr("class", function(d){ return "standard line " + d.key })
      .attr("d", function(d){  return mapline(d.values)})

    //see drawBackMapCurtain for explanation--draw a "curtain" on top of the line, which can be animated away to simulate the line animating left to right
    map.append("rect")
      .attr("class","mapCurtain")
      .attr("width",chartWidth-2*chartMargin)
      .attr("height",chartWidth-2*chartMargin)
      .attr("x",chartMargin)
      .attr("y",chartMargin)
      .style("fill","#1696d2")

    //draw the state name on the tile
    map.append("text")
      .text(function(d){ return d.key })
      .attr("class", "mapLable standard")
      .attr("text-anchor", "end")
      .attr("x",chartWidth+chartMargin - 25)
      .attr("y",chartWidth+chartMargin - 25)

    //draw state names, with a different class, on blank tiles
    blank.append("text")
      .text(function(d){ return d.properties.abbr })
      .attr("class", "mapLable blank")
      .attr("text-anchor", "end")
      .attr("x",chartWidth+chartMargin - 25)
      .attr("y",chartWidth+chartMargin - 25)

    //add the X axis 
    map.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (chartWidth-chartMargin) + ")")
      .call(mapXAxis);

    //add the Y Axis
    map.append("g")
    .attr("class", function(d){ return "y axis " + d.key})
    .attr("transform", "translate(" + chartMargin + ",0)")
    .call(mapYAxis);

    //draw back the curtain, animating the line on load
    drawBackMapCurtain(0)
  }

/*IF ADJUSTED IS CHECKED*/
var adjusted = "adj_"

function checkAdjusted() {
  if (d3.select('input').property('checked') == true) { console.log('adj')
    adjusted = "adj_";
    selectedCategory = adjusted + d3.select(".selected-category").attr("id") + selectedToggles;
    console.log(selectedCategory)
    drawMapLine(selectedCategory, startYear, endYear)

  } else {
      adjusted = ""
      selectedCategory = adjusted + d3.select(".selected-category").attr("id") + selectedToggles;
      console.log(selectedCategory)
      drawMapLine(selectedCategory, startYear, endYear)
    }
}


d3.select("input").on("change", checkAdjusted)

/*STEP BUTTONS*/
var selectedCategory;

  d3.selectAll(".button")
    .on("click", function(d){  console.log(selectedToggles)
      checkAdjusted();
      console.log(adjusted)
      d3.selectAll(".button").classed('selected-category', false)
      d3.select(this).classed('selected-category', true)
      selectedCategory = adjusted + d3.select(this).attr("id") + selectedToggles;
      console.log(selectedCategory)
      drawMapLine(selectedCategory, startYear, endYear)
    })

/*TOGGLE BUTTONS*/
var selectedToggles = "all";

var combinedClassesArray = []

//ADD CLASS OF EACH TOGGLE THAT IS ON TO COMBINEDCLASSESARRAY ABOVE
function getCombinedClasses() {
  combinedClassesArray.length = 0;
   d3.selectAll(".button_toggle.on")
          .each(function(d, i) { //get class of each toggle that is still turned on and add it to the combinedClasses array
            var toggleClass = d3.select(this).attr('class').split(" ")[0];
            console.log(combinedClassesArray)
            combinedClassesArray.push(toggleClass);
          })
  var initialSelectedToggles = combinedClassesArray.join('')
  initialSelectedToggles == "lostfe" ? selectedToggles = "all" : selectedToggles = initialSelectedToggles
  console.log(selectedToggles)
}

 d3.selectAll(".button_toggle")
    .on('click', function() {
    //FOR ADJUSTED VALUES
      if(d3.select(this).classed("on")){ 
        d3.select(this).classed("on", false)
        d3.select(this).classed("off", true)
        getCombinedClasses();
        selectedCategory = adjusted + d3.select(".selected-category").attr("id") + selectedToggles
        console.log(selectedCategory)
        checkAdjusted();
        //drawMapLine(selectedCategory, startYear, endYear)
      }
      else {
        d3.select(this).classed("on", true)
        d3.select(this).classed("off", false)
        getCombinedClasses();
        selectedCategory = adjusted + d3.select(".selected-category").attr("id") + selectedToggles
        console.log(selectedCategory)
        checkAdjusted();
      }

    }) 
  function drawMapLine(variable, startYear, endYear){
  //function called when interacting with the UI. `variable` is the column header being graphed, and startYear/endYear are just for the file uploader (will be constants in final features)
  console.log(variable+ startYear+ endYear)

    //reshape the data
    var trendsData = d3.select("#vis").datum()
    var trendsDataNest = d3.nest()
      .key(function(d) {return d.State;})
      .entries(trendsData);

    var chartWidth = mapSizes[pageSize]["chartWidth"]
    var chartMargin = mapSizes[pageSize]["chartMargin"]

    //update data binding
    d3.select("#vis svg")
      .selectAll(".state")
      .data(trendsDataNest)

    //update scales
    var mapX = d3.scaleLinear().range([chartMargin, chartWidth-chartMargin]);
    var mapY = d3.scaleLinear().range([chartWidth-chartMargin, chartMargin]);

    mapX.domain([startYear,endYear]);

    //min and max value for scales determined by min/max values in all data (so they're the same for all states)
    var mapY = d3.scaleLinear().range([chartWidth-chartMargin, chartMargin])
    var max = d3.max(trendsData, function(d) { return d[variable]; })
    var min = d3.min(trendsData, function(d) { return d[variable]; })

    mapY.domain([min, max]); 

    //udpdate line function
    var mapline = d3.line()
      .x(function(d) { return mapX(d.Year); })
      .y(function(d) { return mapY(d[variable]); });

    var mapYAxis = d3.axisLeft(mapY)

    //animate y axis change. Note most y axes are hidden, but axis in key will change
    //note it's assumed that startyear/endyear don't change when variables are changed, so no need to animate x axis update
    d3.selectAll("#vis .y.axis")
      .transition()
        .call(mapYAxis)

    //update the line. In some cases may need to drawBackMapCurtain here (see below)
    d3.selectAll("#vis svg .line")
      .transition()
      .duration(1200)
        .attr("d", function(d){ return mapline(d.values)})

    //move y=1 line. Note this will need to be hidden (or whatever comparable elements exist will be hidden) for the levels graphs
    d3.selectAll(".ratioOneLine")
    .transition()
    .duration(1200)
      .attr("y1",mapY(1))
      .attr("y2",mapY(1))

    //pretty sure this line can be remove, since x axis/scales aren't changing (as can all other references to x scale in this function), but keeping here in case it turns out the scales will change with different variabels (in which case you'll need to add some more code to animate the x axes etc)
    var mapXAxis = d3.axisBottom(mapX)
  }





  function drawBackMapCurtain(delay){
  //To create the illusion of the lines in the chart animating across the chart area (left to right, small to large X values), I created a "curtain" which is a rect covering the line chart. Then, by animating it's width to 0, the animation effect is simulated. I would imagine that when the user switches between different units, on the graphs, e.g. when they switch from dollars to ratios, the curtain should draw back. On the other hand, if a user switches between combinations of state/local/federal, or toggles the adjustment on/off, the curtain should not draw back. Does that sound right to you?

    var chartWidth = mapSizes[pageSize]["chartWidth"]
    var chartMargin = mapSizes[pageSize]["chartMargin"]

    d3.selectAll(".mapCurtain")
    .transition()
    .duration(0)
      .attr("width",chartWidth-2*chartMargin)
      .attr("x",chartMargin)
      .transition()
      .delay(delay + 200)
      .duration(1200)
        .attr("width",0)
        .attr("x", chartWidth - chartMargin)
  }



      renderMap(1995, 2014);

})

