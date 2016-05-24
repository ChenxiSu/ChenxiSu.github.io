var height3 = 500;
var width3 = 900;
var padding3 = 50;

var compareMonths, compareDays, compareTimes;
var compareMonthsInfo, compareDaysInfo, compareTimesInfo;

var checkedGroups, checkedGroups2;

var checked = [1, 1, 1];
var checked2 = [1, 1, 1];
var checked3 = [1, 1, 1, 1, 1];

// For comparison of months
var low = new Array();
var middle = new Array();
var high = new Array();

// For comparison of days of a week
var low2 = new Array();
var middle2 = new Array();
var high2 = new Array();

var cities = new Array(); // Store the data of five cities
var citiesNames = ["Beijing", "Shenyang", "Chengdu", "Guangzhou", "Shanghai"];

var group = ["Low", "Middle", "High"];

var xScale, xScale2, xScale3;
var yScale, yScale2, yScale3;

var groupColor = ["green", "orange", "red"]; // Color of 3 groups

var citiesColor = ["blue", "orange", "grey", "green", "red"]; // Color of 5 cities

var svgMonth = d3.select("#compareMonths").append("svg").attr("height", height3).attr("width", width3);

d3.csv("data/MonthlyDataWithBands.csv", function (error, data) {
	compareMonthsInfo = data;
	compareMonths = compareMonthsInfo.map(function (info) {
		return {
			site: info["City"],
			month: Number(info["Month"]),
			AQI: Number(info["AQI"]),
			group: info["Group"],
			count: Number(info["Index"])
		};
	})

	d3.select(check).selectAll("input").property("checked", true);

	checkedGroups = compareMonths;

	for (var i = 0; i < 5; i++) {
		low[i] = compareMonths.filter(function (d) {
			return d.group == "Low" && d.count == i+1;
		});

		middle[i] = compareMonths.filter(function (d) {
			return d.group == "Middle" && d.count == i+1;
		});

		high[i] = compareMonths.filter(function (d) {
			return d.group == "High" && d.count == i+1;
		});
	}

	xScale = d3.scale.linear().domain([1, 12]).range([padding3, width3 - padding3]);
	yScale = d3.scale.linear().domain([0, d3.max(checkedGroups, function (d) { return d.AQI; })]).range([height3 - padding3, padding3]);

	var xAxis = d3.svg.axis().scale(xScale).ticks(12);
	svgMonth.append("g").attr("class", "axis").attr("transform", "translate(0, " + (height3 - padding3) + ")").call(xAxis);

	var yAxis = d3.svg.axis().scale(yScale).orient("left");
	svgMonth.append("g").attr("class", "axis").attr("transform", "translate(" + padding3	 + ", 0)").call(yAxis);

	svgMonth.append("text")
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + (width3 / 2) + ", " + (height3 - (padding3 / 4)) + ")")
    .text("Month");

    svgMonth.append("text")
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + (padding3 / 4) + ", " + (height3 / 2) + ") rotate(-90)")
    .text("AQI");

    for (var i = 0; i < 5; i++) {
    	drawLine1(low[i], 0, groupColor);
    	drawLine1(middle[i], 1, groupColor);
    	drawLine1(high[i], 2, groupColor);
    }
});

var svgDays = d3.select("#compareDays").append("svg").attr("height", height3).attr("width", width3);

