import { useEffect, useState, useMemo } from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import "./App.css";

function App() {


  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");


  const [inventory, setInventory] = useState([]);



  const fetchInventory = async () => {
    const res = await fetch("http://127.0.0.1:5000/api/inventory");
    const data = await res.json();
    setInventory(data);
  };

  useEffect(() => {
    fetchInventory();

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

  if (typeof form.stock != "number" ||
      typeof form.avg_sales != "number" ||
      typeof form.supplier_days != "number") {
        alert("Make sure each field is the right datatype");
        return;
      }

  await fetch("http://127.0.0.1:5000/api/inventory", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(form)
  });

  fetchInventory();
};




    const deleteItem = async (id) => {

    if (!window.confirm("Delete this item?")) return;

    await fetch(`http://127.0.0.1:5000/api/inventory/${id}`, {
      method: "DELETE"
    });

    fetchInventory();
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

      fetchInventory();
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
    fetchInventory();
  };



  // Analytics data 
  const chartData = useMemo(() => {
    // Status counts for pie chart
    const statusCounts = {
      CRITICAL: inventory.filter(i => i.status === "CRITICAL").length,
      LOW: inventory.filter(i => i.status === "LOW").length,
      OK: inventory.filter(i => i.status === "OK").length
    };

    const pieData = [
      { name: "CRITICAL", value: statusCounts.CRITICAL, color: "#DC2626" },
      { name: "LOW", value: statusCounts.LOW, color: "#F59E0B" },
      { name: "OK", value: statusCounts.OK, color: "#10B981" }
    ].filter(item => item.value > 0);

    // Timeline data for area chart
    const timelineData = inventory
      .map(item => ({
        name: item.item,
        daysLeft: parseFloat(item.days_left),
        reorderIn: parseFloat(item.reorder_in)
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft);

    return { pieData, timelineData };
  }, [inventory]);



  return (
    <div className="container">

      <h1>✨ Grimoire Shop Inventory ✨</h1>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          🔮 Analytics
        </button>
      </div>

      {activeTab === "dashboard" ? (
        <div className="dashboard-view">
          {editingId ?(
                <h3> 🪄 Edit Spell </h3>

          ) : (
            <h3> ✨ Add Item</h3>
          )}

          <div className="form">

    <input name="item" value={form.item} placeholder="Item" onChange={handleChange} />
    <input name="stock" value={form.stock} placeholder="Stock" onChange={handleChange} />
    <input name="avg_sales" value={form.avg_sales} placeholder="Avg Sales" onChange={handleChange} />
    <input name="supplier_days" value={form.supplier_days} placeholder="Days to Delivery" onChange={handleChange} />


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
                📦 Summon
              </button>
            )}

            <button
              onClick={() => startEdit(item)}
              className="edit-btn"
            >
              🪄🪄 Edit
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
      ) : (
        <div className="analytics-container">
          <div className="chart-section">
            <h2>📊 Inventory Status Distribution</h2>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={chartData.pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {chartData.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-section">
            <h2>⏳ Days Until Stockout Timeline</h2>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData.timelineData}>
                  <defs>
                    <linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(124, 58, 237, 0.3)" />
                  <XAxis
                    dataKey="name"
                    stroke="#F59E0B"
                    tick={{ fill: '#F59E0B' }}
                  />
                  <YAxis
                    stroke="#F59E0B"
                    tick={{ fill: '#F59E0B' }}
                    label={{ value: 'Days', angle: -90, position: 'insideLeft', fill: '#F59E0B' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(30, 27, 75, 0.9)',
                      border: '1px solid #7C3AED',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="daysLeft"
                    stroke="#7C3AED"
                    strokeWidth={3}
                    fill="url(#colorDays)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
