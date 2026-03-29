<div align="center">

# 🧠 Smart Study Planner — Python Edition

### An AI-powered study planner built **100% in Python** using real DSA algorithms, Flask MVVM architecture, and a premium dark UI.

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite&logoColor=white)](https://sqlite.org/)
[![JWT](https://img.shields.io/badge/Auth-JWT-FB015B?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![SQLAlchemy](https://img.shields.io/badge/ORM-SQLAlchemy-D71F00?logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![License](https://img.shields.io/badge/License-MIT-818cf8)](LICENSE)

<br/>

**[🌐 Live App](http://localhost:3000)** · **[📄 Report Bug](https://github.com/yashlanke44/Smart-Study-Planner/issues)** · **[💡 Request Feature](https://github.com/yashlanke44/Smart-Study-Planner/issues)**

</div>

---

## 📸 Preview

<div align="center">
  <img src="screenshots/landing.png" alt="Landing Page" width="80%"/>
  <br/><br/>
  <img src="screenshots/modules.png" alt="Study Modules" width="80%"/>
</div>

---

## ✨ Key Features

| Feature | Description | Python Implementation |
|---------|-------------|----------------------|
| 🎯 **AI Schedule Generation** | Multi-algorithm pipeline optimises study timetables | `heapq`, `collections.deque`, backtracking DP |
| 📊 **Real-Time Analytics** | Study trends, SMA over sessions, Canvas charts | Sliding Window with `deque` |
| 🗂️ **Task Management** | Full CRUD with filters, sorting and tagging | SQLAlchemy ORM, indexed queries |
| 🔀 **Dependency Ordering** | Respects prerequisite chains | Kahn's BFS with `defaultdict` |
| ⏰ **Deadline Scheduling** | Greedy nearest-deadline selection | Python `sorted()` with `datetime` keys |
| 🔍 **Slot Allocation** | Available study window lookup | Classic binary search |
| 📈 **Productivity Insights** | Heuristic AI tips from session history | SMA trend analysis |
| 🔐 **Secure Auth** | JWT cookie-based session management | `Flask-JWT-Extended` + `bcrypt` |
| 🗄️ **Persistent Storage** | SQLite via SQLAlchemy ORM | `Flask-SQLAlchemy` |
| 📱 **Responsive UI** | Mobile & Laptop device selector | Jinja2 templates, CSS Grid |

---

## 🏛️ Architecture — Python MVVM with Flask

```
smart-study-planner/
├── app.py                      ← Flask Application (ViewModel Layer)
│                                 All routes = ViewModels (business logic + state)
├── config.py                   ← Configuration
├── requirements.txt
├── models/                     ← Model Layer (pure Python, zero UI coupling)
│   ├── __init__.py
│   ├── database.py             ← SQLAlchemy db instance
│   ├── user.py                 ← User + StudySession models (bcrypt)
│   ├── task.py                 ← Task model (urgency_score property)
│   └── scheduler.py            ← ALL 6 DSA algorithms in Python ⭐
├── templates/                  ← View Layer (Jinja2 templates)
│   ├── base.html               ← Base template (canvas, fonts, toasts)
│   ├── index.html              ← Landing page + Auth modal
│   └── dashboard.html          ← Full app: tasks, scheduler, analytics
└── static/
    ├── css/style.css           ← Premium dark design system
    └── js/app.js               ← Minimal JS (canvas + toasts ONLY)
```

### Python MVVM Data Flow
```
HTTP Request
    ↓
Flask Route (ViewModel) ← app.py
    ↓           ↑
SQLAlchemy Model    DSA Algorithms
  user.py           scheduler.py
  task.py
    ↓
Jinja2 Template (View)
    ↓
HTTP Response → Browser
```

---

## 🐍 Python DSA Engine — `models/scheduler.py`

All scheduling intelligence is implemented in pure Python:

### 1. Min-Heap (Priority Queue) — `heapq`
```python
import heapq

class MinHeap:
    def push(self, task):
        heapq.heappush(self._heap, (-task['urgency_score'], task['id'], task))
    def pop(self):
        _, _, task = heapq.heappop(self._heap)
        return task
```
**Complexity**: O(log n) insert/extract · Used for urgency-first task ordering

### 2. Topological Sort (Kahn's BFS) — `collections.deque`
```python
from collections import deque, defaultdict

def topological_sort(tasks, dependencies):
    queue = deque([tid for tid in task_ids if in_degree[tid] == 0])
    while queue:
        node = queue.popleft()
        for neighbor in adj[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
```
**Complexity**: O(V + E) · Handles prerequisite chains

### 3. Greedy EDF (Earliest Deadline First)
```python
def earliest_deadline_first(tasks):
    has_deadline.sort(key=lambda t: datetime.fromisoformat(t['deadline']))
    return has_deadline + no_deadline
```
**Complexity**: O(n log n) · Nearest-deadline-first greedy selection

### 4. Dynamic Programming (0/1 Knapsack)
```python
def knapsack_schedule(tasks, time_budget_hrs):
    dp = [[0] * (W + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for w in range(W + 1):
            if weights[i-1] <= w:
                dp[i][w] = max(dp[i-1][w], dp[i-1][w-weights[i-1]] + values[i-1])
    # Backtrack...
```
**Complexity**: O(n × W) · Maximises task value within time budget

### 5. Binary Search — Time Slot Allocation
```python
def find_available_slot(slots, target_hours):
    lo, hi = 0, len(slots) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if slots[mid] >= target_hours: result = mid; hi = mid - 1
        else: lo = mid + 1
    return result
```
**Complexity**: O(log n) · Finds best available study window

### 6. Sliding Window SMA — Productivity Analytics
```python
from collections import deque

def sliding_window_sma(sessions, window=7):
    deq = deque()
    for duration in durations:
        window_sum += duration; deq.append(duration)
        if len(deq) > window: window_sum -= deq.popleft()
        sma.append(window_sum / len(deq))
```
**Complexity**: O(n) · 7-day Simple Moving Average for trend analysis

### Master Scheduler Pipeline
```python
def generate_schedule(tasks, time_budget_hrs=8.0, dependencies=None):
    selected = knapsack_schedule(tasks, time_budget_hrs)   # Step 1: DP
    topo     = topological_sort(selected, deps)             # Step 2: BFS
    edf      = earliest_deadline_first(topo)                # Step 3: Greedy
    final    = heap_schedule(edf)                           # Step 4: Heap
    return { 'schedule': final, 'algorithm': 'Knapsack → Topo Sort → EDF → Min-Heap' }
```

---

## 🚀 Getting Started

### Prerequisites
- **Python** 3.10+ ([Download](https://python.org/))
- **pip** (comes with Python)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yashlanke44/Smart-Study-Planner.git
cd Smart-Study-Planner

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate      # macOS/Linux
# venv\Scripts\activate       # Windows

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Run the Flask server
python app.py

# 5. Open in browser
# → http://localhost:3000
```

### Environment Variables (Optional)
```env
SECRET_KEY=your-flask-secret
JWT_SECRET_KEY=your-jwt-secret
PORT=3000
FLASK_DEBUG=true
```

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--accent-primary` | `#818cf8` Indigo | Primary actions |
| `--accent-secondary` | `#34d399` Emerald | Success, completed |
| `--accent-cyan` | `#22d3ee` Cyan | Highlights |
| `--accent-warning` | `#fbbf24` Amber | Warnings, streaks |
| `--accent-danger` | `#f87171` Rose | Errors, overdue |
| `--accent-pink` | `#f472b6` Pink | Charts, analytics |
| `--bg-primary` | `#09090b` | Page background |
| `--font-main` | `Inter` | UI text |
| `--font-mono` | `JetBrains Mono` | Code, metrics |

---

## 🧪 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Language** | Python 3.10+ |
| **Web Framework** | Flask 3.0 |
| **ORM** | Flask-SQLAlchemy |
| **Database** | SQLite |
| **Authentication** | Flask-JWT-Extended + bcrypt |
| **Templates** | Jinja2 |
| **Frontend** | Minimal Vanilla JS (canvas + toasts only) |
| **Styling** | CSS3 (Glassmorphism, Neon animations) |
| **Architecture** | MVVM (Flask Routes = ViewModel) |

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built 100% in Python 🐍 by [@yashlanke44](https://github.com/yashlanke44)**

*Real algorithms. Real data persistence. Zero JavaScript business logic.*

</div>