d3.csv("data/SegmentedByDaysPollution.csv", function (error, data) {
	compareDaysInfo = data;
	compareDays = compareDaysInfo.map(function (info) {
		return {
			site: info["City"],
			day: Number(info["Day Number"]),
			AQI: Number(info["AQI"]),
			group: info["Group"],
			count: Number(info["Index"])
		};
	})
	checkedGroups2 = compareDays;
	d3.select(check2).selectAll("input").property("checked", true);

	xScale2 = d3.scale.linear().domain([1, 7]).range([padding3, width3 - padding3]);
	yScale2 = d3.scale.linear().domain([d3.min(checkedGroups2, function (d) { return d.AQI; }), d3.max(checkedGroups2, function (d) { return d.AQI; })]).range([height3 - padding3, padding3]);

	var xAxis2 = d3.svg.axis().scale(xScale2).ticks(7);
	svgDays.append("g").attr("class", "axis").attr("transform", "translate(0, " + (height3 - padding3) + ")").call(xAxis2);

	var yAxis2 = d3.svg.axis().scale(yScale2).orient("left");
	svgDays.append("g").attr("class", "axis").attr("transform", "translate(" + padding3 + ", 0)").call(yAxis2);

	svgDays.append("text")
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + (width3 / 2) + ", " + (height3 - (padding3 / 4)) + ")")
    .text("Days of a Week");

    svgDays.append("text")
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + (padding3 / 4) + ", " + (height3 / 2) + ") rotate(-90)")
    .text("AQI");

    for (var i = 0; i < 5; i++) {
		low2[i] = compareDays.filter(function (d) {
			return d.group == "Low" && d.count == i;
		});

		middle2[i] = compareDays.filter(function (d) {
			return d.group == "Middle" && d.count == i;
		});

		high2[i] = compareDays.filter(function (d) {
			return d.group == "High" && d.count == i;
		});
	}

	for (var i = 0; i < 5; i++) {
    	drawLine2(low2[i], 0, groupColor);
    	drawLine2(middle2[i], 1, groupColor);
    	drawLine2(high2[i], 2, groupColor);
    }
});

var svgTimes = d3.select("#compareTimes").append("svg").attr("height", height3).attr("width", width3);

d3.csv("data/timeComparison.csv", function (error, data) {
	compareTimesInfo = data;
	compareTimes = compareTimesInfo.map(function (info) {
		return {
			site: info["City"],
			time: Number(info["Time Number"]),
			quality: Number(info["PM2.5"])
		};
	})
	d3.select(check3).selectAll("input").property("checked", true);

	xScale3 = d3.scale.linear().domain([0, 23]).range([padding3, width3 - padding3]);
	yScale3 = d3.scale.linear().domain([0, d3.max(compareTimes, function (d) { return d.quality; })]).range([height3 - padding3, padding3]);

	var xAxis3 = d3.svg.axis().scale(xScale3).ticks(24);
	svgTimes.append("g").attr("class", "axis").attr("transform", "translate(0, " + (height3 - padding3) + ")").call(xAxis3);

	var yAxis3 = d3.svg.axis().scale(yScale3).orient("left");
	svgTimes.append("g").attr("class", "axis").attr("transform", "translate(" + padding3 + ", 0)").call(yAxis3);

	svgTimes.append("text")
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + (width3 / 2) + ", " + (height3 - (padding3 / 4)) + ")")
    .text("Times of a Day");

    svgTimes.append("text")
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + (padding3 / 4) + ", " + (height3 / 2) + ") rotate(-90)")
    .text("PM2.5");

	for (var i = 0; i < 5; i++) {
		cities[i] = compareTimes.filter(function (d) {
			return d.site == citiesNames[i];
		})
	}

	for (var i = 0; i < 5; i++) {
    	drawLine3(cities[i], i, citiesColor);
    }
});

