import sqlite3

conn = sqlite3.connect("inventory.db")
c = conn.cursor()

# Drop tables if they exist (for reset)
c.execute("DROP TABLE IF EXISTS inventory")
c.execute("DROP TABLE IF EXISTS sales")
c.execute("DROP TABLE IF EXISTS orders")

# Inventory table
c.execute("""
CREATE TABLE inventory (
    id INTEGER PRIMARY KEY,
    item TEXT,
    stock INTEGER,
    avg_daily_sales REAL,
    supplier_days INTEGER,
    reorder_point INTEGER
)
""")

# Sales history
c.execute("""
CREATE TABLE sales (
    id INTEGER PRIMARY KEY,
    item TEXT,
    date TEXT,
    units_sold INTEGER
)
""")

# Orders table for tracking restocks
c.execute("""
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_id INTEGER NOT NULL,
    quantity_ordered INTEGER NOT NULL,
    order_date TEXT NOT NULL,
    expected_arrival_date TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
)
""")

# Sample inventory data
items = [
    ("Wands", 120, 25, 3, 100),
    ("Robes", 300, 40, 4, 150),
    ("Tomes", 200, 20, 2, 80),
    ("Potions", 90, 15, 2, 60),
    ("Hats", 50, 8, 5, 40)
]

c.executemany("""
INSERT INTO inventory
(item, stock, avg_daily_sales, supplier_days, reorder_point)
VALUES (?, ?, ?, ?, ?)
""", items)

conn.commit()
conn.close()

print("Database initialized!")
