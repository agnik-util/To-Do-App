const API_BASE_URL = 'http://localhost:3030/api/tasks'; // Your Spring Boot endpoint

let allTasks = []; // Will hold our tasks so we can look them up for editing
let currentEditTaskId = null; // Remembers which task we are currently editing

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Auth & Set Username
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const greetingEl = document.getElementById('greeting');
    if (greetingEl) greetingEl.innerHTML = `Hello, ${username}`;

    // 2. Dark Mode Logic
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme === 'light') {
        body.classList.add('light-mode');
        if (themeToggle) themeToggle.checked = true;
    } else {
        body.classList.remove('light-mode');
        if (themeToggle) themeToggle.checked = false;
    }

    if (themeToggle) {
        themeToggle.addEventListener('change', function() {
            if (this.checked) {
                body.classList.add('light-mode');
                localStorage.setItem('theme', 'light');
            } else {
                body.classList.remove('light-mode');
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    // 3. Load tasks from backend immediately
    fetchTasks();
});

// --- API CALLS TO SPRING BOOT ---

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
}
 
// 1. Fetch all tasks 
async function fetchTasks() {
    try {
        // THE FIX: Add a timestamp to the URL so the browser CANNOT cache the old list
        const timestamp = new Date().getTime();
        const url = `${API_BASE_URL}?t=${timestamp}`;

        const response = await fetch(url, { 
            method: 'GET',
            headers: getHeaders(),
            cache: 'no-store' // Double protection against caching
        });
        
        if (response.status === 401 || response.status === 403) {
            localStorage.clear();
            window.location.href = 'login.html';
            return;
        }

        const payload = await response.json();
        allTasks = payload.data || []; // SAVE TO GLOBAL ARRAY HERE
        renderTasks(allTasks);
        
        // const payload = await response.json();
        // const tasks = payload.data || []; 
        // renderTasks(tasks);
    } catch (error) {
        console.error('Failed to fetch tasks:', error);
    }
}

// 2. Create a new task
// --- BULLETPROOF CREATE TASK LOGIC ---
const btnSaveTask = document.getElementById('btnSaveTask');

if (btnSaveTask) {
    btnSaveTask.addEventListener('click', async function() {
        const titleInput = document.getElementById('newTitle');
        const descInput = document.getElementById('newDesc');
        const dateInput = document.getElementById('newDate');
        const priorityInput = document.getElementById('newPriority');

        if (!titleInput.value.trim()) {
            alert("Please enter a Task Title!");
            return;
        }

        const newTask = {
            title: titleInput.value.trim(),
            description: descInput.value.trim(),
            dueDate: dateInput.value ? dateInput.value : null,
            priority: priorityInput.value.toUpperCase(),
            completed: false
        };

        // 1. Change button text so you know it's working
        btnSaveTask.innerHTML = "Saving...";
        btnSaveTask.disabled = true;

        try {
            // 2. Save to Spring Boot Database
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(newTask)
            });

            if (response.ok) {
                // 3. Clear the inputs
                titleInput.value = '';
                descInput.value = '';
                dateInput.value = '';
                priorityInput.value = 'MEDIUM';

                // 4. AWAIT the fresh list from the database BEFORE switching screens
                await fetchTasks();
                
                // 5. Finally, switch back to the dashboard (it will now have the new task!)
                switchView('dashboardView');
            } else {
                alert("Failed to create task. Check backend console.");
            }
        } catch (error) {
            console.error('Network Error:', error);
        } finally {
            // Reset button state
            btnSaveTask.innerHTML = "Create Task";
            btnSaveTask.disabled = false;
        }
    });
}
// 3. Update task status (Mark as Done)
async function updateTaskStatus(taskId, currentCompletedStatus) {
    const newCompletedStatus = !currentCompletedStatus; // Toggle boolean
    
    try {
        // FIX: Send PUT request to /api/tasks (no ID in URL) and put ID in the body
        const response = await fetch(API_BASE_URL, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ 
                id: taskId, 
                completed: newCompletedStatus 
            })
        });

        if (response.ok) {
            fetchTasks(); 
        }
    } catch (error) {
        console.error('Failed to update task:', error);
    }
}

