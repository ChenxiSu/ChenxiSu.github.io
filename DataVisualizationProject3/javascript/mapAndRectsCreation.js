//initialize the map
L.mapbox.accessToken = 'pk.eyJ1IjoiY2hlbnhpMTAyMSIsImEiOiJjaW81czVsb3UwMjAxdzNrandidHF3eTl3In0.KscIyN8_aLsmYzW3LSHLfA';

//var map = L.mapbox.map('map', 'mapbox.streets').setView([34, 116], 4);

var southWest = L.latLng(3.51, 73.33),
    northEast = L.latLng(55.33,136),
    bounds = L.latLngBounds(southWest, northEast);

var map = L.mapbox.map('map', 'mapbox.streets',{
	// maxBounds: bounds,
    maxZoom: 20,
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
var city_aqi={};
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

// implementing the left slider and right slider
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'Map data &copy; OpenStreetMap contributors'
}).addTo(map);

var leftSidebar = L.control.sidebar('sidebar-left', {
    position: 'left'
});
map.addControl(leftSidebar);

var rightSidebar = L.control.sidebar('sidebar-right', {
    position: 'right'
});
map.addControl(rightSidebar);


// reading data from files
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
			city_aqi[""+info["City"]]=Number(info["Average_AQI"]);
			return {
				site: info["City"],
				year: Number(info["Year"]),
				AQI: Number(info["Average_AQI"]),
				x: Number(info["x"]),
				y: Number(info["y"]),
				rank: Number(info["Rank"])
			};
		});


 		var info3 = L.control();

		info3.onAdd = function (map) {
		    this._div = L.DomUtil.create('div', 'info3'); // create a div with a class "info"
		    this.update();
		    return this._div;
		};

		// method that we will use to update the control based on feature properties passed
		info3.update = function (props) {
		    this._div.innerHTML =
						'<h1 class = "center">Visualizing Air Quality in China Across Cities and Time Intervals in 2015</h1>'+
						'<h2 class = "center">Air Quality Index Filter: <span id="filter_value">0</span></h2>'+
						'<div id="sliderBoard">'+
						'<svg id="sliderBoardSvg" width="70" height = "50" transform="translate(0,-20)">'+
						'<rect width="20" height="10" style="fill:#91DC5A"; /><text x="22" y="10" fill="#91DC5A">0~50</text>'+
						'<rect width="20" height="10" y="15" style="fill:#FFDA44"; /><text x="22" y="25" fill="#FFDA44">51~100</text>'+
						'<rect width="20" height="10" y="30" style="fill:#FFA500"; /><text x="22" y="40" fill="#FFA500">101~150</text>'+
						'</svg>'+
						'<input type="range" id="aqiRange" min="0" max="150" value="0" step="1">'
		};
		

		info3.addTo(map);

	    // Disable dragging when user's cursor enters the element
	    info3.getContainer().addEventListener('mouseover', function () {
	        map.dragging.disable();
	    });

	    // Re-enable dragging when user's cursor leaves the element
	    info3.getContainer().addEventListener('mouseout', function () {
	        map.dragging.enable();
	    });


 		var info2 = L.control();

		info2.onAdd = function (map) {
		    this._div = L.DomUtil.create('div', 'info2'); // create a div with a class "info"
		    this.update();
		    return this._div;
		};

		// method that we will use to update the control based on feature properties passed
		info2.update = function (props) {
		    this._div.innerHTML =
						'<button type="button" class="btn btn-success" onclick="rightSidebar.toggle()">Additional Findings</button>'+
						'</div>';
		};
		

		info2.addTo(map);

		// add marker for each city to the map
		setTheMapWithIcon(0);
		
		//update markers in the map after scrollerBar changed
		var aqiScrollerBar = d3.select("#aqiRange");

		aqiScrollerBar.on("input", function (){
			var curAQI = this.value;
			document.getElementById("filter_value").innerText = curAQI;
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
			console.log(data);
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
			var marker = new L.marker(d.LatLng, {icon: curIcon}).bindPopup(d.site+", "+"Rank: "+d.rank+"/187");
			marker.addTo(map);

			marker.on("click", function () {
				leftSidebar.show();
				var tempName = this._popup.getContent();
				var cityName = tempName.split(",")[0].trim();
				//get the data of the whole year by city name
				var cityDailyAQI = cityDailyAQIObj[""+cityName];
				var cityMonthlyHighVsLowArray = cityHighestVsLowestVal[""+cityName];
				var percentageOfDaysInDifferentLevels = getPercentageOfDaysInDifferentLevels(cityDailyAQI);
				//now draw the donut chart
				var average_AQI = (city_aqi[""+cityName]).toFixed(1);
				drawDonutChart(percentageOfDaysInDifferentLevels, cityName, average_AQI);
				console.log(cityMonthlyHighVsLowArray);
				drawBarChart(cityMonthlyHighVsLowArray, cityName);

			});	
		}	
	});
}

