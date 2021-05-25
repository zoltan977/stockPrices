const _load = async () => {


    const margin = { top: 40, right: 20, bottom: 50, left: 100 }
    const graphWidth = 560 - margin.left - margin.right
    const graphHeight = 400 - margin.top - margin.bottom;

    const svg = d3.select('.canvas')
        .append('svg')
        .attr('width', graphWidth + margin.left + margin.right)
        .attr('height', graphHeight + margin.top + margin.bottom)
        .attr('viewBox', `0 0 ${graphWidth + margin.left + margin.right} ${graphHeight + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', "xMidYMin meet")

    const graph = svg
        .append('g')
        .attr('width', graphWidth)
        .attr('height', graphHeight)
        .attr('transform', `translate(${margin.left}, ${margin.top})`)

    const xScale = d3.scaleTime().range([0, graphWidth])
    const yScale = d3.scaleLinear().range([graphHeight, 0])

    const xAxisGroup = graph
        .append('g')
        .attr('class', 'xAxis')
        .attr('transform', `translate(0, ${graphHeight})`)

    const yAxisGroup = graph
        .append('g')
        .attr('class', 'yAxis')

    const lineGenerator = d3.line()
        .x(function(d){ return xScale(new Date(d.date))})
        .y(function(d){ return yScale(Number(d.close))})

    const path = graph.append('path')


    const getTickerData = async (ticker) => {

        const date = new Date()
        const aYearAgo = new Date((new Date()).setFullYear(date.getFullYear() - 1));
    
        const tickerData = await fetch(`http://api.marketstack.com/v1/eod?access_key=c17919abec972c1024a4858c3648e2df&symbols=${ticker}&date_from=${aYearAgo.toISOString().slice(0, 10)}&date_to=${date.toISOString().slice(0, 10)}`)
        .then(r => r.json());

        console.log("tickerData: ", tickerData)


        xScale.domain(d3.extent(tickerData.data, d => new Date(d.date)))
        yScale.domain([d3.min(tickerData.data, d => Number(d.close)), d3.max(tickerData.data, d => Number(d.close))])



        path.data([tickerData.data])
            .attr('fill', 'none')
            .attr('stroke', '#000')
            .attr('stroke-width', 2)
            .attr('d', lineGenerator)

        const xAxis = d3.axisBottom(xScale).ticks(4).tickFormat(d3.timeFormat('%b %d'))
        const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat(t => t + " $")

        xAxisGroup.call(xAxis)
        yAxisGroup.call(yAxis)

        const circles = graph.selectAll('circle')
            .data(tickerData.data)

        circles.exit().remove()

        circles
            .attr('cx', d => xScale(new Date(d.date)))
            .attr('cy', d => yScale(Number(d.close)))
            .attr('data-close', d => d.close)
            .attr('data-date', d => new Date(d.date).toISOString().slice(0, 10))

        circles.enter()
            .append('circle')
                .attr('r', 4)
                .attr('cx', d => xScale(new Date(d.date)))
                .attr('cy', d => yScale(Number(d.close)))
                .attr('fill', '#000')
                .attr('data-close', d => d.close)
                .attr('data-date', d => new Date(d.date).toISOString().slice(0, 10))

        document.querySelectorAll('circle')
            .forEach(element => {
                element.addEventListener("mouseenter", function(e) {
                    const span = document.querySelector("span")
                    span.style.display = 'inline'
                    span.style.left = `${e.clientX}px`
                    span.style.top = `${e.clientY}px`
                    span.innerHTML = `${element.dataset.close} $ <br> ${element.dataset.date}`
                })   
                
                element.addEventListener("mouseleave", function() {
                    const span = document.querySelector("span")
                    span.style = ""
                })
            });

    }

    const tickers = await fetch("http://api.marketstack.com/v1/tickers?access_key=c17919abec972c1024a4858c3648e2df")
    .then(r => r.json());

    console.log("tickers", tickers);

    let options = []
    for (const ticker of tickers.data) {
        options.push(`<option value="${ticker.symbol}">
            ${ticker.name}
        </option>`)
    }

    const selectElement = document.querySelector("select");
    selectElement.insertAdjacentHTML("afterbegin", options.join(""));

    getTickerData(selectElement.value)

    const changeListener = (e) => {
        console.log("e.target.value: ", e.target.value)

        getTickerData(e.target.value)
    };

    document.querySelector("select").addEventListener("change", changeListener)

    
    
}

window.addEventListener("load", _load)