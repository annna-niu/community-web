from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)
DATA_FILE = "data.json"

def load_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    today = datetime.now().strftime("%Y-%m-%d")
    data = load_data()
    
    # 標記逾期
    for item in data:
        item['is_overdue'] = (item.get('status') != '已完成' and item.get('deadline', '') < today)
        
    return jsonify(data)

@app.route('/api/tasks', methods=['POST'])
def add_task():
    new_task = request.json
    data = load_data()
    
    new_id = 1 if not data else max(item["id"] for item in data) + 1
    
    item = {
        "id": new_id,
        "task": new_task.get("task", ""),
        "person": new_task.get("person", "未指定"),
        "status": "處理中",
        "deadline": new_task.get("deadline", "")
    }
    
    data.append(item)
    save_data(data)
    return jsonify({"success": True, "task": item})

@app.route('/api/tasks/<int:task_id>', methods=['PATCH'])
def update_task_status(task_id):
    update_data = request.json
    data = load_data()
    
    for item in data:
        if item["id"] == task_id:
            item["status"] = update_data.get("status", item["status"])
            break
            
    save_data(data)
    return jsonify({"success": True})

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    data = load_data()
    data = [item for item in data if item["id"] != task_id]
            
    save_data(data)
    return jsonify({"success": True})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
