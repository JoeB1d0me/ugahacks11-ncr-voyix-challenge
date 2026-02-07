import sqlite3

conn = sqlite3.connect("inventory.db")
c = conn.cursor()

# Drop tables if they exist (for reset)
c.execute("DROP TABLE IF EXISTS inventory")
c.execute("DROP TABLE IF EXISTS sales")

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

# Sample inventory data
items = [
    ("Burger Buns", 120, 25, 3, 100),
    ("Beef Patties", 300, 40, 4, 150),
    ("Cheese", 200, 20, 2, 80),
    ("Lettuce", 90, 15, 2, 60),
    ("Soda Syrup", 50, 8, 5, 40)
]

c.executemany("""
INSERT INTO inventory
(item, stock, avg_daily_sales, supplier_days, reorder_point)
VALUES (?, ?, ?, ?, ?)
""", items)

conn.commit()
conn.close()

print("Database initialized!")
