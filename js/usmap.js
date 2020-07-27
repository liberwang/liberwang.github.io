var dates = [];

var width = 1000;
var height = 500;
var graph_width = 300;
var graph_height = 300;
var mchart_width = 400;
var mchart_height = 350;
var top_width = 300;
var top_height = 250;
var state_width = 100;
var state_height = 70;
var state_date_before = 90;
var maxCases = 0;
var minCases = 0;
var maxDeaths = 0;
var minDeaths = 0;
var startDateIndex = 0;
var startDate;

var svgMap = d3.select("#map")
    .attr("width", width)
    .attr("height", height)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

var g = svgMap.append("g");

var infobarMap = d3.select("body")
    .append("div")
    .attr("class","tooltipMap")
    .style("opacity", 0)
    .style("width", 480);

var tooltipMain = d3.select("body")
    .append("div")
    .attr("class", "tooltipMain")
    .style("opacity", 0);

var tooltipTop = d3.select("body")
    .append("div")
    .attr("class", "tooltipMain")
    .style("opacity", 0);

var tooltipState = d3.select("body")
    .append("div")
    .attr("class", "tooltipMain")
    .style("opacity", 0);

var projection = d3.geoAlbersUsa();
var path = d3.geoPath()
    .projection(projection);
    
d3.selectAll("#radConfirmedMap").attr("checked", true);

var checkConfirmedMap = true;

this.setMapTitle();

var confirmColorRange = d3.scaleLog([1, 1000, 1000000], ["yellow", "red", "darkred"]);
var deathColorRange = d3.scaleLog([1,1000,1000000], ["lightskyblue", "Blue", "DarkBlue"]);

function color(num) {
    if (num == 0 || num == null) 
        return "white";
    else {
        if ( checkConfirmedMap ) 
            return confirmColorRange(num); 
        else 
            return deathColorRange(num);
    }
}

// Legend
var legend = d3.select("#legend")
    .attr("width", "1000")
    .attr("height", "100")
    .selectAll("g.legend")
    .data([0, 1, 10, 100, 1000, 10000, 100000, 1000000])
    .enter()
    .append("g")
    .attr("class", "legend");

var ls_w = 73, ls_h = 20

function linepos(x) {
    if (x == 0) 
        return 927;
    x = Math.log10(x);
    return 854 - x * ls_w;
}

legend.append("text")
    .attr("x", 417)
    .attr("y", 20)
    .text(function(){return "Number of Cases";});

legend.append("rect")
    .attr("x", function(d, i){ return 1000 - (i*ls_w) - ls_w})
    .attr("y", 30)
    .attr("width", ls_w)
    .attr("height", ls_h)
    .style("fill", function(d, i) { return color(d) });

labels = ["0", "1", "10", "100", "1,000", "10,000", "100,000", "1,000,000"];

legend.append("text")
    .attr("x", function(d, i){ return 1000 - (i*ls_w) - ls_w})
    .attr("y", 70)
    .text(function(d, i){ return labels[i] });

var zoom = d3.zoom()
    .extent([[0, 0], [width, height]])
    .scaleExtent([1, 10])
    .on("zoom", zoomed);

svgMap.call(zoom);

function zoomed() {
    g.attr("transform", d3.event.transform);
}

function unzoomed() {
    svgMap.transition().duration(1000).call(
        zoom.transform,
        d3.zoomIdentity,
        d3.zoomTransform(svgMap.node()).invert([width / 2, height / 2])
    )
}

var topo = null;
var todayDate= null;
var slider = null;