// 4. Delete a task
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        // DELETE still expects the ID in the URL based on your TaskController
        const response = await fetch(`${API_BASE_URL}/${taskId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (response.ok) {
            fetchTasks(); 
            switchView('dashboardView'); 
        }
    } catch (error) {
        console.error('Failed to delete task:', error);
    }
}

// --- UI RENDERING ---

function renderTasks(tasks) {
    const taskListContainer = document.querySelector('.task-list');
    taskListContainer.innerHTML = ''; 

    if (tasks.length === 0) {
        taskListContainer.innerHTML = '<p style="text-align:center; color: var(--text-secondary); margin-top: 20px;">No tasks found. Create one!</p>';
        return;
    }

    tasks.forEach(task => {
        // FIX: Check boolean 'completed' instead of string 'status'
        const isCompleted = task.completed === true; 
        const badgeClass = task.priority === 'HIGH' ? 'badge-high' : 'badge-completed';
        
        const cardHTML = `
            <div class="task-card" style="${isCompleted ? 'opacity: 0.6;' : ''}">
                <div class="task-details">
                    <h4>
                        ${isCompleted ? `<del>${task.title}</del>` : task.title} 
                        <span class="badge ${badgeClass}">${task.priority}</span>
                    </h4>
                    <p>${isCompleted ? `<del>${task.description || ''}</del>` : (task.description || '')}</p>
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">
                        Due: ${task.dueDate || 'No date'}
                    </span>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    ${isCompleted 
                        ? `<span class="badge badge-completed"><i class="fas fa-check-circle"></i> Done</span>` 
                        : `<button class="btn btn-outline" style="color: var(--primary-color);" onclick="updateTaskStatus(${task.id}, ${task.completed})">Mark Done</button>`
                    }
                    <button class="btn btn-outline" onclick="openEditView(${task.id})">Edit</button>
                    <button class="btn btn-outline" style="color: var(--accent-danger); border-color: var(--accent-danger);" onclick="deleteTask(${task.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        taskListContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// --- VIEW SWITCHER ---
function switchView(viewId) {
    document.querySelectorAll('.task-view').forEach(view => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');

    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    if (viewId === 'dashboardView') {
        document.getElementById('nav-my-tasks').classList.add('active');
    }
}

// --- EDIT TASK LOGIC ---

// 1. Open the view and pre-fill the inputs
function openEditView(taskId) {
    // Find the task in our global array
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    // Remember the ID for when we click 'Update'
    currentEditTaskId = taskId; 

    // Pre-fill the form with the task's existing data
    document.getElementById('editTitle').value = task.title || '';
    document.getElementById('editDesc').value = task.description || '';
    document.getElementById('editDate').value = task.dueDate || '';
    document.getElementById('editPriority').value = task.priority || 'MEDIUM';
    document.getElementById('editCompleted').checked = task.completed || false;

    // Switch to the Edit screen
    switchView('editTaskView');
}

// 2. Handle the "Update Task" button click
const btnUpdateTask = document.getElementById('btnUpdateTask');
if (btnUpdateTask) {
    btnUpdateTask.addEventListener('click', async function() {
        const titleInput = document.getElementById('editTitle').value.trim();
        
        if (!titleInput) {
            alert("Please enter a Task Title!");
            return;
        }

        // Build the updated task payload (Must include the ID!)
        const updatedTask = {
            id: currentEditTaskId, 
            title: titleInput,
            description: document.getElementById('editDesc').value.trim(),
            dueDate: document.getElementById('editDate').value ? document.getElementById('editDate').value : null,
            priority: document.getElementById('editPriority').value.toUpperCase(),
            completed: document.getElementById('editCompleted').checked
        };

        btnUpdateTask.innerHTML = "Updating...";
        btnUpdateTask.disabled = true;

        try {
            const response = await fetch(API_BASE_URL, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(updatedTask)
            });

            if (response.ok) {
                await fetchTasks(); // Get fresh data
                switchView('dashboardView'); // Go back to main screen
            } else {
                alert("Failed to update task.");
            }
        } catch (error) {
            console.error('Update Error:', error);
        } finally {
            btnUpdateTask.innerHTML = "Update Task";
            btnUpdateTask.disabled = false;
        }
    });
}

// 3. Handle the "Delete" button inside the Edit View
const btnDeleteTaskFromEdit = document.getElementById('btnDeleteTaskFromEdit');
if (btnDeleteTaskFromEdit) {
    btnDeleteTaskFromEdit.addEventListener('click', function() {
        if (currentEditTaskId) {
            deleteTask(currentEditTaskId);
        }
    });
}

// Wire up the Create Task button securely
//document.getElementById('submitNewTaskBtn').addEventListener('click', createTask);

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}