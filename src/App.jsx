import React, { useEffect, useState } from 'react';

import IntradayChart from './components/IntradayChart';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle';
import './App.css';
import NotFound404 from './components/NotFound404';
import swal from 'sweetalert2';

function App() {
  
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  useEffect(()=> {
    if (!isOnline) {
      console.log('Not Connected, You need internet connection to use this app');
      swal.fire("Not Connected", "You need internet connection to use this app<br />Connect and click ok ! ", 'error')
      .then((result) => {
        if (result.isConfirmed) {
          window.location.reload()
        }
      })
    }
  }, [])
 
return ( 
  isOnline ? 
  <div className="App d-flex ">
    <div className='container '>
      <div className='bzzzzzzzz'>
          <IntradayChart />
      </div>
    </div>
  </div>
  : <div>
    <h1 className="text-center text-danger">
      You are not connected to the Internet 
    </h1>
  </div>
);

  
}

export default App;
