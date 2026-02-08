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

    c.execute("SELECT id, item, stock, avg_daily_sales, supplier_days FROM inventory")
    rows = c.fetchall()

    data = []
    today = datetime.today()

    for row in rows:

        id, item, stock, avg_sales, supplier_days = row

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

        # Status logic
        status = "OK"

        if stock <= reorder_point:
            status = "CRITICAL"

        elif stock <= reorder_point + safety_stock:
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
            "reorder_date": reorder_date.strftime("%Y-%m-%d"),
            "status": status
        })

    conn.close()

    return jsonify(data)


# CREATE
@app.route("/api/inventory", methods=["POST"])
def add_item():
    data = request.json
    
    item = data["item"]
    stock = int(data["stock"])
    avg_sales = float(data["avg_sales"])
    supplier_days = int(data["supplier_days"])
    reorder_point = int(data["reorder_point"])

    conn = get_db()
    c = conn.cursor()
    
    c.execute("""
    INSERT INTO inventory
    (item, stock, avg_daily_sales, supplier_days, reorder_point)
    VALUES (?, ?, ?, ?, ?)
    """, (
        item,
        stock,
        avg_sales,
        supplier_days,
        reorder_point
    ))


    conn.commit()
    conn.close()

    return jsonify({"message": "Item added"}), 201


# UPDATE
@app.route("/api/inventory/<int:item_id>", methods=["PUT"])
def update_item(item_id):
    data = request.json
    
    item = data["item"]
    stock = int(data["stock"])
    avg_sales = float(data["avg_sales"])
    supplier_days = int(data["supplier_days"])
    reorder_point = int(data["reorder_point"])

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

if __name__ == "__main__":
    app.run(debug=True)
