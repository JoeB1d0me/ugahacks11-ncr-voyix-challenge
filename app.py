from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

DB = "inventory.db"


def get_db():
    return sqlite3.connect(DB)


# READ
@app.route("/api/inventory", methods=["GET"])
def get_inventory():
    conn = get_db()
    c = conn.cursor()

    c.execute("""
        SELECT
            i.id, i.item, i.stock, i.avg_daily_sales, i.supplier_days,
            o.id, o.quantity_ordered, o.order_date, o.expected_arrival_date
        FROM inventory i
        LEFT JOIN orders o ON i.id = o.inventory_id AND o.status = 'pending'
    """)
    rows = c.fetchall()

    data = []
    today = datetime.today()

    for row in rows:

        id, item, stock, avg_sales, supplier_days, order_id, quantity_ordered, order_date, expected_arrival = row

        # Safety casting (just in case)
        stock = int(stock)
        avg_sales = float(avg_sales)
        supplier_days = int(supplier_days)
        
        
        if avg_sales <= 0:
            days_left = 0
        else:
            days_left = stock / avg_sales

        # Calculate reorder point
        reorder_point = avg_sales * supplier_days

        # Safety buffer (2 days)
        safety_stock = avg_sales * 2

        # When should we reorder
        reorder_in = days_left - supplier_days
        reorder_date = today + timedelta(days=max(0, reorder_in))

        # Status logic based on reorder timing
        status = "OK"

        # If we need to reorder now or are already late
        if reorder_in <= 0:
            status = "CRITICAL"

        # If we should reorder within 3 days
        elif reorder_in <= 3:
            status = "LOW"

        data.append({
            "id": id,
            "item": item,
            "stock": stock,
            "avg_sales": avg_sales,
            "supplier_days": supplier_days,

            # computed fields
            "reorder_point": round(reorder_point, 1),
            "days_left": round(days_left, 1),
            "reorder_in": round(reorder_in, 1),
            "reorder_date": reorder_date.strftime("%Y-%m-%d"),
            "status": status,

            # order tracking fields
            "has_pending_order": order_id is not None,
            "order_id": order_id,
            "quantity_ordered": quantity_ordered,
            "expected_arrival": expected_arrival
        })

    conn.close()

    return jsonify(data)


# CREATE
@app.route("/api/inventory", methods=["POST"])
@app.route("/api/inventory", methods=["POST"])
def add_item():
    data = request.json
    
    item = data["item"]
    stock = int(data["stock"])
    avg_sales = float(data["avg_sales"])
    supplier_days = int(data["supplier_days"])

    conn = get_db()
    c = conn.cursor()
    
    c.execute("""
    INSERT INTO inventory
    (item, stock, avg_daily_sales, supplier_days)
    VALUES (?, ?, ?, ?)
    """, (
        item,
        stock,
        avg_sales,
        supplier_days
    ))

    conn.commit()
    conn.close()

    return jsonify({"message": "Item added"}), 201

# UPDATE
@app.route("/api/inventory/<int:item_id>", methods=["PUT"])
@app.route("/api/inventory/<int:item_id>", methods=["PUT"])
def update_item(item_id):
    data = request.json
    
    item = data["item"]
    stock = int(data["stock"])
    avg_sales = float(data["avg_sales"])
    supplier_days = int(data["supplier_days"])

    conn = get_db()
    c = conn.cursor()

    c.execute("SELECT * FROM inventory WHERE id=?", (item_id,))
    if not c.fetchone():
        conn.close()
        return jsonify({"error": "Item not found"}), 404

    c.execute("""
    UPDATE inventory
    SET
        item = ?,
        stock = ?,
        avg_daily_sales = ?,
        supplier_days = ?
    WHERE id = ?
    """, (
        item,
        stock,
        avg_sales,
        supplier_days,
        item_id
    ))

    conn.commit()
    conn.close()

    return jsonify({"message": "Item updated successfully"})


# DELETE
@app.route("/api/inventory/<int:item_id>", methods=["DELETE"])
def delete_item(item_id):
    conn = get_db()
    c = conn.cursor()

    c.execute("SELECT * FROM inventory WHERE id=?", (item_id,))
    if not c.fetchone():
        conn.close()
        return jsonify({"error": "Item not found"}), 404

    c.execute("DELETE FROM inventory WHERE id=?", (item_id,))

    conn.commit()
    conn.close()

    return jsonify({"message": "Item deleted"})


# ORDERS - Place new order
@app.route("/api/orders", methods=["POST"])
def place_order():
    data = request.json
    inventory_id = int(data["inventory_id"])

    conn = get_db()
    c = conn.cursor()

    # Check item exists and get supplier_days
    c.execute("SELECT stock, avg_daily_sales, supplier_days FROM inventory WHERE id=?", (inventory_id,))
    result = c.fetchone()
    if not result:
        conn.close()
        return jsonify({"error": "Item not found"}), 404

    stock, avg_sales, supplier_days = result

    # Check for existing pending order (one at a time)
    c.execute("SELECT id FROM orders WHERE inventory_id=? AND status='pending'", (inventory_id,))
    if c.fetchone():
        conn.close()
        return jsonify({"error": "Order already pending"}), 400

    # Calculate dates and quantity
    today = datetime.today()
    order_date = today.strftime("%Y-%m-%d")
    expected_arrival = (today + timedelta(days=supplier_days)).strftime("%Y-%m-%d")

    reorder_point = avg_sales * supplier_days
    quantity_ordered = max(1, int(reorder_point - stock))

    # Insert order
    c.execute("""
        INSERT INTO orders
        (inventory_id, quantity_ordered, order_date, expected_arrival_date, status)
        VALUES (?, ?, ?, ?, 'pending')
    """, (inventory_id, quantity_ordered, order_date, expected_arrival))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Order placed",
        "quantity": quantity_ordered,
        "expected_arrival": expected_arrival
    }), 201


if __name__ == "__main__":
    app.run(debug=True)
