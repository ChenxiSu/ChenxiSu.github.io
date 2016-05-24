//initialize the map
L.mapbox.accessToken = 'pk.eyJ1IjoiY2hlbnhpMTAyMSIsImEiOiJjaW81czVsb3UwMjAxdzNrandidHF3eTl3In0.KscIyN8_aLsmYzW3LSHLfA';

var southWest = L.latLng(3.51, 73.33),
    northEast = L.latLng(55.33,136),
    bounds = L.latLngBounds(southWest, northEast);

var map = L.mapbox.map('map', 'mapbox.streets',{
	maxBounds: bounds,
    maxZoom: 10,
    minZoom: 4
}).setView([34, 116], 8);

map.fitBounds(bounds);
map.dragging.enabled();

var svg = d3.select("#blank").append("svg").attr("height", height).attr("width", width);

var height = 500;
var width = 900;
var padding = 50;

var months, AQI, cities;
var monthInfo, AQIInfo, cityInfo;

var xScale;
var yScale;


var pollutionLevel = {green: 50, yellow: 100, orange: 150, lightRed: 200, darkRed: 300, purple: 400};
var pollutionLevelValue = [50, 100, 150, 200, 300];
//for a specific city, put the name as key and a array of 365 data as values
var cityDailyAQIObj = {};

var cityHighestVsLowestVal = {};

var svgRect = d3.select("#rectPlot");

var choice; // The city that is choosen on the map

var cityIcon = L.Icon.extend({
    options: {
        iconSize:     [38, 95],
        shadowSize:   [50, 64],
        iconAnchor:   [22, 94],
        popupAnchor:  [-3, -76],
        labelAnchor:  [6, 0]
    }
});

d3.csv("data/cities.csv", function (error, data) {
	cityInfo = data;
	cities = cityInfo.map(function (info) {
		return {
			site: info["City"],
			year: Number(info["Year"]),
			AQI: Number(info["AQI"]),
			day: Number(info["Day"]),
			quality: Number(info["Quality Number"])
		};
	})


	d3.csv("data/map.csv", function (error, mapData) {
	
		AQIInfo = mapData;
		AQI = AQIInfo.map(function (info) {	
			return {
				site: info["City"],
				year: Number(info["Year"]),
				AQI: Number(info["Average_AQI"]),
				x: Number(info["x"]),
				y: Number(info["y"]),
			};
		});

		// add marker for each city to the map
		setTheMapWithIcon(0);
		
		//update markers in the map after scrollerBar changed
		var aqiScrollerBar = d3.select("#aqiRange");

		aqiScrollerBar.on("input", function (){
			var curAQI = this.value;
			updateMapIcon(curAQI);
		});

		//load the daily data 
		var curCityName = "";
		var curMonth = 1;
		var curCityValuesForYear = [];
		var curCityMonthlyValuePairArray = [];
		var lowestAQIForCity=1000;
		var highestAQIForCity=0;
		

		d3.csv("data/AllCities_English_CSV.csv", function (error, data) {
			if(error) console.log(error);
			curCityName = data[0].City;

			data.forEach( function (d){
				if(d.City !== curCityName){
					var curArray = curCityValuesForYear;	
					//monthly value pair should be updated too
					curCityMonthlyValuePairArray.push(highestAQIForCity);
					curCityMonthlyValuePairArray.push(lowestAQIForCity);
					lowestAQIForCity = 1000;
					highestAQIForCity = 0;
					curMonth = 1;
					//put the city and its data into the object
					cityDailyAQIObj[""+curCityName] = curArray;
					var tempArray = curCityMonthlyValuePairArray;
					cityHighestVsLowestVal[""+curCityName] = tempArray;

					//initialize for next city
					lowestAQIForCity = 1000;
					highestAQIForCity = 0;
					curCityValuesForYear = [];
					curCityMonthlyValuePairArray=[];
					curCityName = d.City;
					curCityValuesForYear.push(d.AQI);
				}

				else{
					curCityValuesForYear.push(d.AQI);
					var month = (""+d.Month).split("/")[0];
					//when month changes, add record to array and initialize them
					if(month != curMonth) {						
						curCityMonthlyValuePairArray.push(highestAQIForCity);
						curCityMonthlyValuePairArray.push(lowestAQIForCity);
						lowestAQIForCity = 1000;
						highestAQIForCity = 0;
						curMonth = month;
					}

					if(Number(d.AQI) > highestAQIForCity) highestAQIForCity = d.AQI;
					if(Number(d.AQI) < lowestAQIForCity) lowestAQIForCity = d.AQI;

				}

			});
			//now I've got all cites with 1 year data everyday and the monthly highest and lowest value
		});

	});

});


