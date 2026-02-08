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


  <div className="form">

    <h3>✨ Add New Item </h3>

    <input name="item" placeholder="Item" onChange={handleChange} />
    <input name="stock" placeholder="Stock" onChange={handleChange} />
    <input name="avg_sales" placeholder="Avg Sales" onChange={handleChange} />
    <input name="supplier_days" placeholder="Supplier Days" onChange={handleChange} />

    {editingId ? (

    <button onClick={updateItem}>
      ✨ Update Spell
    </button>

  ) : (

    <button onClick={addItem}>
      ➕ Cast Spell
    </button>

  )}

  </div>



      <table>

        <thead>
          <tr>
            <th>Item</th>
            <th>Stock</th>
            <th>Avg Sales</th>
            <th>Days Left</th>
            <th>Reorder Date</th>
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
              <td>{item.reorder_date}</td>

              <td>

                {item.status === "CRITICAL" &&
                  <span className="critical">CRITICAL</span>}

                {item.status === "LOW" &&
                  <span className="low">LOW</span>}

                {item.status === "OK" &&
                  <span className="ok">OK</span>}

              </td>
              
              <td>

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

              </td>


            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default App;
