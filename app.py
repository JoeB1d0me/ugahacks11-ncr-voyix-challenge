import os
import sqlite3
from flask import Flask, render_template
from datetime import timedelta, datetime

app = Flask(__name__)

DB = 'inventory.db'

def get_db():
    return sqlite3.connect(DB)

@app.route("/")
def dashboard():
    conn = get_db()
    c = conn.cursor()
    
    c.execute("SELECT * FROM inventory")
    rows = c.fetchall()
    
    inventory = []
    
    today = datetime.today()
    
    for row in rows:
        id, item, stock, avg_sales, supplier_days, reorder_point = row
        
        days_left = stock / avg_sales if avg_sales > 0 else 0
        reorder_in = days_left-supplier_days
        
        reorder_date = today + timedelta(days=max(0, reorder_in))
        
        status = "OK"
        
        if days_left < 3:
            status = "CRITICAL"
        elif days_left < 6:
            status = "LOW"
            
        inventory.append({
            "item" : item,
            "stock" : stock,
            "avg_sales" : avg_sales,
            "days_left" : round(days_left, 1),
            "reorder_date" :reorder_date.strftime("%Y-%m-%d"),
            "status" : status
        })
        
    conn.close()
    
    return render_template("dashboard.html", inventory=inventory)



if __name__ == "__main__":
    app.run(debug=True)