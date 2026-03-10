document.addEventListener('DOMContentLoaded', () => {
    // 預設填入今日日期
    document.getElementById('taskDeadline').valueAsDate = new Date();
    
    // 初始化載入資料
    loadTasks();

    // 處理新增表單
    document.getElementById('taskForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const task = document.getElementById('taskName').value;
        const person = document.getElementById('taskPerson').value;
        const deadline = document.getElementById('taskDeadline').value;
        
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ task, person, deadline })
            });
            const data = await res.json();
            if(data.success) {
                // 清空表單並重新整理列表
                document.getElementById('taskName').value = '';
                document.getElementById('taskPerson').value = '';
                loadTasks();
            }
        } catch (error) {
            console.error("Error adding task:", error);
            alert("新增失敗，請稍後再試");
        }
    });

    // 處理篩選按鈕
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // 更新按鈕樣式
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // 套用篩選
            const filter = e.target.getAttribute('data-filter');
            applyFilter(filter);
        });
    });
});

async function loadTasks() {
    try {
        const res = await fetch('/api/tasks');
        const tasks = await res.json();
        renderTasks(tasks);
    } catch (error) {
        console.error("Error loading tasks:", error);
    }
}

function renderTasks(tasks) {
    const container = document.getElementById('tasksContainer');
    container.innerHTML = '';
    
    // 將最新項目或未完成項目排前面(簡單排序)
    tasks.sort((a, b) => {
        if(a.status === '已完成' && b.status !== '已完成') return 1;
        if(a.status !== '已完成' && b.status === '已完成') return -1;
        return a.deadline.localeCompare(b.deadline);
    });

    const template = document.getElementById('taskCardTemplate');
    
    tasks.forEach(task => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.task-card');
        
        card.setAttribute('data-status', task.status);
        
        if (task.status === '已完成') {
            card.classList.add('completed');
            clone.querySelector('.status-badge').textContent = '已完成';
            // 隱藏完成按鈕
            clone.querySelector('.complete-btn').style.display = 'none';
        } else {
            clone.querySelector('.status-badge').textContent = task.status;
            if (task.is_overdue) {
                card.classList.add('overdue');
                clone.querySelector('.status-badge').textContent = '已逾期';
            }
        }
        
        clone.querySelector('.deadline-badge').textContent = `📅 ${task.deadline}`;
        clone.querySelector('.task-title').textContent = task.task;
        clone.querySelector('.task-person').textContent = task.person;
        
        // 綁定事件
        const btnComplete = clone.querySelector('.complete-btn');
        if(btnComplete) {
            btnComplete.addEventListener('click', () => updateTaskStatus(task.id, '已完成'));
        }
        
        const btnDelete = clone.querySelector('.delete-btn');
        btnDelete.addEventListener('click', () => {
             if(confirm(`確定要刪除「${task.task}」嗎？`)) {
                 deleteTask(task.id);
             }
        });
        
        container.appendChild(clone);
    });

    // 重新套用目前的篩選狀態
    const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
    applyFilter(activeFilter);
}

function applyFilter(filter) {
    const cards = document.querySelectorAll('.task-card');
    cards.forEach(card => {
        const status = card.getAttribute('data-status');
        if (filter === 'all') {
            card.style.display = 'flex';
        } else if (filter === 'pending' && status !== '已完成') {
            card.style.display = 'flex';
        } else if (filter === 'completed' && status === '已完成') {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

async function updateTaskStatus(id, newStatus) {
    try {
        const res = await fetch(`/api/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if(res.ok) {
            loadTasks();
        }
    } catch (error) {
        console.error("Error updating sub:", error);
    }
}

async function deleteTask(id) {
    try {
        const res = await fetch(`/api/tasks/${id}`, {
            method: 'DELETE'
        });
        if(res.ok) {
            loadTasks();
        }
    } catch (error) {
         console.error("Error deleting:", error);
    }
}