function drawBarChart(inputDataArray, cityName){

	d3.select("#monthlyHighVsLowBarChartSvg").remove();
	var svgWidth = document.getElementById("monthlyHighVsLowBarChartDiv").getBoundingClientRect().width,
		svgHeight = document.getElementById("monthlyHighVsLowBarChartDiv").getBoundingClientRect().height;

	var width = 0.85*svgWidth,
        height = 0.8*svgHeight;
    var paddingWidth = 0.13* width;
    var paddingHeight = 0.1* height;
    var xValueArray=[];

    for(var i=0; i<=23; i++){
    	xValueArray.push(i);
    }

    var x = d3.scale.ordinal().domain(xValueArray).rangeRoundBands([0, width], .1);
    var y = d3.scale.linear().domain([0,600]).range([height-2*paddingHeight, 0]);

    var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

    var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(10);

    var svg = d3.select("#monthlyHighVsLowBarChartDiv").append("svg").attr("id","monthlyHighVsLowBarChartSvg")
  	.attr('viewBox','0 0 '+Math.min(svgWidth,svgHeight) +' '+Math.min(svgWidth,svgHeight) )
    .attr('preserveAspectRatio','xMinYMin')
  	.append("g");
  	//.attr("transform", "translate(" + Math.min(width,height) / 2 + "," + Math.min(width,height) / 2 + ")");

  	//draw x-axis
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate("+paddingWidth+","+ (height-paddingHeight) +")")
      //.attr("transform", "translate(0,"+ (height-3*paddingHeight/2) +")")
      .call(xAxis);

    d3.selectAll("#monthlyHighVsLowBarChartDiv g .axis .tick").remove();
    //add the months
    
    var step = (width)/12; 
    var start = paddingWidth+step/4;
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct","Nov" ,"Dec"];
    months.forEach(function (d){
    	svg.append("text").attr("x", start+step*months.indexOf(d) ).attr("y", height-paddingHeight/2)
    	.text(d);
    })


    svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate("+paddingWidth+","+paddingHeight+")")
      .call(yAxis);

    var timer = -1;
    svg.selectAll(".bar")
      .data(inputDataArray)
    .enter().append("rect")
      .attr("class", function (d){ return inputDataArray.indexOf(d)%2 == 0 ? "highBar" : "lowBar";})
      .attr("x", function(d) { 
      	timer++;
      	return x(timer)-paddingWidth;
      })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d)+paddingHeight; })
      .attr("height", function(d) {  	return height-2*paddingHeight - y(d); })
      .attr("transform", "translate("+2*paddingWidth+","+0+")");//+3*paddingHeight/2+
}