function updateMapIcon(lowestAQI){
	if(lowestAQI != 0){
		d3.selectAll(".leaflet-marker-icon").remove();
		setTheMapWithIcon(lowestAQI);
	}
}
	
//set the map with icons	
function setTheMapWithIcon(aqiValue){

	AQI.forEach(function (d) {
		if(d.AQI > aqiValue){
			d.LatLng = new L.LatLng(d.x, d.y);
			var index = getIconIndex(d.AQI);
			var curIcon = setIconByIndex(index);
			var marker = new L.marker(d.LatLng, {icon: curIcon}).bindPopup(d.site);
			marker.addTo(map);

			marker.on("click", function () {
				var cityName = this._popup.getContent();
				//get the data of the whole year by city name
				var cityDailyAQI = cityDailyAQIObj[""+cityName];
				var cityMonthlyHighVsLowArray = cityHighestVsLowestVal[""+cityName];
				var percentageOfDaysInDifferentLevels = getPercentageOfDaysInDifferentLevels(cityDailyAQI);
				//now draw the donut chart
				drawDonutChart(percentageOfDaysInDifferentLevels, cityName);
				console.log(cityMonthlyHighVsLowArray);
				drawBarChart(cityMonthlyHighVsLowArray, cityName);

			});	
		}	
	});
}

function drawBarChart(inputDataArray, cityName){

	d3.select("#monthlyHighVsLowBarChartSvg").remove();
	var width = document.getElementById("monthlyHighVsLowBarChartDiv").getBoundingClientRect().width,
        height = document.getElementById("monthlyHighVsLowBarChartDiv").getBoundingClientRect().height*0.8;
    var paddingWidth = 0.05* width;
    var paddingHeight = 0.1* height;
    var xValueArray=[];

    for(var i=0; i<=23; i++){
    	xValueArray.push(i);
    }

    var x = d3.scale.ordinal().domain(xValueArray).rangeRoundBands([0, width-2*paddingWidth], .1);
    var y = d3.scale.linear().domain([0,600]).range([height-2*paddingHeight, 0]);

    var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

    var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(10);

    var svg = d3.select("#monthlyHighVsLowBarChartDiv").append("svg").attr("id","monthlyHighVsLowBarChartSvg")
    .attr("width", width)
    .attr("height", height)
  	.append("g");

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate("+2*paddingWidth+","+ (height-3*paddingHeight/2) +")")
      .call(xAxis);

    d3.selectAll("#monthlyHighVsLowBarChartDiv g .axis .tick").remove();
    //add the months
    
    var step = (width-2*paddingWidth)/12; 
    var start = 2*paddingWidth+step/4;
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct","Nov" ,"Dec"];
    months.forEach(function (d){
    	svg.append("text").attr("x", start+step*months.indexOf(d) ).attr("y", height-paddingHeight)
    	.text(d);
    })


    svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate("+2*paddingWidth+","+paddingHeight/2+")")
      .call(yAxis);
    // .append("text")
    //   .attr("y", -paddingHeight/1.5)
    //   .attr("dy", ".71em")
    //   .style("text-anchor", "end")
    //   .text("AQI");
    var timer = -1;
    svg.selectAll(".bar")
      .data(inputDataArray)
    .enter().append("rect")
      .attr("class", function (d){ return inputDataArray.indexOf(d)%2 == 0 ? "highBar" : "lowBar";})
      .attr("x", function(d) { 
      	timer++;
      	return x(timer);
      })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d); })
      .attr("height", function(d) {  	return height-2*paddingHeight - y(d); })
      .attr("transform", "translate("+2*paddingWidth+","+paddingHeight/2+")");//+3*paddingHeight/2+
}