d3.select(check).selectAll("input").on("change", function () {
	updateChecked(this.id, this.checked);
	d3.select("#compareMonths").selectAll("path").remove();
	d3.select("#compareMonths").selectAll("line").remove();
	d3.select("#compareMonths").selectAll("text").remove();

	updateScale();

	var xAxis = d3.svg.axis().scale(xScale).ticks(12);
	svg.append("g").attr("class", "axis").attr("transform", "translate(0, " + (height3 - padding3) + ")").call(xAxis);

	var yAxis = d3.svg.axis().scale(yScale).orient("left");
	svg.append("g").attr("class", "axis").attr("transform", "translate(" + padding3 + ", 0)").call(yAxis);

	svg.append("text")
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + (width3 / 2) + ", " + (height3 - (padding3 / 4)) + ")")
    .text("Month");

    svg.append("text")
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + (padding3 / 4) + ", " + (height3 / 2) + ") rotate(-90)")
    .text("AQI");

	for (var i = 0; i < 3; i++) {
		if (checked[i] == 1) {
			if (i == 0) {
				for (var j = 0; j < 5; j++) {
					drawLine1(low[j], 0, groupColor);
				}
			}
			else if (i == 1) {
				for (var j = 0; j < 5; j++) {
					drawLine1(middle[j], 1, groupColor);
				}
			}
			else {
				for (var j = 0; j < 5; j++) {
					drawLine1(high[j], 2, groupColor);
				}
			}
		}
	}
});

d3.select(check2).selectAll("input").on("change", function () {
	updateChecked2(this.id, this.checked);
	d3.select("#compareDays").selectAll("path").remove();
	d3.select("#compareDays").selectAll("line").remove();
	d3.select("#compareDays").selectAll("text").remove();

	updateScale2();

	var xAxis2 = d3.svg.axis().scale(xScale2).ticks(7);
	svgDays.append("g").attr("class", "axis").attr("transform", "translate(0, " + (height3 - padding3) + ")").call(xAxis2);

	var yAxis2 = d3.svg.axis().scale(yScale2).orient("left");
	svgDays.append("g").attr("class", "axis").attr("transform", "translate(" + padding3 + ", 0)").call(yAxis2);

	svgDays.append("text")
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + (width3 / 2) + ", " + (height3 - (padding3 / 4)) + ")")
    .text("Days of a Week");

    svgDays.append("text")
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + (padding3 / 4) + ", " + (height3 / 2) + ") rotate(-90)")
    .text("AQI");

	for (var i = 0; i < 3; i++) {
		if (checked2[i] == 1) {
			if (i == 0) {
				for (var j = 0; j < 5; j++) {
					drawLine2(low2[j], 0, groupColor);
				}
			}
			else if (i == 1) {
				for (var j = 0; j < 5; j++) {
					drawLine2(middle2[j], 1, groupColor);
				}
			}
			else {
				for (var j = 0; j < 5; j++) {
					drawLine2(high2[j], 2, groupColor);
				}
			}
		}
	}
});

d3.select(check3).selectAll("input").on("change", function () {
	updateChecked3(this.id, this.checked);
	d3.select("#compareTimes").selectAll("path").remove();
	d3.select("#compareTimes").selectAll("line").remove();
	d3.select("#compareTimes").selectAll("text").remove();

	svgTimes.append("text")
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + (width3 / 2) + ", " + (height3 - (padding3 / 4)) + ")")
    .text("Times of a Day");

    svgTimes.append("text")
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + (padding3 / 4) + ", " + (height3 / 2) + ") rotate(-90)")
    .text("PM2.5");

    var xAxis3 = d3.svg.axis().scale(xScale3).ticks(24);
	svgTimes.append("g").attr("class", "axis").attr("transform", "translate(0, " + (height3 - padding3) + ")").call(xAxis3);

	var yAxis3 = d3.svg.axis().scale(yScale3).orient("left");
	svgTimes.append("g").attr("class", "axis").attr("transform", "translate(" + padding3 + ", 0)").call(yAxis3);

	for (var i = 0; i < 5; i++) {
		if (checked3[i] == 1) {
			drawLine3(cities[i], i, citiesColor);
		}
	}
});

var updateChecked = function (name, check) {
	if (name == "low") {
		checked[0] = check == true ? 1 : 0;
	}
	else if (name == "middle") {
		checked[1] = check == true ? 1 : 0;
	}
	else checked[2] = check == true ? 1 : 0;
}