function drawDonutChart(inputDataArray, cityName, aqi){

	d3.selectAll("#donutChartDiv svg").remove();
	var width = document.getElementById("donutChartDiv").getBoundingClientRect().width;
	var height = document.getElementById("donutChartDiv").getBoundingClientRect().height;
	//var width=500, height = 400;

	var donutChartSvg = d3.select("#donutChartDiv").append("svg").attr("id","donutChartSvg")
	.attr("viewBox", '0 0 '+Math.min(width,height) +' '+Math.min(width,height))
	.attr("preserveAspectRatio", "xMinYMin")
	.append("g")	
	.attr("transform",  "translate(" + Math.min(width,height) / 2 + "," + Math.min(width,height) / 2 + ")");

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

	var key = function(d){ 
		return d.data.label; 
	};

	var colorSchema = ["#00FF00", "#FFFF00", "#FFA500", "#FF0033", "#CC0000", "#660066"];
	var qualityLevel = ["Excellent <50", "Good <100", "Light Pollution <150", "Moderate <200", 
	"Severe <300", "Very Severe >300"];
	
	var color = d3.scale.ordinal()
	.domain(qualityLevel)
	.range(colorSchema);

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
		.style("fill", function (d) { 
			return color(d.data.label); 
		})
		.attr("class", "slice")
		.attr("value", function (d){
			return 100*d.data.value;
		})
		.attr("label", function (d){
			return d.data.label;
		});

	slice.transition().duration(5000)
		.attrTween("d", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				return arc(interpolate(t));
			};
		});

	slice.exit().remove();


	slice.on("click", function (d){
		
		donutChartSvg.selectAll("rect.focus").remove();
		donutChartSvg.selectAll("text.focus").remove();

		var infoBoard = donutChartSvg.append("g")
		.attr("x", 2*width/3)
		.attr("y", height/10)
		.attr("class", "infoBoard")
		.attr("transform", "translate("+((Math.min(width,height) / 5))+",-"+(Math.min(width,height) / 2) +")");
		

		infoBoard.append("text")
		// .attr("x", 20)
		.attr("y", height/8)
		.attr("class", "focus percentage")
		.attr("transform","translate("+width/6.5+",0)")
		.style("font-size","20px")
		.text( (d.value*100).toFixed(1) +"%");

	

	})

	//draw legned for the donut char
	var lengedIcons = [ {color:colorSchema[0], level:qualityLevel[0]},
	{color:colorSchema[1], level:qualityLevel[1]}, {color:colorSchema[2], level:qualityLevel[2]},
	{color:colorSchema[3], level:qualityLevel[3]}, {color:colorSchema[4], level:qualityLevel[4]},
	{color:colorSchema[5], level:qualityLevel[5]} ];
	
	var widthRect = width/10;
	var heightRect = height/30;
	donutChartSvg.selectAll("rect").data(lengedIcons).enter()
	.append("rect")
	.attr("x", widthRect/5)
	.attr("width",widthRect)
	.attr("y", function (d, i){
		if(i>2){
			return heightRect + i*1.5*heightRect+ height/1.55;
		}else{
			return heightRect + i*1.5*heightRect;
		}
		
	})
	.attr("height", heightRect)
	.attr("fill", function (d){
		return d.color;
	})
	.attr("transform", "translate(-"+Math.min(width,height) / 2+",-"+Math.min(width,height) / 2+")");

	donutChartSvg.selectAll("text .labelForLegend").data(lengedIcons).enter()
	.append("text")
	.attr("x", 1.5*widthRect)
	.attr("y", function (d, i){
		if(i>2){

			return heightRect + 0.8*heightRect + i*1.5*heightRect+height/1.55;
		}
		else{
			return heightRect + 0.8*heightRect + i*1.5*heightRect;
		}
		
	})
	.text(function (d){
		return d.level;
	})
	.attr("transform", "translate(-"+Math.min(width,height) / 2+",-"+Math.min(width,height) / 2+")");
	

	
	//add cityName to the middle of the circle
	var cityNameInCenter = donutChartSvg.append("text").text(cityName).attr("id","cityNameInDonutChart");
	var widthText = Number(document.getElementById("cityNameInDonutChart").getBoundingClientRect().width)/2;
	
	cityNameInCenter.attr("transform","translate(-"+widthText+",0)");	

	var aqiLabel = donutChartSvg.append("text").text("Average AQI Level: ").attr("id","aqiLabel");
	//var widthText = Number(document.getElementById("cityNameInDonutChart").getBoundingClientRect().width)/2;
	aqiLabel.attr("transform","translate("+width/7+" ,"+ height/2.9+")");	//+
	var aqiValueText = donutChartSvg.append("text").text(aqi).attr("id","aqiValueText");
	aqiValueText.attr("transform","translate("+width/4+" ,"+ height/2.3+")");

	var percentageLabel = donutChartSvg.append("text").text("% of Total Days:").attr("id","percentageLabel");
	percentageLabel.attr("transform","translate("+width/4.5+",-"+height/2.2+")");

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
	
	
