import React, { useEffect, useState } from 'react';
import swal from 'sweetalert2';
import { stocksAndSymbolsList } from '../../stockAndSymbols';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// list of all available stocks to choose from
const stockList = stocksAndSymbolsList.filter( (symbol) => symbol.assetType === 'Stock')
const apiUrl =
  'https://alpha-vantage.p.rapidapi.com/query?interval=5min&function=TIME_SERIES_INTRADAY&symbol=AAPL&datatype=json&output_size=compact';

const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': '120b92b74cmsha4a1c332ac01dd5p12d348jsn539af1adfca3',
    'X-RapidAPI-Host': 'alpha-vantage.p.rapidapi.com',
  },
};

const IntradayChart = () => {
  const [stockData, setStockData] = useState(null);
  const [searchValue, setSearchValue] = useState({userInput: 'AAPL | Apple Stocks '});

  useEffect(() => {
    fetchData(searchValue);
  }, []);

  function handleForm(event) {
    const { name, value } = event.target;
    setSearchValue((prevSearchValue) => ({
      ...prevSearchValue,
      [name]: value,
    }));
  }

  function fetchData(searchValue) {
    if (!searchValue || !searchValue.userInput) {
      swal.fire('Invalid Input', 'You need to type in a stock symbol or Company Name!', 'error');
      return;
    }
  
    const input = searchValue.userInput;
    const inputWordsArray = input.split(' ');
    const symbol = inputWordsArray[0];
    const url = symbol
      ? `https://alpha-vantage.p.rapidapi.com/query?interval=5min&function=TIME_SERIES_INTRADAY&symbol=${symbol}&datatype=json&output_size=compact`
      : apiUrl;
  
    fetch(url, options)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        console.log(response);
        return response.json();
      })
      .then((data) => {
        setStockData(data);
      })
      .catch((error) => {
        if (error.message === 'Failed to fetch') {
          swal.fire('Network error. Please check your internet connection.');
        } else if(error.message == 'HTTP error! Status: 429') {
            console.error(error);
            let timerInterval
            swal.fire({
             icon: 'error',   
            title: 'Woah, Slow Down !',
            html: 'Too many requests<br/>I will refresh close in <b>40</b> Seconds.',
            timer: 40000,
            timerProgressBar: true,
            didOpen: () => {
                swal.showLoading()
                const b = swal.getHtmlContainer().querySelector('b')
                timerInterval = setInterval(() => {
                b.textContent = swal.getTimerLeft()
                }, 40000)
            },
            willClose: () => {
                clearInterval(timerInterval)
                location.reload()
            }
            }).then((result) => {
            /* Read more about handling dismissals below */
            if (result.dismiss === swal.DismissReason.timer) {
            }
            })

        } else {
          console.error(error.message);
          swal.fire('An unexpected error occurred.');
        }
      });
  }

  // does something after a delay
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  

  if (!stockData) {
    return (
      <div className='w-100 h-100 d-flex justify-content-center align-items-center'>
        <div className='spinner-border ' role='status'>
          <span className='sr-only'></span>
        </div>
      </div>
    );
  } else {
    if (!stockData['Time Series (5min)']) {
      swal.fire("Stock Not Found", "No such Stock Found in the Database ! ", 'info')
      .then((result) => {
        if (result.isConfirmed) {
          window.location.reload()
        }
      })
    }
    console.log(stockData);
    // Extract the data points that you need for your prediction
    const timestamps = Object.keys(stockData['Time Series (5min)']);
    const highPrices = timestamps.map(timestamp => parseFloat(stockData['Time Series (5min)'][timestamp]['2. high']));
    const lowPrices = timestamps.map(timestamp => parseFloat(stockData['Time Series (5min)'][timestamp]['3. low']));
    const closePrices = timestamps.map(timestamp => parseFloat(stockData['Time Series (5min)'][timestamp]['4. close']));
    const openPrice = closePrices[0]; // The opening price is the closing price of the previous 5-minute period.

    // Check if there are valid data points for calculation
    if (highPrices.length === 0 || lowPrices.length === 0 || closePrices.length === 0) {
        swal.fire('Insufficient data for calculation')
        console.error('Insufficient data for calculation');
        return;
    }

    // Calculate the average high, low, and closing prices over the past 5 minutes
    const averageHighPrice = highPrices.reduce((sum, price) => sum + price, 0) / highPrices.length;
    const averageLowPrice = lowPrices.reduce((sum, price) => sum + price, 0) / lowPrices.length;
    const averageClosePrice = closePrices.reduce((sum, price) => sum + price, 0) / closePrices.length;

    // Check for valid numerical values in the averages
    if (isNaN(averageHighPrice) || isNaN(averageLowPrice) || isNaN(averageClosePrice)) {
        swal.fire('Invalid average prices calculated')
        console.error('Invalid average prices calculated');
        return;
    }

    // Make a prediction for the next 5-minute high, low, and closing prices
    const predictedHighPrice = averageHighPrice;
    const predictedLowPrice = averageLowPrice;
    const predictedClosePrice = averageClosePrice;


    const timeSeries = stockData['Time Series (5min)'];      
      const labels = Object.keys(timeSeries).reverse();
      const closingPrices = labels.map(
        (label) => parseFloat(timeSeries[label]['4. close'])
      );
    
    
      const data = {
        labels: labels,
        datasets: [
          {
            label: 'Closing Price',
            data: closingPrices,
            fill: true,
            borderColor: 'rgba(75,192,192,1)',
            backgroundColor: 'rgba(23,1,25,1)',
          },
        ],
      };
    
      const chartOptions = {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Result for stock',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function (context) {
                return 'Closing Price: $' + context.parsed.y.toFixed(2);
              },
            },
          },
        },
      };
    
      function showPrediction() {
        console.log('ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss****');
        if (predictedHighPrice) {
          swal.fire({
            title:'Predictions:',
            html: `
              <table class="table table-sm table-bordered">
                <caption class="table-caption fs-3 fw-bolder bg-dark text-light text-center" style="caption-side:top">
                  Predicted Prices
                </caption>
                <thead>
                  <tr>
                    <th class="px-3" scope="col" data-bs-toggle="tooltip" data-bs-placement="top" style="cursor: 'help">#</th>
                    <th class="px-3" scope="col" data-bs-toggle="tooltip" data-bs-placement="top" style="cursor: 'help" title="The predicted highest traded price for the stock during the given time period">High price</th>
                    <th class="px-3" scope="col" data-bs-toggle="tooltip" data-bs-placement="top" style="cursor: 'help" title="The predicted lowest traded price for the stock during the given time period">Low price</th>
                    <th class="px-3" scope="col" data-bs-toggle="tooltip" data-bs-placement="top" style="cursor: 'help" title="The predicted final price at which a stock is traded on a given trading day">Closing price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="px-5">
                    <th scope="row">1</th>
                    <td>${predictedHighPrice.toFixed(3)}</td>
                    <td>${predictedLowPrice.toFixed(3)}</td>
                    <td>${predictedClosePrice.toFixed(3)}</td>
                  </tr>
                </tbody>
              </table>`,
            icon:'success',
          })
        } else {
          swal.fire('No Data to predict')
        }
        
      }

      // function to get list suggestions while typing
     const stockItems = stockList.map((stock)=>{ 
     return ( 
       <option key={stock.symbol} value={`${stock.symbol} | ${stock.name}`} />
    )})

    return (
        <div>
            <form className='d-flex'>
            <input
                className='form-control'
                list='stock-List'
                onChange={handleForm}
                name='userInput'
                type='search'
                placeholder='APPLE...'
                aria-label='Search'
                required
            />
            
        <datalist id='stock-List'>
            {stockItems}
        </datalist>
            <button
                className='btn btn-outline-success'
                onClick={() => fetchData(searchValue)}
                type='button'
            >
                Search
            </button>
            </form>
            <div>
            <h1>{stockData['Meta Data']['2. Symbol']} Stock Price Chart</h1>
            <Line data={data} options={chartOptions} height={700} width={1400} />
            </div>
            <br />
            <br />
            <br />
            {averageHighPrice && (
              <table className="table table-sm table-bordered " >
                <caption className="table-caption fs-3 fw-bolder bg-dark text-light text-center" style={{ captionSide: 'top' }}>
                  Average Stock Price Summary
                </caption>
                <thead>
                <tr>
                  <th className="px-3" scope="col" data-bs-toggle="tooltip" data-bs-placement="top" style={{cursor: 'help'}}>#</th>
                  <th className="px-3" scope="col" data-bs-toggle="tooltip" data-bs-placement="top" style={{cursor: 'help'}} title="The initial price at the beginning of a trading period">opening price</th>
                  <th className="px-3" scope="col" data-bs-toggle="tooltip" data-bs-placement="top" style={{cursor: 'help'}} title="The highest traded price for the stock during the given time period">High price</th>
                  <th className="px-3" scope="col" data-bs-toggle="tooltip" data-bs-placement="top" style={{cursor: 'help'}} title="The lowest traded price for the stock during the given time period">Low price</th>
                  <th className="px-3" scope="col" data-bs-toggle="tooltip" data-bs-placement="top" style={{cursor: 'help'}} title="The final price at which a stock is traded on a given trading day">Closing price</th>
                </tr>
                </thead>
                <tbody>
                  <tr className="px-5">
                    <th scope="row">1</th>
                    <td>{openPrice}</td>
                    <td>{averageHighPrice}</td>
                    <td>{averageLowPrice}</td>
                    <td>{averageClosePrice}</td>
                  </tr>
                </tbody>
              </table>
            )}

            <div className="btn-group">
              <button className="position-relative left-0 btn btn-success btn-lg m-5" style={{boxShadow: '5px 2px 8px #223322'}} href='#prediction' onClick={showPrediction}> Get Predictions</button>

            </div>
       
         
        
        
            
    </div>
    );
  }
};

export default IntradayChart;

