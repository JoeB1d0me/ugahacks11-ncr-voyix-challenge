import { useEffect, useState } from "react";
import "./App.css";

function App() {

  const [inventory, setInventory] = useState([]);

  useEffect(() => {

    fetch("http://127.0.0.1:5000/api/inventory")
      .then(res => res.json())
      .then(data => setInventory(data));

  }, []);

  


  return (
    <div className="container">

      <h1>📊 Inventory Health Monitor</h1>

      <table>

        <thead>
          <tr>
            <th>Item</th>
            <th>Stock</th>
            <th>Avg Sales</th>
            <th>Days Left</th>
            <th>Reorder Date</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>

          {inventory.map(item => (

            <tr key={item.id}>

              <td>{item.item}</td>
              <td>{item.stock}</td>
              <td>{item.avg_sales}</td>
              <td>{item.days_left}</td>
              <td>{item.reorder_date}</td>

              <td>

                {item.status === "CRITICAL" &&
                  <span className="critical">CRITICAL</span>}

                {item.status === "LOW" &&
                  <span className="low">LOW</span>}

                {item.status === "OK" &&
                  <span className="ok">OK</span>}

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default App;