var updateChecked2 = function (name, check) {
	if (name == "low2") {
		checked2[0] = check == true ? 1 : 0;
	}
	else if (name == "middle2") {
		checked2[1] = check == true ? 1 : 0;
	}
	else checked2[2] = check == true ? 1 : 0;
}

var updateChecked3 = function (name, check) {
	if (name == "Beijing") {
		checked3[0] = check == true ? 1 : 0;
	}
	else if (name == "Shenyang") {
		checked3[1] = check == true ? 1 : 0;
	}
	else if (name == "Chengdu") {
		checked3[2] = check == true ? 1 : 0;
	}
	else if (name == "Guangzhou") {
		checked3[3] = check == true ? 1 : 0;
	}
	else checked3[4] = check == true ? 1 : 0;
}

var updateScale = function () {
	checkedGroups = compareMonths;
	for (var i = 0; i < checked.length; i++) {
		if (checked[i] == 0) {
			checkedGroups = checkedGroups.filter(function (d) {
				return d.group != group[i];
			});
		}
	}
	if (checkedGroups != null) {
		xScale = d3.scale.linear().domain([1, 12]).range([padding3, width3 - padding3]);
		yScale = d3.scale.linear().domain([0, d3.max(checkedGroups, function (d) { return d.AQI; })]).range([height3 - padding3, padding3]);
	}
}

var updateScale2 = function () {
	checkedGroups2 = compareDays;
	for (var i = 0; i < checked2.length; i++) {
		if (checked2[i] == 0) {
			checkedGroups2 = checkedGroups2.filter(function (d) {
				return d.group != group[i];
			});
		}
	}
	if (checkedGroups2 != null) {
		xScale2 = d3.scale.linear().domain([1, 7]).range([padding3, width3 - padding3]);
		yScale2 = d3.scale.linear().domain([d3.min(checkedGroups2, function (d) { return d.AQI; }), d3.max(checkedGroups2, function (d) { return d.AQI; })]).range([height3 - padding3, padding3]);
	}
}

var drawLine1 = function (data, i, color) {
	console.log("data for drawLine1 is:");
	console.log(data);
	var line = d3.svg.line()
	.x(function (d) { return xScale(d.month); })
	.y(function (d) { return yScale(d.AQI); });
	var path = svgMonth.append("path").attr("class", "line").attr("d", line(data)).style("stroke", color[i]);
	console.log("path is :");
	console.log(path);
	var totalLength = path.node().getTotalLength();

	// Animation
	path
    .attr("stroke-dasharray", totalLength + " " + totalLength)
    .attr("stroke-dashoffset", totalLength)
    .transition()
    .duration(800)
    .ease("linear")
    .attr("stroke-dashoffset", 0);
}

var drawLine2 = function (data, i, color) {
	var line = d3.svg.line()
	.x(function (d) { return xScale2(d.day); })
	.y(function (d) { return yScale2(d.AQI); });
	var path = svgDays.append("path").attr("class", "line").attr("d", line(data)).style("stroke", color[i]);
	var totalLength = path.node().getTotalLength();
	// Animation
	path
    .attr("stroke-dasharray", totalLength + " " + totalLength)
    .attr("stroke-dashoffset", totalLength)
    .transition()
    .duration(800)
    .ease("linear")
    .attr("stroke-dashoffset", 0);
}

var drawLine3 = function (data, i, color) {
	var line = d3.svg.line()
	.x(function (d) { return xScale3(d.time); })
	.y(function (d) { return yScale3(d.quality); });
	var path = svgTimes.append("path").attr("class", "line").attr("d", line(data)).style("stroke", color[i]);
	var totalLength = path.node().getTotalLength();
	// Animation
	path
    .attr("stroke-dasharray", totalLength + " " + totalLength)
    .attr("stroke-dashoffset", totalLength)
    .transition()
    .duration(800)
    .ease("linear")
    .attr("stroke-dashoffset", 0);
}