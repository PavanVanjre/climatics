let mainData = null;

let currentFilters = {
  "Select Category": "Average Dec/Jan/Feb Temps",
  "Emission Rate": "RCP 8.5",
  "Time Period": "Historical 1986-2005",
  temperatureScale: "Celsius",
  Probability: "Median",
  Country: "United States of America",
};

const probabilityMapping = {
  Median: "P50th",
  "1-In-2 Low": "P5th",
  "1-In-20 High": "P95th",
};

document.addEventListener("DOMContentLoaded", function () {
  // Load data files using d3.json
  Promise.all([d3.json("data/custom.geo.json"), d3.json("data/data.json")])
    .then(([geojsonData, data]) => {
      mainData = data;
      setupVisualizations(mainData, geojsonData);
    })
    .catch((error) => console.error("Error loading the data:", error));
});

function setupVisualizations(mainData, geojsonData) {
  const geoMapConfig = {
    parentElement: "#geoMap",
    containerWidth: 1000,
    containerHeight: 700,
    margin: { top: 20, right: 20, bottom: 20, left: 50 },
  };

  const barChartConfig = {
    parentElement: "#barchart-averages",
    containerWidth: 600,
    containerHeight: 400,
    margin: { top: 30, right: 30, bottom: 60, left: 50 },
    selectedFilters: currentFilters,
  };

  const rcpBarChartConfig = {
    parentElement: "#rcp-barchart",
    containerWidth: 500,
    containerHeight: 400,
    margin: { top: 30, right: 30, bottom: 60, left: 50 },
    selectedFilters: currentFilters,
  };
  const geoMap = new GeoMapVisualization(geoMapConfig, mainData, geojsonData);
  const barChart = new AverageTemperatureBarChart(barChartConfig, mainData);
  const rcpBarChart = new RCPBarChart(rcpBarChartConfig, mainData);

  createInteractionPanel(mainData, geoMap, barChart, rcpBarChart);
  setTimeout(function () {
    updateVisualizations(geoMap, barChart, rcpBarChart);
  }, 2000);
}

function createInteractionPanel(data, geoMap, barChart, rcpBarChart) {
  // Creating multiple dropdowns for different types of data filters
  createDropdown(
    "categorySelect",
    "Select Category",
    [...new Set(data.map((item) => item["Select Category"]))],
    geoMap,
    barChart,
    rcpBarChart,
    "Select Category",
    true
  );
  createDropdown(
    "emissionSelect",
    "Emission Rate",
    [...new Set(data.map((item) => item["Emission Rate"]))],
    geoMap,
    barChart,
    rcpBarChart,
    "Emission Rate",
    true
  );
  createDropdown(
    "timePeriodSelect",
    "Time Period",
    [...new Set(data.map((item) => item["Time Period"]))],
    geoMap,
    barChart,
    rcpBarChart,
    "Time Period",
    true
  );
  createDropdown(
    "temperatureScaleSelect",
    "Temperature Scale",
    ["Celsius", "Fahrenheit"],
    geoMap,
    barChart,
    rcpBarChart,
    "temperatureScale",
    true
  );
  createDropdown(
    "probabilitySelect",
    "Probability",
    ["1-In-2 Low", "Median", "1-In-20 High"],
    geoMap,
    barChart,
    rcpBarChart,
    "probability",
    true
  );

  createDropdown(
    "CountrySelect",
    "Select Country",
    [...new Set(data.map((item) => item["Country"]))],
    geoMap,
    barChart,
    rcpBarChart,
    "Country",
    false
  );
}

function createDropdown(
  id,
  labelText,
  options,
  geoMap,
  barChart,
  rcpBarChart,
  filterType,
  insertAtBeginning
) {
  const controlsDiv = d3
    .select(".interact-card")
    .insert("div", insertAtBeginning ? ":first-child" : null)
    .attr("class", "dropdown mb-3");

  controlsDiv
    .append("label")
    .attr("for", id)
    .attr("class", "form-label")
    .text(labelText);

  const select = controlsDiv
    .append("select")
    .attr("id", id)
    .attr("class", "form-select")
    .on("change", function () {
      const selectedOption = d3.select(this).property("value");
      currentFilters[filterType] = selectedOption;
      updateVisualizations(geoMap, barChart, rcpBarChart);
    });

  select
    .selectAll("option")
    .data(options)
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .text((d) => d)
    .property("selected", (d) => d === currentFilters[filterType]); // Reflect the current filter state
}

function updateVisualizations(geoMap, barChart, rcpBarChart) {
  // Start with the full dataset
  let filteredData = mainData;

  // Apply Category filter first
  if (currentFilters["Select Category"]) {
    filteredData = filteredData.filter(
      (item) => item["Select Category"] === currentFilters["Select Category"]
    );
  }

  // Then apply Emission Rate filter on the result of the Category filter
  if (currentFilters["Emission Rate"]) {
    filteredData = filteredData.filter(
      (item) => item["Emission Rate"] === currentFilters["Emission Rate"]
    );
  }

  // Apply Time Period filter next
  if (currentFilters["Time Period"]) {
    filteredData = filteredData.filter(
      (item) => item["Time Period"] === currentFilters["Time Period"]
    );
  }

  // Update the visualizations with the fully filtered dataset
  geoMap.update(filteredData, currentFilters);
  barChart.update(currentFilters);

  rcpBarChart.update(currentFilters);
}

// Assuming d3 has already been included in your environment
function drawColorScale() {
  const svgWidth = 200,
    svgHeight = 50;
  const margin = { top: 10, right: 10, bottom: 10, left: 10 };
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;

  // Create SVG container
  const svg = d3
    .select("#colorScale")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Define the color scale
  const colorScale = d3
    .scaleLinear()
    .range(["#4daf4a", "#ffff33", "#e41a1c"]) // green to yellow to red
    .domain([4.16, 45.33, 86.5]); // Example domain

  // Define the gradient
  const gradient = svg
    .append("defs")
    .append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "0%");

  gradient
    .selectAll("stop")
    .data(
      colorScale.range().map(function (color, i, array) {
        const position = i / (array.length - 1);
        return {
          offset: position * 100 + "%",
          color: color,
        };
      })
    )
    .enter()
    .append("stop")
    .attr("offset", function (d) {
      return d.offset;
    })
    .attr("stop-color", function (d) {
      return d.color;
    });

  // Draw the color rectangle
  svg
    .append("rect")
    .attr("width", width)
    .attr("height", height - 20)
    .style("fill", "url(#gradient)");

  // Add min and max labels
  svg
    .append("text")
    .attr("x", 0)
    .attr("y", height + 5)
    .style("text-anchor", "start")
    .text("4.16°C");

  svg
    .append("text")
    .attr("x", width)
    .attr("y", height + 5)
    .style("text-anchor", "end")
    .text("86.50°C");
}