function load(us) {
    todayDate = dates[dates.length-1];

    topo = topojson.feature(us, us.objects.counties).features;

    // counties and states drawn on svg
    counties = g.selectAll("path")
        .data(topo)
        .enter()
        .append("path")
            .attr("d", path)
            .attr("class", "county")
            .attr("id", function (d) {
                dates.forEach(function (date) {
                    if (!data.get(+d.id)) return;
                    if (!(date in data.get(+d.id))) {
                        x = data.get(+d.id)
                        x[date] = {"cases": 0, "deaths": 0}
                        data.set(+d.id, x)
                    }
                })
                return "id-" + +d.id; 
            })

    states = g.append("path")
        .datum(topojson.feature(us, us.objects.states, function(a, b) { return a !== b }))
            .attr("class", "states")
            .attr("d", path);
    
    slider = d3.select("#slider")
        .append("input")
        .attr("class", "custom-range")
        .attr("type", "range")
        .attr("min", 0)
        .attr("max", dates.length - 1)
        .attr("step", 1)
        .on("input", function() {
            var date = this.value
            update(date)
        });

    setMapTitle();

    update(dates.length - 1);

    generateMainPage();

    // main page for show today statistics 
    function generateMainPage() {
        confirmData = [];
        deathData = [];
        for (var i = 0; i < dates.length; i++) {
            confirmData.push( { "x": i, "y" : +dateData.get(dates[i]).cases});
            deathData.push( { "x": i, "y": +dateData.get( dates[i]).deaths});
        }

        d3.selectAll("#todaydate").text( "Data as of " + todayDate + "-2020");
        
        d3.selectAll("#totalconfirmed").text( dateData.get(todayDate).cases.toLocaleString() );
        d3.selectAll("#totaldeath").text( dateData.get(todayDate).deaths.toLocaleString() );

        var addConfirmed = dateData.get(todayDate).cases - dateData.get(dates[dates.length-2]).cases;
        var addDeaths = dateData.get(todayDate).deaths - dateData.get(dates[dates.length-2]).deaths;

        d3.select("#addconfirmed").text( "+" + addConfirmed.toLocaleString());
        d3.select("#adddeath").text( "+" + addDeaths.toLocaleString() );

        var confirmChart = d3.select("#confirmedCaseChart") 
            .append("svg")
            .attr("height", mchart_height + 50)
            .attr("width", mchart_width + 50)
            .append("g")
            .attr("transform", "translate(60, 10)");

        var deathChart = d3.select( "#deathCaseChart")
            .append("svg")
            .attr("height", mchart_height + 50)
            .attr("width", mchart_width + 50)
            .append("g")
            .attr("transform", "translate(60, 10)");

        dat = [];
        dat_deaths = [];
        for (var id = 0; id < dates.length; id++) {
            dat.push({ "x": id, "y" : +dateData.get(dates[id]).cases});
            dat_deaths.push({ "x": id, "y": +dateData.get( dates[id]).deaths});
        }

        var xaxisc = d3.scaleLinear()
            .domain([0, dates.length - 1])
            .range([0, mchart_width]);

        confirmChart.append("g")
            .attr("transform", "translate(0, " + mchart_height + ")")
            .call(d3.axisBottom(xaxisc).tickFormat((d, i) => dates[d]))
            .selectAll(".tick text")
            .style("text-anchor", "end")
            .attr("transform", "rotate(-45) translate(-3, 0)");
        
        deathChart.append("g")
            .attr("transform", "translate(0, " + mchart_height + ")")
            .call(d3.axisBottom(xaxisc).tickFormat((d, i) => dates[d]))
            .selectAll(".tick text")
            .style("text-anchor", "end")
            .attr("transform", "rotate(-45) translate(-3, 0)");

        var yaxisc = d3.scaleLinear()
            .domain([0, d3.max(dat, function(d) {
                return parseInt(d.y)
            })])
            .range([mchart_height, 0]);

        var yaxisd = d3.scaleLinear()
            .domain([0, d3.max(dat_deaths, function(d) {
                return parseInt(d.y)
            })])
            .range([mchart_height, 0]);

        confirmChart.append("g")
            .call(d3.axisLeft(yaxisc))
            .attr("transform", "translate(0, 0)");

        deathChart.append("g")
            .call(d3.axisLeft(yaxisd))
            .attr("transform", "translate(0, 0)");

        confirmChart.selectAll("rect")
            .data( dat )
            .enter()
            .append("rect")
            .attr("fill", "red")
            .attr("x", function(d) { return xaxisc(d.x); })
            .attr("y", function(d) {return yaxisc(d.y);})
            .attr("width", mchart_width / dat.length)
            .attr("height", function(d) { return mchart_height - yaxisc(d.y);})
            .on("mouseover", function(d) {
                tooltipMain.transition()
                        .duration(250)
                        .style("opacity", 1)
                    tooltipMain.html(
                        "<p><strong>" + dates[d.x] + "-2020" + "</strong></p><br />" +
                            "<p style='color: red'>" +d.y.toLocaleString() + " confirmed case" +
                            (d.y <= 1 ? "" : "s") + "</p>")
                        .style("left", (d3.event.pageX + 15) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function(d){
                tooltipMain.transition()
                .duration(250)
                .style("opacity", 0);
            });

        deathChart.selectAll("rect")
            .data( dat_deaths )
            .enter()
            .append("rect")
            .attr("fill", "blue")
            .attr("x", function(d) { return xaxisc(d.x); })
            .attr("y", function(d) {return yaxisd(d.y);})
            .attr("width", mchart_width / dat_deaths.length)
            .attr("height", function(d) { return mchart_height - yaxisd(d.y);})
            .on("mouseover", function(d) {
                tooltipMain.transition()
                    .duration(250)
                    .style("opacity", 1)
                tooltipMain.html(
                    "<p><strong>" + dates[d.x] + "-2020" + "</strong></p><br />" +
                        "<p style='color: blue'>" +d.y.toLocaleString() + " deaths case" +
                        (d.y <= 1 ? "" : "s") + "</p>")
                    .style("left", (d3.event.pageX + 15) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function(d){
                tooltipMain.transition()
                .duration(250)
                .style("opacity", 0);
            }); 
    }

    // top 10 statistics
    topStateConfirm = [];
    topStateDeath = [];
    topCountyConfirm = [];
    topCountyDeath = [];
    mapStateConfirm = new Map();
    mapStateDeath = new Map();

    
    data.forEach( ( key,value ) => {
        if ( key[todayDate]) {
            var vConfirm = +key[todayDate].cases;
            var vDeath = +key[todayDate].deaths;

            topCountyConfirm.push( {"name" : key.county, "cases": vConfirm } );

            topCountyDeath.push( {"name" : key.county, "cases": vDeath } );

            if ( mapStateConfirm.get( key.state )) {
                mapStateConfirm.set( key.state, +mapStateConfirm.get( key.state ) + vConfirm);
                mapStateDeath.set( key.state, +mapStateDeath.get( key.state ) + vDeath);
            } else {
                mapStateConfirm.set( key.state, vConfirm);
                mapStateDeath.set( key.state, vDeath);
            }
        }
    });

    mapStateConfirm.forEach( (v, k) => {
        topStateConfirm.push( {"name" : k, "cases" : +v} );
    } );

    mapStateDeath.forEach( (v, k) => {
        topStateDeath.push( {"name" : k, "cases" : +v} );
    } );

    var topDataSC = topStateConfirm.sort( function ( a, b ) {
        return d3.descending( +a.cases, +b.cases )
    }).slice( 0, 10 );

    var topDataSD = topStateDeath.sort( function ( a, b ) {
        return d3.descending( +a.cases, +b.cases )
    }).slice( 0, 10 );

    var topDataCC = topCountyConfirm.sort( function( a, b ) {
        return d3.descending( +a.cases, +b.cases );
    }).slice( 0, 10 ); 

    var topDataCD = topCountyDeath.sort( function( a, b ) {
        return d3.descending( +a.cases, +b.cases );
    }).slice( 0, 10 ); 

    generateTop10Chart( topDataSD, "#topStateConfirm", "confirmed cases", "red" );
    generateTop10Chart( topDataSC, "#topStateDeath", "deaths cases", "blue" );
    generateTop10Chart( topDataCC, "#topCountyConfirm", "confirmed cases", "red" );
    generateTop10Chart( topDataCD, "#topCountyDeath", "deaths cases", "blue" );

    function generateTop10Chart(datac, divObject, hintstring, colorC) {
        var countyConfirmChart = d3.select(divObject)
            .append("svg")
            .attr("height", top_height + 20)
            .attr("width", top_width + 100)
            .append("g")
            .attr("transform", "translate(80, 10)");

        var xaxis = d3.scaleLinear()
            .domain([0, d3.max(datac, function(d) {
                return +d.cases;
            })])
            .range([0, top_width]);
    

        var yaxis = d3.scaleBand()
            .domain(datac.map( (s) => s.name ))
            .range([0, top_height]);

        countyConfirmChart.append("g")
            .call(d3.axisLeft(yaxis).tickSize(0).tickSizeInner(0).tickSizeOuter(0))
            .attr("transform", "translate(0, 0)")
            .style("font-weight","bold");

        countyConfirmChart.selectAll("rect")
            .data( datac )
            .enter()
            .append("rect")
            .attr("fill", colorC)
            .attr("x", 0 )
            .attr("y", function(d) {return yaxis(d.name);})
            .attr("height", yaxis.bandwidth() - 2 )
            .attr("width", function(d) { return xaxis(d.cases);})
            .on("mouseover", function(d) {
                tooltipTop.transition()
                        .duration(250)
                        .style("opacity", 1);

                    tooltipTop.html(
                        "<p><strong>" + d.name + "</strong></p><br />" +
                            "<p style='color: " + colorC + "'>" +d.cases.toLocaleString() + " " + hintstring + "</p>" )
                        .style("left", (d3.event.pageX + 15) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function(d){
                tooltipTop.transition()
                .duration(250)
                .style("opacity", 0);
            });
    }
}

var data = new Map()
var dateData = new Map();
var stateData = new Map();

d3.json("data/counties-10m.json").then(function(us) {
        d3.csv("data/us-counties.csv", function(d) {
            d.date = d.date.slice(5);
            if (d.county === "New York City") d.fips = 36061;
            if (!dates.includes(d.date)) {
                dates.push(d.date);
            }
            
            // get date data
            // structure: "07-13", { cases: 12, deaths: 1 }
            if( dateData.get( d.date )) {
                x = dateData.get( d.date );
                x.cases += +d.cases;
                x.deaths += +d.deaths;
                dateData.set( d.date, x );
            } else {
                x = {"cases": +d.cases,"deaths": +d.deaths };
                dateData.set( d.date, x);
            }

            //get map data 
            // structure: "07123", { "07-13", "orange county", "california", { cases: 12, deaths: 1 }}
            if (data.get(+d.fips)) {
                x = data.get(+d.fips)
                x[d.date] = {"cases": +d.cases, "deaths": +d.deaths}
                data.set(+d.fips, x)
            } else {
                x = {}
                x[d.date] = {"cases": +d.cases, "deaths": +d.deaths}
                x["county"] = d.county; 
                x["state"] = d.state;
                x["id"] = +d.fips
                data.set(+d.fips, x)
            }
        }).then(function (d) {
            load(us);

            startDateIndex = dates.length - state_date_before;
            startDate = dates[startDateIndex];

            d3.csv("data/us-states.csv", function(d) {
                var date = d.date.slice(5);
                var cases = {"cases": +d.cases, "deaths": +d.deaths};
            
                if ( +date.slice(0,2) > +startDate.slice(0,2) ||
                    ( +date.slice(0,2) == +startDate.slice(0,2) && +date.slice(3) >= +startDate.slice(3) ) ) {
                        if ( maxCases < +d.cases ) 
                            maxCases = +d.cases;
                        if ( minCases > +d.cases ) 
                            minCases = +d.cases;

                        if ( maxDeaths < +d.deaths ) 
                            maxDeaths = +d.deaths;
                        if ( minDeaths > +d.deaths )
                            minDeaths = +d.deaths;
                    }

                if ( stateData.get( d.state )) {
                    x = stateData.get( d.state );
                    x.set( date, cases );
                    stateData.set( d.state, x);        
                } else {
                    x = new Map();
                    x.set( date, cases );
                    stateData.set( d.state, x );
                }
                if (!dates.includes(date)) {
                    dates.push(date);
                }
            } ).then( function( d) {
                    generateStateMaps(d);
            } );
        })

}) 

function generateStateMaps(d) {
    stateData.forEach( ( v, k ) =>{
        statesConfirm = [];
        statesDeath = [];

        for( var i = startDateIndex; i < dates.length; ++i ) {
            var date = dates[i];
            statesConfirm.push( { "date" : +i, "cases": +v.get( date).cases });
            statesDeath.push( {"date": +i, "cases": +v.get(date).deaths });
        }

        d3.select("#div" + k.replace( ' ', '') ).select("svg").remove();

        var stateBar = d3.select("#div" + k.replace( ' ', '') )
            .append("svg")
            .attr("height", state_height)
            .attr("width", state_width)
            .append("g")
            .attr("transform", "translate(0, 0)");

        var x = d3.scaleLinear()
            .domain([startDateIndex, dates.length - 1])
            .range([0, state_width]);

        
        var y = d3.scaleLinear()
            .domain(checkConfirmedMap ? [minCases, maxCases] : [minDeaths, maxDeaths])
            .range([state_height, 0]);
       
        stateBar.selectAll("rect")
            .data( checkConfirmedMap ? statesConfirm : statesDeath )
            .enter()
            .append("rect")
            .attr("fill", checkConfirmedMap ? "red" : "blue")
            .attr("x", function(d) { return x(d.date); })
            .attr("y", function(d) {return y(d.cases);})
            .attr("width", state_width / statesConfirm.length )
            .attr("height", function(d) { return state_height - y(d.cases);})
            .on("mouseover", function(d) {
                tooltipState.transition()
                        .duration(250)
                        .style("opacity", 1);

                    tooltipState.html(
                        "<p><strong>" + dates[d.date] + "-2020" + "</strong></p><br />" +
                            "<p style='color: " + ( checkConfirmedMap ? "red" : "blue") + "'>" +d.cases.toLocaleString() + " " + (checkConfirmedMap ? "Confirmed cases" : "deaths cases") + "</p>" )
                        .style("left", (d3.event.pageX + 15) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function(d){
                tooltipState.transition()
                .duration(250)
                .style("opacity", 0);
            });
    })
}

function update(key){
    infobarMap.selectAll("*").remove();
    slider.property("value", key);
    d3.select("#dateslider")
        .text(dates[key] + "-2020");
    counties.style("fill", function(d) {
            if (data.get(+d.id) && dates[key] in data.get(+d.id)) {
                if ( checkConfirmedMap )
                    return color(data.get(+d.id)[dates[key]].cases);
                else 
                    return color(data.get(+d.id)[dates[key]].deaths);
            }
            return color(0);
        })
        .on("mouseover", function(d) {
            infobarMap.selectAll("*").remove();
            infobarMap.transition()
            .duration(250)
            .style("opacity", 1);

            if ( data.get(+d.id) == null )
                return;

            var cases = data.get(+d.id)[dates[key]].cases;
            var deaths = data.get(+d.id)[dates[key]].deaths;
    
            infobarMap.append("h3").text(data.get(+d.id).county + " - " + data.get(+d.id).state );
            infobarMap.append("p").text(cases.toLocaleString() + " confirmed case" + (cases == 1 ? "" : "s")).style("color","red");
            infobarMap.append("p").text(deaths.toLocaleString() + " deaths case" + (deaths == 1 ? "" : "s")).style("color","blue");
    
            var line = infobarMap.append("svg")
                .attr("height", graph_height + 50)
                .attr("width", graph_width + 50)
                .append("g")
                .attr("transform", "translate(40, 10)")
    
            dat = [];
            dat_deaths = [];
            start = dates.length;
            for (var id = 0; id < dates.length; id++) {
                if (data.get(+d.id)[dates[id]].cases > 0) {
                    if (start == dates.length) {
                        dat.push({"x": id - 1, "y": 0})
                        dat_deaths.push({"x": id - 1, "y": 0})
                        start = id
                    }
                }
                if (start != dates.length) {
                    dat.push({"x": id, "y": data.get(+d.id)[dates[id]].cases})
                    dat_deaths.push({"x": id, "y": data.get(+d.id)[dates[id]].deaths})
                }
            }
            
            var x = d3.scaleLinear()
                .domain([start - 1, dates.length - 1])
                .range([0, graph_width])
    
            line.append("g")
                .attr("transform", "translate(0, " + graph_height + ")")
                .call(d3.axisBottom(x).tickFormat((d, i) => dates[d]))
                .selectAll(".tick text")
                .style("text-anchor", "end")
                .attr("transform", "rotate(-45) translate(-3, 0)");
                
            var y = d3.scaleLinear()
                .domain([0, d3.max(dat, function(d) {
                    return parseInt(d.y)
                })])
                .range([graph_height, 0]);
    
            line.append("g")
                .call(d3.axisLeft(y))
                .attr("transform", "translate(0, 0)");
    
            line.append("path")
                .datum(dat)
                .attr("fill", "none")
                .attr("stroke", "red")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(function(a) { return x(a.x) })
                    .y(function(a) { return y(a.y) })
                );
    
            line.append("path")
                .datum(dat_deaths)
                .attr("fill", "none")
                .attr("stroke", "blue")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(function(a) { return x(a.x) })
                    .y(function(a) { return y(a.y) })
                );
        })
        .on("mousemove", function (d) {
            if ( data.get(+d.id) == null ) {
                infobarMap.transition()
                .duration(250)
                .style("opacity", 0);
                return;
            }

            var high = Math.max( d3.event.pageY -300, 0 );
            infobarMap.style("left", (d3.event.pageX + 15) + "px")
                .style("top", high + "px");
        })
        .on("mouseout", function (d) {
            infobarMap.transition()
            .duration(250)
            .style("opacity", 0);

       })
}

function casetypechoose( type ) {
     if (type == 'confirmed') {
        d3.selectAll("#radConfirmedMap").property("checked", true);
        checkConfirmedMap = true;
    } else {
        d3.selectAll("#radDeathMap").property("checked", true);
        checkConfirmedMap = false;
    }

    update(slider.property("value"));
    generateStateMaps();

    legend.selectAll("rect")
        .style("fill", function(d, i) { return color(d) });
    setMapTitle();
}

function setMapTitle() {
    d3.selectAll("#titleMap").text(checkConfirmedMap ? "Confirmed" : "Deaths");
}
