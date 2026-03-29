"""
SchedulerModel — Pure Python DSA Algorithms
============================================
All scheduling intelligence lives here. Zero UI dependency.
This module is the MVVM "Model" layer for AI scheduling.

Algorithms implemented:
  1. Min-Heap (Priority Queue)     — urgency-based ordering     O(n log n)
  2. Topological Sort (Kahn's BFS) — dependency-aware ordering  O(V + E)
  3. Greedy — Earliest Deadline First (EDF)                     O(n log n)
  4. Dynamic Programming (0/1 Knapsack)                         O(n * W)
  5. Binary Search                  — time-slot allocation       O(log n)
  6. Sliding Window                 — productivity trend SMA     O(n)
"""

import heapq
from collections import deque, defaultdict
from typing import List, Dict, Optional, Tuple
from datetime import datetime


# ═══════════════════════════════════════════════════════════════════
# 1.  MIN-HEAP  (Priority Queue)
#     Schedules tasks by urgency score. O(log n) insert/extract.
# ═══════════════════════════════════════════════════════════════════

class MinHeap:
    """
    Min-Heap backed by Python's heapq module.
    Stores (urgency_score, task_id, task_dict) tuples.
    """

    def __init__(self):
        self._heap: list = []

    def push(self, task: dict) -> None:
        score = task.get('urgency_score', 0)
        # Negate score → max-urgency first
        heapq.heappush(self._heap, (-score, task['id'], task))

    def pop(self) -> Optional[dict]:
        if self._heap:
            _, _, task = heapq.heappop(self._heap)
            return task
        return None

    def peek(self) -> Optional[dict]:
        return self._heap[0][2] if self._heap else None

    def __len__(self):
        return len(self._heap)

    @property
    def size(self) -> int:
        return len(self._heap)


def heap_schedule(tasks: List[dict]) -> List[dict]:
    """
    Build a Min-Heap from tasks and extract in urgency order.
    Returns task list sorted: highest urgency first.
    """
    heap = MinHeap()
    for t in tasks:
        if t.get('status') != 'completed':
            heap.push(t)
    result = []
    while len(heap):
        result.append(heap.pop())
    return result


# ═══════════════════════════════════════════════════════════════════
# 2.  TOPOLOGICAL SORT  (Kahn's BFS)
#     Handles prerequisite chains. O(V + E).
# ═══════════════════════════════════════════════════════════════════

