const _load = async () => {
  const margin = { top: 40, right: 20, bottom: 50, left: 100 };
  const graphWidth = 560 - margin.left - margin.right;
  const graphHeight = 400 - margin.top - margin.bottom;

  const generateChart = (parentElementSelector) => {
    document.querySelector(parentElementSelector).innerHTML = "";

    const svg = d3
      .select(parentElementSelector)
      .append("svg")
      .attr("width", graphWidth + margin.left + margin.right)
      .attr("height", graphHeight + margin.top + margin.bottom)
      .attr(
        "viewBox",
        `0 0 ${graphWidth + margin.left + margin.right} ${
          graphHeight + margin.top + margin.bottom
        }`
      )
      .attr("preserveAspectRatio", "xMidYMin meet");

    const graph = svg
      .append("g")
      .attr("width", graphWidth)
      .attr("height", graphHeight)
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xAxisGroup = graph
      .append("g")
      .attr("class", "xAxis")
      .attr("transform", `translate(0, ${graphHeight})`);

    const yAxisGroup = graph.append("g").attr("class", "yAxis");

    return [svg, graph, xAxisGroup, yAxisGroup];
  };

  [svg, graph, xAxisGroup, yAxisGroup] = generateChart(".canvas");

  const xScale = d3.scaleTime().range([0, graphWidth]);
  const yScale = d3.scaleLinear().range([graphHeight, 0]);

  const lineGenerator = d3
    .line()
    .x(function (d) {
      return xScale(new Date(d.date));
    })
    .y(function (d) {
      return yScale(Number(d.close));
    });

  //fake line generator for the first call
  const fakeLineGenerator = d3
    .line()
    .x(function (d) {
      return xScale(new Date(d.date));
    })
    .y(function (d) {
      return graphHeight;
    });

  const path = graph.append("path");

  // previous values for path.d and circles cx cy
  let d = "";
  let cy = [];
  let cx = [];

  const tip = d3
    .tip()
    .attr("class", "tip")
    .html(
      (d) => `<p class="value">${d.close} $</p>
                    <p class="date">${new Date(d.date)
                      .toISOString()
                      .slice(0, 10)}</p>`
    );

  graph.call(tip);

  [barchartSvg, barchartGraph, xAxisGroupForBarchart, yAxisGroupForBarchart] =
    generateChart(".barchartCanvas");

  const xScaleForBarchart = d3
    .scaleBand()
    .range([0, graphWidth])
    .paddingInner(0.2)
    .paddingOuter(0.2);

  const tipForBarchart = d3
    .tip()
    .attr("class", "tip")
    .html((d) => `<p class="value">${d.v} $</p>`);

  barchartGraph.call(tipForBarchart);

  const barchart = document.querySelector(".barchart");
  barchart.addEventListener("click", (e) => (e.currentTarget.style = ""));

  let tickers = null;

  //Generates the barchart from the given data
  const renderBarchart = (itemData) => {
    console.log("renderBarchart: ", itemData);

    barchart.style.display = "block";

    let name = tickers.data.filter((tr) => tr.symbol === itemData.symbol)[0]
      .name;
    document.querySelector(".barchart h2").innerHTML = name;
    document.querySelector(".barchart h3").innerHTML = new Date(itemData.date)
      .toISOString()
      .slice(0, 10);

    const data = [
      { v: itemData.open, n: "open" },
      { v: itemData.high, n: "high" },
      { v: itemData.low, n: "low" },
      { v: itemData.close, n: "close" },
    ];
    xScaleForBarchart.domain(data.map((item) => item.n));
    yScale.domain([
      itemData.low - (itemData.high - itemData.low) * 0.1,
      itemData.high,
    ]);

    const xAxisForBarchart = d3.axisBottom(xScaleForBarchart);
    const yAxisForBarchart = d3
      .axisLeft(yScale)
      .ticks(4)
      .tickFormat((t) => t + " $");

    xAxisGroupForBarchart.call(xAxisForBarchart);
    yAxisGroupForBarchart.call(yAxisForBarchart);

    const rects = barchartGraph.selectAll("rect").data(data);

    rects.exit().remove();

    rects
      .enter()
      .append("rect")
      .attr("width", xScaleForBarchart.bandwidth)
      .attr("fill", "orange")
      .attr("x", (d) => xScaleForBarchart(d.n))
      .merge(rects)
      .attr("height", 0)
      .attr("y", graphHeight)
      .transition()
      .duration(1000)
      .attr("height", (d) => graphHeight - yScale(d.v))
      .attr("y", (d) => yScale(d.v));

    barchartGraph
      .selectAll("rect")
      .on("mouseover", (d, i, n) => {
        tipForBarchart.show(d, n[i]);
      })
      .on("mouseout", (d, i, n) => {
        tipForBarchart.hide();
      });
  };

  let updating = false;

  //Calls the backend to update the database
  //If it happened successfully then reloads the page to get the new data
  const updateDatabase = async (e) => {
    if (updating) return;

    updating = true;
    const buttonContent = document.querySelector(".button div:nth-child(2)");
    const buttonText = buttonContent.innerHTML;
    const progress = document.querySelector(".button div:first-child");
    progress.style.background = "red";
    progress.style.width = 0;
    buttonContent.innerHTML = "Updating database: 0%";

    const timer = setInterval(async () => {
      const response = await fetch("/api/index").then((r) => r.json());

      const percent = response.index * 3;

      progress.style.width = percent + "%";
      buttonContent.innerHTML = "Updating database: " + percent + "%";
    }, 1000);

    const response = await fetch("/api/refresh").then((r) => r.json());

    clearInterval(timer);
    progress.style = "";
    buttonContent.innerHTML = buttonText;
    updating = false;

    if (response.msg && response.msg === "Database has been updated")
      location.reload();

    if (response.msg && response.msg === "Error updating database")
      document.querySelector(
        ".canvas"
      ).innerHTML = `<p class="error">Error updating database</p>`;
  };

  // ticker data query and rendering of the chart
  const getTickerData = async (ticker, firstCall = false) => {
    let tickerData;
    try {
      const response = await fetch(`/api/tickersData`, {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ ticker }),
      });

      if (response.ok) tickerData = await response.json();
      else {
        throw Error((await response.json()).err);
      }
    } catch (error) {
      console.log(error);
      document.querySelector(
        ".canvas"
      ).innerHTML = `<p class="error">${error}</p>`;
      await updateDatabase();
    }

    console.log("tickerData: ", tickerData);

    xScale.domain(d3.extent(tickerData.data, (d) => new Date(d.date)));
    yScale.domain(d3.extent(tickerData.data, (d) => Number(d.close)));

    path
      .data([tickerData.data])
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 2)
      .attr("d", () => {
        if (firstCall) {
          return fakeLineGenerator(tickerData.data);
        } else {
          return d;
        }
      })
      .transition()
      .duration(2000)
      .attr("d", () => {
        d = lineGenerator(tickerData.data);
        return lineGenerator(tickerData.data);
      });

    const xAxis = d3
      .axisBottom(xScale)
      .ticks(4)
      .tickFormat(d3.timeFormat("%b %d"));
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(4)
      .tickFormat((t) => t + " $");

    xAxisGroup.call(xAxis);
    yAxisGroup.call(yAxis);

    const circles = graph.selectAll("circle").data(tickerData.data);

    circles.exit().remove();

    circles
      .enter()
      .append("circle")
      .attr("fill", "#000")
      .attr("r", 4)
      .merge(circles)
      .attr("cx", (d, i, c) => {
        if (firstCall) {
          return xScale(new Date(d.date));
        } else {
          return cx[i];
        }
      })
      .attr("cy", (d, i, c) => {
        if (firstCall) {
          return graphHeight;
        } else {
          return cy[i];
        }
      })
      .transition()
      .duration(2000)
      .attr("cy", (d, i, c) => {
        cy[i] = yScale(Number(d.close));
        return yScale(Number(d.close));
      })
      .attr("cx", (d, i, c) => {
        cx[i] = xScale(new Date(d.date));
        return xScale(new Date(d.date));
      });

    graph
      .selectAll("circle")
      .on("mouseover", (d, i, n) => {
        tip.show(d, n[i]);
      })
      .on("mouseout", (d, i, n) => {
        tip.hide();
      })
      .on("click", (d, i, n) => {
        renderBarchart(d);
      });
  };

  //getting tickers

  try {
    let response = await fetch("/api/tickers");
    if (response.ok) tickers = await response.json();
    else {
      throw new Error((await response.json()).err);
    }
  } catch (error) {
    console.log(error);
    document.querySelector(
      ".canvas"
    ).innerHTML = `<p class="error">${error}</p>`;
    await updateDatabase();
  }

  //sorting by name
  tickers.data = tickers.data.sort((a, b) => {
    if (!a.name) a.name = "null";
    if (!b.name) b.name = "null";

    const nameA = a.name.toUpperCase();
    const nameB = b.name.toUpperCase();

    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }

    return 0;
  });

  //filtering those that have eod data
  tickers.data = tickers.data.filter((t) => t.has_eod);

  console.log("tickers", tickers);

  let options = [];
  for (const ticker of tickers.data) {
    options.push(`<option value="${ticker.symbol}">
            ${ticker.name}
        </option>`);
  }

  const selectElement = document.querySelector("select");
  selectElement.insertAdjacentHTML("afterbegin", options.join(""));

  getTickerData(selectElement.value, true);

  const changeListener = (e) => {
    console.log("e.target.value: ", e.target.value);

    getTickerData(e.target.value);
  };

  document.querySelector("select").addEventListener("change", changeListener);

  document.querySelector(".button").addEventListener("click", updateDatabase);
};

window.addEventListener("load", _load);