function drawDonutChart(inputDataArray, cityName){
	console.log(inputDataArray);
	d3.selectAll("#donutChartDiv svg").remove();
	var donutChartSvg = d3.select("#donutChartDiv").append("svg").attr("id","donutChartSvg").append("g");

	donutChartSvg.append("g")
		.attr("class", "slices");
	donutChartSvg.append("g")
		.attr("class", "labels");
	donutChartSvg.append("g")
		.attr("class", "lines");


	var width = document.getElementById("donutChartDiv").getBoundingClientRect().width,
        height = document.getElementById("donutChartDiv").getBoundingClientRect().height,
        radius = 0.4*Math.min(width, height);

	var pie = d3.layout.pie()
		.sort(null)
		.value(function(d) {
			return d.value;
		});

	var arc = d3.svg.arc()
		.outerRadius(radius * 0.8)
		.innerRadius(radius * 0.45);
	var outerArc = d3.svg.arc()
		.innerRadius(radius * 0.9)
		.outerRadius(radius * 0.9);
    
	donutChartSvg.attr("transform", "translate(" + 0.55* width + "," + height / 2 + ")");

	var key = function(d){ 
		return d.data.label; 
	};

	var color = d3.scale.ordinal()
	.domain(["Excellent", "Good", "Light pollution", "Moderate Pollution", "Severe Pollution", "Very Severe Pollution"])
	.range(["#00FF00", "#FFFF00", "#FFA500", "#FF0033", "#CC0000", "#660066"]);

	function processData(){
		var labels = color.domain();
		return labels.map(function (label){
			var index = labels.indexOf(label);
			var keys = Object.keys(inputDataArray);
			var key = keys[index];
			var value = inputDataArray[""+key];
			return { label: label, value: value };
		})
	}
	var data1 = processData();

	/* ------- PIE SLICES -------*/
	var slice = donutChartSvg.select("#donutChartDiv .slices").selectAll("#donutChartDiv path.slice")
		.data(pie(data1), key);

	slice.enter()
		.insert("path")
		.style("fill", function(d) { 
			return color(d.data.label); 
		})
		.attr("class", "slice");

	slice.transition().duration(1000)
		.attrTween("d", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				return arc(interpolate(t));
			};
		})

	slice.exit().remove();

	/* ------- TEXT LABELS -------*/

	var text = donutChartSvg.select(".labels").selectAll("text")
		.data(pie(data1), key);

	text.enter()
		.append("text")
		.attr("dy", ".35em")
		.attr("class","donutLabel")
		.style("font-size","15px")
		.text(function(d) {
			return d.data.label;
		});
	
	function midAngle(d){
		return d.startAngle + (d.endAngle - d.startAngle)/2;
	}

	text.transition().duration(1000)
		.attrTween("transform", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				var pos = outerArc.centroid(d2);
				pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
				return "translate("+ pos +")";
			};
		})
		.styleTween("text-anchor", function(d){
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				return midAngle(d2) < Math.PI ? "start":"end";
			};
		});

	text.exit().remove();

	/* ------- SLICE TO TEXT POLYLINES -------*/

	var polyline = donutChartSvg.select("#donutChartDiv .lines").selectAll("#donutChartDiv polyline")
		.data(pie(data1), key);
	
	polyline.enter()
		.append("polyline").attr("class","donutPolyLine");

	polyline.transition().duration(1000)
		.attrTween("points", function(d){
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				var pos = outerArc.centroid(d2);
				pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
				return [arc.centroid(d2), outerArc.centroid(d2), pos];
			};			
		});

	polyline.exit().remove();

	//add cityName to the middle of the circle
	var cityNameInCenter = donutChartSvg.append("text").text(cityName).attr("id","cityNameInDonutChart");
	var widthText = Number(document.getElementById("cityNameInDonutChart").getBoundingClientRect().width)/2;
	cityNameInCenter.attr("transform","translate(-"+widthText+",0)");

	var textArray = document.getElementsByClassName("donutLabel");
	var lineArray = document.getElementsByClassName("donutPolyLine");	
		
	var keys = Object.keys(inputDataArray);
	keys.forEach(function (d){
		var index = keys.indexOf(d);
		var value = inputDataArray[""+d];
		if(value<0.01){
			textArray[index].style = "display: none";
			lineArray[index].style = "display: none";
		}
	})

		
		

}

