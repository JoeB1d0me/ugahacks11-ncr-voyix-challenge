import { useEffect, useState } from "react";
import "./App.css";

function App() {


  const [editingId, setEditingId] = useState(null);


  const [inventory, setInventory] = useState([]);

  useEffect(() => {

    fetch("http://127.0.0.1:5000/api/inventory")
      .then(res => res.json())
      .then(data => setInventory(data));

  }, []);

  const [form, setForm] = useState({
  item: "",
  stock: "",
  avg_sales: "",
  supplier_days: "",
  reorder_point: ""
});


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };


  const addItem = async () => {

  if (!form.item ||
      !form.stock ||
      !form.avg_sales ||
      !form.supplier_days) {

    alert("Please fill all fields");
    return;
  }

  await fetch("http://127.0.0.1:5000/api/inventory", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(form)
  });

  window.location.reload();
};




    const deleteItem = async (id) => {

    if (!window.confirm("Delete this item?")) return;

    await fetch(`http://127.0.0.1:5000/api/inventory/${id}`, {
      method: "DELETE"
    });

    window.location.reload();
  };


  const placeOrder = async (item) => {

    if (!window.confirm(`Place order for ${item.item}?`)) return;

    try {
      const response = await fetch("http://127.0.0.1:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inventory_id: item.id })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to place order");
        return;
      }

      window.location.reload();
    } catch (err) {
      alert("Failed to place order");
    }
  };


  const startEdit = (item) => {

    setEditingId(item.id);

    setForm({
      item: item.item,
      stock: item.stock,
      avg_sales: item.avg_sales,
      supplier_days: item.supplier_days,
      reorder_point: item.reorder_point
    });
  };

  const cancelEdit = async () => {
    setEditingId(null);
    setForm({
      item: "",
      stock: "",
      avg_sales: "",
      supplier_days: ""
    });
  }
  const updateItem = async () => {

    await fetch(`http://127.0.0.1:5000/api/inventory/${editingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    setEditingId(null);
    window.location.reload();
  };



  return (
    <div className="container">

      <h1>📊 Inventory Health Monitor</h1>


    {editingId ?(
          <h3> 🪄 Edit spell </h3>
          
    ) : (
      <h3> ✨ Add Spell</h3>
    )}

  <div className="form">

    <input name="item" placeholder="Item" onChange={handleChange} />
    <input name="stock" placeholder="Stock" onChange={handleChange} />
    <input name="avg_sales" placeholder="Avg Sales" onChange={handleChange} />
    <input name="supplier_days" placeholder="Days to Delivery" onChange={handleChange} />


    <button onClick={addItem}>
      ➕ Cast Spell
    </button>


  </div>



      <table>

        <thead>
          <tr>
            <th>Item</th>
            <th>Stock</th>
            <th>Avg Sales</th>
            <th>Days Left</th>
            <th>Reorder In</th>
            <th>Reorder Date</th>
            <th>Expected Arrival</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {inventory.map(item => (

            <tr key={item.id}>

              <td>{item.item}</td>
              <td>{item.stock}</td>
              <td>{item.avg_sales}</td>
              <td>{item.days_left}</td>

              <td>
                {item.reorder_in > 0
                  ? `${item.reorder_in} days`
                  : "Order Now!"}
              </td>

              <td>{item.reorder_date}</td>

              <td>
                {item.has_pending_order ? (
                  <span className="arrival-date">
                    📦 {item.expected_arrival}
                  </span>
                ) : (
                  <span className="no-order">-</span>
                )}
              </td>

              <td>

                {item.status === "CRITICAL" &&
                  <span className="critical">CRITICAL</span>}

                {item.status === "LOW" &&
                  <span className="low">LOW</span>}

                {item.status === "OK" &&
                  <span className="ok">OK</span>}

              </td>
              
              <td>

        {/* If this row is being edited */}
        {editingId === item.id ? (

          <>
            <button
              onClick={updateItem}
              className="edit-btn"
            >
              💾 Save
            </button>

            <button
              onClick={cancelEdit}
              className="cancel-btn"
            >
              ❌ Cancel
            </button>
          </>

        ) : (

          <>
            {!item.has_pending_order && (
              <button
                onClick={() => placeOrder(item)}
                className="order-btn"
              >
                📦 Order
              </button>
            )}

            <button
              onClick={() => startEdit(item)}
              className="edit-btn"
            >
              ✏️ Edit
            </button>

            <button
              onClick={() => deleteItem(item.id)}
              className="delete-btn"
            >
              🗑️ Delete
            </button>
          </>

        )}

          </td>



            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default App;
