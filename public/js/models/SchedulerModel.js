/* ═══════════════════════════════════════════════════
   MODEL: SchedulerModel
   DSA Algorithm implementations — pure computation
   Priority Queue, Topological Sort, Greedy, DP,
   Binary Search
   ═══════════════════════════════════════════════════ */

class SchedulerModel {
  constructor() {
    this.lastSchedule = JSON.parse(localStorage.getItem('ssp_schedule') || 'null');
  }

  saveSchedule(schedule, algorithm) {
    this.lastSchedule = {
      schedule, algorithm,
      generatedAt: new Date().toISOString()
    };
    localStorage.setItem('ssp_schedule', JSON.stringify(this.lastSchedule));
  }

  getLastSchedule() { return this.lastSchedule; }

  // ═══════════════════════════════════════════════
  // PRIORITY QUEUE — Min-Heap Implementation
  // O(log n) insert, O(log n) extract-min
  // ═══════════════════════════════════════════════
  static PriorityQueue = class {
    constructor() { this.heap = []; }
    _parent(i) { return Math.floor((i - 1) / 2); }
    _left(i) { return 2 * i + 1; }
    _right(i) { return 2 * i + 2; }
    _swap(i, j) { [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]]; }

    insert(item) {
      this.heap.push(item);
      let i = this.heap.length - 1;
      while (i > 0 && this.heap[i].score < this.heap[this._parent(i)].score) {
        this._swap(i, this._parent(i));
        i = this._parent(i);
      }
    }

    extractMin() {
      if (this.heap.length === 0) return null;
      const min = this.heap[0];
      this.heap[0] = this.heap[this.heap.length - 1];
      this.heap.pop();
      this._heapifyDown(0);
      return min;
    }

    _heapifyDown(i) {
      let smallest = i;
      const l = this._left(i), r = this._right(i);
      if (l < this.heap.length && this.heap[l].score < this.heap[smallest].score) smallest = l;
      if (r < this.heap.length && this.heap[r].score < this.heap[smallest].score) smallest = r;
      if (smallest !== i) { this._swap(i, smallest); this._heapifyDown(smallest); }
    }