def topological_sort(tasks: List[dict], dependencies: Dict[int, List[int]]) -> List[dict]:
    """
    Kahn's Algorithm (BFS-based topological sort).

    Args:
        tasks:        List of task dicts, each with 'id'.
        dependencies: { task_id: [prerequisite_ids] }

    Returns:
        Ordered task list respecting dependency constraints.
        Returns original order if a cycle is detected.
    """
    task_map = {t['id']: t for t in tasks}
    in_degree: Dict[int, int] = defaultdict(int)
    adj: Dict[int, List[int]] = defaultdict(list)

    for tid, prereqs in dependencies.items():
        for prereq in prereqs:
            adj[prereq].append(tid)
            in_degree[tid] += 1

    # Seed queue with tasks that have no prerequisites
    queue = deque([t['id'] for t in tasks if in_degree[t['id']] == 0])
    ordered: List[dict] = []

    while queue:
        node = queue.popleft()
        if node in task_map:
            ordered.append(task_map[node])
        for neighbor in adj[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    # Cycle guard — return original if not all tasks were processed
    if len(ordered) != len(tasks):
        return tasks
    return ordered


# ═══════════════════════════════════════════════════════════════════
# 3.  GREEDY — Earliest Deadline First (EDF)
#     Selects tasks greedily by nearest deadline. O(n log n).
# ═══════════════════════════════════════════════════════════════════

def earliest_deadline_first(tasks: List[dict]) -> List[dict]:
    """
    Greedy EDF scheduler.
    Tasks without a deadline are appended at the end.

    Returns tasks sorted by deadline (ascending), None deadlines last.
    """
    has_deadline = [t for t in tasks if t.get(
        'deadline') and t.get('status') != 'completed']
    no_deadline = [t for t in tasks if not t.get(
        'deadline') and t.get('status') != 'completed']

    def _parse_deadline(t: dict) -> datetime:
        dl = t['deadline']
        if isinstance(dl, str):
            return datetime.fromisoformat(dl.replace('Z', '+00:00'))
        return dl

    has_deadline.sort(key=_parse_deadline)
    return has_deadline + no_deadline


# ═══════════════════════════════════════════════════════════════════
# 4.  DYNAMIC PROGRAMMING — 0/1 Knapsack
#     Maximizes study value within a time budget. O(n × W).
# ═══════════════════════════════════════════════════════════════════

def knapsack_schedule(tasks: List[dict], time_budget_hrs: float) -> List[dict]:
    """
    0/1 Knapsack to select the highest-value subset of tasks
    that fit within the available study time budget.

    'value'  = urgency_score * 10 (rounded to int)
    'weight' = duration_hrs  * 10 (rounded to int, tenth-hour precision)

    Returns the optimal subset of tasks.
    """
    pending = [t for t in tasks if t.get('status') != 'completed']
    n = len(pending)
    W = int(time_budget_hrs * 10)   # convert to tenths-of-hour units

    if n == 0 or W == 0:
        return []

    # Build values and weights
    values = [int(t.get('urgency_score', 1) * 10) for t in pending]
    weights = [max(1, int(t.get('duration_hrs', 1) * 10)) for t in pending]

    # DP table: dp[i][w] = max value using first i items with capacity w
    dp = [[0] * (W + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for w in range(W + 1):
            dp[i][w] = dp[i - 1][w]
            if weights[i - 1] <= w:
                dp[i][w] = max(dp[i][w], dp[i - 1]
                               [w - weights[i - 1]] + values[i - 1])

    # Backtrack to find selected items
    selected: List[dict] = []
    w = W
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i - 1][w]:
            selected.append(pending[i - 1])
            w -= weights[i - 1]

    return list(reversed(selected))


# ═══════════════════════════════════════════════════════════════════
# 5.  BINARY SEARCH — Time Slot Allocation
#     Finds the first available slot in a sorted schedule. O(log n).
# ═══════════════════════════════════════════════════════════════════

def find_available_slot(slots: List[float], target_hours: float) -> int:
    """
    Binary search over a sorted list of available slot sizes.
    Returns the index of the first slot >= target_hours.
    Returns -1 if none found.

    Args:
        slots:        Sorted list of available slot durations (hrs).
        target_hours: Desired session duration.
    """
    lo, hi = 0, len(slots) - 1
    result = -1
    while lo <= hi:
        mid = (lo + hi) // 2
        if slots[mid] >= target_hours:
            result = mid
            hi = mid - 1
        else:
            lo = mid + 1
    return result


# ═══════════════════════════════════════════════════════════════════
# 6.  SLIDING WINDOW — Productivity Trend (7-day SMA)
#     Computes moving average of daily study minutes. O(n).
# ═══════════════════════════════════════════════════════════════════

def sliding_window_sma(sessions: List[dict], window: int = 7) -> List[float]:
    """
    Simple Moving Average using a sliding window of `window` days.
    Each entry in `sessions` must have 'duration_min'.

    Returns a list of SMA values (same length as sessions).
    Leading values use available data only.
    """
    durations = [s.get('duration_min', 0) for s in sessions]
    n = len(durations)
    sma = []
    window_sum = 0.0
    deq: deque = deque()

    for i in range(n):
        window_sum += durations[i]
        deq.append(durations[i])
        if len(deq) > window:
            window_sum -= deq.popleft()
        sma.append(round(window_sum / len(deq), 2))

    return sma


def productivity_insights(sessions: List[dict]) -> dict:
    """
    Derive productivity insights from session history.
    Uses Sliding Window SMA + basic heuristics.

    Returns a dict with:
      - sma_7d:          7-day moving average (minutes/day)
      - total_hours:     total study hours
      - best_day:        date with highest study time
      - avg_session:     average session duration
      - trend:           'improving' | 'declining' | 'stable'
      - suggestions:     list of actionable tip strings
    """
    if not sessions:
        return {
            'sma_7d': [], 'total_hours': 0, 'best_day': None,
            'avg_session': 0, 'trend': 'stable', 'suggestions': []
        }

    durations = [s.get('duration_min', 0) for s in sessions]
    total_min = sum(durations)
    sma = sliding_window_sma(sessions)

    # Trend: compare last-7 vs previous-7
    if len(sma) >= 14:
        recent = sum(sma[-7:]) / 7
        earlier = sum(sma[-14:-7]) / 7
        if recent > earlier * 1.10:
            trend = 'improving'
        elif recent < earlier * 0.90:
            trend = 'declining'
        else:
            trend = 'stable'
    else:
        trend = 'stable'

    # Best day
    best_idx = durations.index(max(durations))
    best_day = sessions[best_idx].get('date') if sessions else None

    # Suggestions (heuristic rule engine)
    suggestions = []
    avg = total_min / len(sessions) if sessions else 0
    if avg < 30:
        suggestions.append(
            'Try aiming for at least 30 min per session consistently.')
    if trend == 'declining':
        suggestions.append(
            'Your sessions have been shorter lately. Try the Pomodoro technique!')
    if trend == 'improving':
        suggestions.append(
            'Great momentum! Keep the streak going with consistent daily sessions.')
    if len(sessions) > 0 and max(durations) > 240:
        suggestions.append(
            'Long sessions detected. Remember to take 10-min breaks every hour.')
    if len(suggestions) == 0:
        suggestions.append(
            'You are on track! Review your hardest topics next session.')

    return {
        'sma_7d':      sma,
        'total_hours': round(total_min / 60, 2),
        'best_day':    str(best_day) if best_day else None,
        'avg_session': round(avg, 2),
        'trend':       trend,
        'suggestions': suggestions,
    }


# ═══════════════════════════════════════════════════════════════════
# MASTER SCHEDULER
# Combines all algorithms into one optimised plan.
# ═══════════════════════════════════════════════════════════════════

def generate_schedule(
    tasks: List[dict],
    time_budget_hrs: float = 8.0,
    dependencies: Optional[Dict[int, List[int]]] = None
) -> dict:
    """
    Master scheduling pipeline:
      1. Knapsack  → select best tasks within time budget
      2. Topo Sort → respect dependencies
      3. EDF       → sort by deadline
      4. Min-Heap  → final ordering by urgency score

    Returns:
        {
          'schedule':   ordered list of tasks,
          'algorithm':  which final algorithm dominated,
          'total_hrs':  total scheduled hours,
          'skipped':    tasks excluded by knapsack,
        }
    """
    deps = dependencies or {}

    # Step 1: Knapsack selection
    selected = knapsack_schedule(tasks, time_budget_hrs)
    skipped = [t for t in tasks if t.get('status') != 'completed' and t['id'] not in {
        s['id'] for s in selected}]

    # Step 2: Topological sort (dependency ordering)
    topo = topological_sort(selected, deps)

    # Step 3: EDF sort
    edf = earliest_deadline_first(topo)

    # Step 4: Final urgency-based heap pass
    final = heap_schedule(edf)

    total_hrs = sum(t.get('duration_hrs', 1) for t in final)

    return {
        'schedule':  final,
        'algorithm': 'Knapsack → Topological Sort → EDF → Min-Heap',
        'total_hrs': round(total_hrs, 2),
        'skipped':   skipped,
    }