function getPercentageOfDaysInDifferentLevels(aqiValuesArray){
	var greenDays = 0;
	var yellowDays = 0;
	var orangeDays = 0;
	var lightRedDays = 0;
	var darkRedDays = 0;
	var purpleDays = 0;
	
	aqiValuesArray.forEach(function (d){
		if(d <= pollutionLevel.green) greenDays++;
		else if(d<= pollutionLevel.yellow) yellowDays++;
		else if(d<= pollutionLevel.orange) orangeDays++;
		else if(d<= pollutionLevel.lightRed) lightRedDays++;
		else if(d<= pollutionLevel.darkRed) darkRedDays++;
		else purpleDays++;
	});

	// calculate the percentage
	var sumNumber = aqiValuesArray.length;
	var percentageOfDays = { greenPercent: greenDays/sumNumber, yellowPercent:yellowDays/sumNumber,
		orangePercent: orangeDays/sumNumber,  lightRedPercent: lightRedDays/sumNumber, 
		darkRedPercent: darkRedDays/sumNumber, purplePercent: purpleDays/sumNumber };

	return percentageOfDays;
}

function setIconByIndex(index){
	if(index == 0) return new cityIcon({iconUrl: 'img/green-location.svg'});
	else if(index == 1) return new cityIcon({iconUrl: 'img/yellow-location.svg'});
	else if(index == 2) return new cityIcon({iconUrl: 'img/orange-location.svg'});
	else if(index == 3) return new cityIcon({iconUrl: 'img/lightRed-location.svg'});
	else if(index == 4) return new cityIcon({iconUrl: 'img/darkRed-location.svg'});
	else if(index == 5) return new cityIcon({iconUrl: 'img/purple-location.svg'});
}
	
function getIconIndex(aqiLevel){
	for(var i=0; i<pollutionLevelValue.length; i++){
		if( aqiLevel<= pollutionLevelValue[i] ) return i;
	}
	return pollutionLevelValue.length;
}

function translateSVG() {
	var viewBoxLeft = document.querySelector("svg.leaflet-zoom-animated").viewBox.animVal.x;
	var viewBoxTop = document.querySelector("svg.leaflet-zoom-animated").viewBox.animVal.y;
	// Reszing width and height incase of window resize
	svgMap.attr("width", window.innerWidth);
	svgMap.attr("height", window.innerHeight);
	// Adding the ViewBox attribute to our SVG to contain it
	svgMap.attr("viewBox", function () {
	    return "" + viewBoxLeft + " " + viewBoxTop + " "  + window.innerWidth + " " + window.innerHeight;
	});
	// Adding the style attribute to our SVG to transkate it
	svgMap.attr("style", function () {
	    return "transform: translate3d(" + viewBoxLeft + "px, " + viewBoxTop + "px, 0px);";
	});
}

function update() {
	translateSVG();
	images.attr("x", function (d) { return map.latLngToLayerPoint(d.LatLng).x; })
	images.attr("y", function (d) { return map.latLngToLayerPoint(d.LatLng).y; })
	images.attr("height", function (d) { return 0.5 * Math.pow(2, map.getZoom()); })	
	images.attr("width", function (d) { return 0.5 * Math.pow(2, map.getZoom()); });	
}
	
	