    isEmpty() { return this.heap.length === 0; }
    size() { return this.heap.length; }
  };

  // ═══════════════════════════════════════════════
  // TASK VALUE SCORING
  // ═══════════════════════════════════════════════
  static calcValue(task) {
    const daysUntil = Math.ceil((new Date(task.deadline) - new Date()) / 86400000);
    const urgency = Math.max(1, 10 - daysUntil);
    const priorityScore = (5 - task.priority) * 3;
    const diffBonus = task.difficulty === 'hard' ? 2 : task.difficulty === 'medium' ? 1 : 0;
    return urgency + priorityScore + diffBonus;
  }

  // ═══════════════════════════════════════════════
  // ALGORITHM: Priority Queue Scheduling
  // ═══════════════════════════════════════════════
  static schedulePQ(tasks) {
    const pq = new SchedulerModel.PriorityQueue();
    const steps = [];

    steps.push({ text: '🔧 Building min-heap from tasks...', status: 'processing' });
    tasks.forEach(t => {
      const score = -SchedulerModel.calcValue(t); // negate for max-priority
      pq.insert({ ...t, score });
    });
    steps.push({ text: `📊 Heap built with ${pq.size()} nodes`, status: 'done' });

    const ordered = [];
    while (!pq.isEmpty()) {
      const item = pq.extractMin();
      ordered.push(item);
      steps.push({ text: `   Extract: "${item.name}" (score: ${-item.score})`, status: 'done' });
    }
    return { ordered, steps };
  }

  // ═══════════════════════════════════════════════
  // ALGORITHM: Topological Sort — Kahn's BFS
  // O(V + E)
  // ═══════════════════════════════════════════════
  static scheduleTopoSort(tasks) {
    const steps = [];
    const graph = new Map();
    const inDegree = new Map();
    const byName = new Map();

    tasks.forEach(t => {
      graph.set(t.id, []);
      inDegree.set(t.id, 0);
      byName.set(t.name.toLowerCase(), t.id);
    });

    steps.push({ text: '🔗 Building dependency graph (DAG)...', status: 'processing' });

    tasks.forEach(t => {
      (t.prerequisites || []).forEach(prereq => {
        const pid = byName.get(prereq.toLowerCase());
        if (pid && graph.has(pid)) {
          graph.get(pid).push(t.id);
          inDegree.set(t.id, (inDegree.get(t.id) || 0) + 1);
        }
      });
    });

    steps.push({ text: '📊 Computing in-degrees...', status: 'processing' });
    steps.push({ text: '🔄 Running Kahn\'s BFS algorithm...', status: 'processing' });

    const queue = [];
    inDegree.forEach((deg, id) => { if (deg === 0) queue.push(id); });

    const result = [];
    while (queue.length > 0) {
      const curr = queue.shift();
      const task = tasks.find(t => t.id === curr);
      if (task) {
        result.push(task);
        steps.push({ text: `   Order: "${task.name}" (prereqs satisfied)`, status: 'done' });
      }
      (graph.get(curr) || []).forEach(nb => {
        inDegree.set(nb, inDegree.get(nb) - 1);
        if (inDegree.get(nb) === 0) queue.push(nb);
      });
    }

    // Add remaining (unconnected / cyclic)
    tasks.forEach(t => { if (!result.find(r => r.id === t.id)) result.push(t); });

    return { ordered: result, steps };
  }

  // ═══════════════════════════════════════════════
  // ALGORITHM: Greedy — Earliest Deadline First
  // O(n log n)
  // ═══════════════════════════════════════════════
  static scheduleGreedy(tasks) {
    const steps = [];
    steps.push({ text: '📅 Sorting by earliest deadline...', status: 'processing' });

    const ordered = [...tasks].sort((a, b) => {
      const diff = new Date(a.deadline) - new Date(b.deadline);
      return diff !== 0 ? diff : a.priority - b.priority;
    });

    ordered.forEach(t => {
      const days = Math.ceil((new Date(t.deadline) - new Date()) / 86400000);
      steps.push({ text: `   Select: "${t.name}" (${days}d remaining)`, status: 'done' });
    });

    return { ordered, steps };
  }

  // ═══════════════════════════════════════════════
  // ALGORITHM: Dynamic Programming — 0/1 Knapsack
  // O(n × W) where W = time slots
  // ═══════════════════════════════════════════════
  static scheduleDP(tasks, totalHours) {
    const steps = [];
    const n = tasks.length;
    const totalSlots = Math.floor(totalHours * 2);

    const items = tasks.map(t => ({
      task: t,
      weight: Math.ceil(t.duration * 2),
      value: SchedulerModel.calcValue(t)
    }));

    steps.push({ text: '🧮 Building DP table...', status: 'processing' });
    steps.push({ text: `📐 Table size: ${n} × ${totalSlots} slots`, status: 'processing' });
    steps.push({ text: '🔍 Solving knapsack subproblems...', status: 'processing' });

    // DP Table
    const dp = Array.from({ length: n + 1 }, () => new Array(totalSlots + 1).fill(0));
    for (let i = 1; i <= n; i++) {
      for (let w = 0; w <= totalSlots; w++) {
        dp[i][w] = dp[i - 1][w];
        if (items[i - 1].weight <= w) {
          dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - items[i - 1].weight] + items[i - 1].value);
        }
      }
    }

    // Backtrack
    const selected = [];
    let w = totalSlots;
    for (let i = n; i > 0; i--) {
      if (dp[i][w] !== dp[i - 1][w]) {
        selected.push(items[i - 1].task);
        w -= items[i - 1].weight;
      }
    }

    const ordered = selected.sort((a, b) => a.priority - b.priority);
    steps.push({ text: `✅ Optimal subset: ${ordered.length} tasks selected`, status: 'done' });
    ordered.forEach(t => steps.push({ text: `   Include: "${t.name}" (${t.duration}h)`, status: 'done' }));

    return { ordered, steps };
  }

  // ═══════════════════════════════════════════════
  // BINARY SEARCH — Find available time slots
  // O(log n)
  // ═══════════════════════════════════════════════
  static binarySearchSlot(schedule, targetTime) {
    let left = 0, right = schedule.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (schedule[mid].endTime <= targetTime) left = mid + 1;
      else right = mid - 1;
    }
    return left;
  }

  // ═══════════════════════════════════════════════
  // BUILD TIMELINE from ordered tasks
  // ═══════════════════════════════════════════════
  static buildTimeline(tasks, startTimeStr, totalHours, breakMinutes) {
    const schedule = [];
    const [h, m] = startTimeStr.split(':').map(Number);
    let current = new Date();
    current.setHours(h, m, 0, 0);
    const end = new Date(current.getTime() + totalHours * 3600000);

    for (const task of tasks) {
      if (current >= end) break;
      const taskEnd = new Date(Math.min(current.getTime() + task.duration * 3600000, end.getTime()));

      schedule.push({
        type: 'task', task,
        startTime: new Date(current),
        endTime: taskEnd,
        duration: task.duration
      });
      current = new Date(taskEnd);

      if (current < end) {
        const breakEnd = new Date(current.getTime() + breakMinutes * 60000);
        schedule.push({
          type: 'break',
          startTime: new Date(current),
          endTime: breakEnd,
          duration: breakMinutes / 60
        });
        current = breakEnd;
      }
    }
    return schedule;
  }
}

window.SchedulerModel = SchedulerModel;
