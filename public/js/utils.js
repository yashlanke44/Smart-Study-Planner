/* ═══════════════════════════════════════════════════
   MODEL: AboutModelData
   Pure static data for the about view
   ═══════════════════════════════════════════════════ */

window.AboutModelData = {
  dsaConcepts: [
    {
      icon: '🏔️', title: 'Priority Queue (Min-Heap)', complexity: 'O(log n) insert/extract',
      description: 'Used in AI Scheduler to select the most urgent and important task.',
      usage: `// Min-Heap
insert(task) → bubbleUp()
extractMin() → heapifyDown()`, where: 'Scheduler → PQ mode'
    },
    {
      icon: '🔗', title: 'Topological Sort (DAG)', complexity: 'O(V + E)',
      description: 'Kahn\'s algorithm to find linear ordering of task prerequisites.',
      usage: `// Kahn's Graph Sort
buildInDegreeMap()
queue.push(degZeroNodes)
bfs()`, where: 'Scheduler → Topological Sort'
    },
    {
      icon: '🤑', title: 'Greedy Algorithm', complexity: 'O(n log n)',
      description: 'Earliest Deadline First (EDF) scheduler approach.',
      usage: `// Greedy EDF
tasks.sort((a,b) => a.deadline - b.deadline)`, where: 'Scheduler → Greedy'
    },
    {
      icon: '🧮', title: 'Dynamic Programming', complexity: 'O(n × W)',
      description: '0/1 Knapsack problem for optimizing study time limits.',
      usage: `// 0/1 Knapsack
dp[i][w] = max(
  dp[i-1][w], 
  dp[i-1][w-wt] + val
)`, where: 'Scheduler → DP mode'
    },
    {
      icon: '🔍', title: 'Binary Search', complexity: 'O(log n)',
      description: 'Find time slot conflicts in the final schedule timeline.',
      usage: `// Binary Search
while(left <= right){
  mid = (left+right)/2
  ...
}`, where: 'Scheduler → Internal Timeline'
    },
    {
      icon: '🗺️', title: 'Hash Maps', complexity: 'O(1) lookup',
      description: 'Underlying data structure (Map) for O(1) task CRUD logic in TaskModel.',
      usage: `// Constant Lookups
taskMap.set(id, data);
taskMap.delete(id);`, where: 'Models → TaskModel'
    },
    {
      icon: '📈', title: 'Sliding Window', complexity: 'O(n)',
      description: 'Computes running moving average of focus hours across 14-day history.',
      usage: `// Sliding Window Avg
sum += data[i] - data[i-k]
res.push(sum/k)`, where: 'ViewModels → AnalyticsViewModel'
    }
  ],
  codeSnippets: [
    `class MinHeap {
  insert(item) {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }
}`,
    `function topoSort(graph) {
  const q = degZero()
  while(q.size) {
    let curr = q.shift()
    decrementNeighbors(curr)
  }
}`,
    `function SMA(data, k) {
  let sum = initSum(k)
  for(i=k; i<n; i++) {
    sum += data[i] - data[i-k]
    res.push(sum/k)
  }
}`
  ]
};

// ── Shared Utils ───────────────────────────────
window.Utils = {
  $: (sel) => document.querySelector(sel),
  $$: (sel) => document.querySelectorAll(sel),

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  animateCount(el, target, duration = 1200) {
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const inc = (target - start) / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
      current += inc;
      if ((inc >= 0 && current >= target) || (inc < 0 && current <= target) || inc === 0) {
        el.textContent = target;
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(current);
      }
    }, 16);
  },

  showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-fade-in`;
    toast.textContent = msg;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => {
      toast.classList.replace('animate-fade-in', 'animate-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  showConfetti() {
    for (let i = 0; i < 50; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.backgroundColor = ['#6C63FF', '#00C9A7', '#FFD93D', '#FF6B6B'][Math.floor(Math.random() * 4)];
      c.style.animationDuration = (Math.random() * 2 + 1) + 's';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 3000);
    }
  }
};
