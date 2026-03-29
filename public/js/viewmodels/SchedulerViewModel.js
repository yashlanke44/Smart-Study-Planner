/* ═══════════════════════════════════════════════════
   VIEWMODEL: SchedulerViewModel
   Connects SchedulerModel + TaskModel ↔ SchedulerView
   ═══════════════════════════════════════════════════ */

class SchedulerViewModel {
  constructor(taskModel, schedulerModel, view, toastFn) {
    this.tasks = taskModel;
    this.scheduler = schedulerModel;
    this.view = view;
    this.toast = toastFn;

    this.view.onGenerate(params => this.generateSchedule(params));
  }

  async generateSchedule({ hours, breakMin, startTime, algorithm }) {
    const pending = this.tasks.getPending();
    if (pending.length === 0) {
      this.toast('No pending tasks to schedule!', 'warning');
      return;
    }

    const algoName = this.view.getAlgoName(algorithm);
    this.view.showVisualization(algoName);

    await this.view.addStep('⏳ Initializing algorithm...', 'processing');
    await this.view.setProgress(10);

    let result;
    // Execute correct algorithm from pure Model
    switch (algorithm) {
      case 'priority-queue':
        result = window.SchedulerModel.schedulePQ(pending);
        break;
      case 'topological':
        result = window.SchedulerModel.scheduleTopoSort(pending);
        break;
      case 'greedy':
        result = window.SchedulerModel.scheduleGreedy(pending);
        break;
      case 'dp':
        result = window.SchedulerModel.scheduleDP(pending, hours);
        break;
      default:
        result = { ordered: pending, steps: [] };
    }

    // Playback visualization steps generated directly by Model
    const stepCount = result.steps.length;
    for (let i = 0; i < stepCount; i++) {
      const step = result.steps[i];
      await this.view.addStep(step.text, step.status);
      await this.view.setProgress(10 + Math.floor((i / stepCount) * 80));
    }

    await this.view.addStep('🔍 Building timeline with allocations...', 'processing');
    await this.view.setProgress(95);

    // Build timeline using pure function from Model
    const schedule = window.SchedulerModel.buildTimeline(result.ordered, startTime, hours, breakMin);

    await this.view.addStep(`📅 Schedule generated: ${schedule.length} time blocks`, 'done');
    await this.view.setProgress(100);
    await this.view.addStep('✅ Algorithm complete!', 'done');

    // Save final state conceptually in Model
    this.scheduler.saveSchedule(schedule, algorithm);

    // Output timeline to View
    this.view.renderTimeline(schedule);
    this.toast('Schedule optimized via AI!', 'success');
  }
}

window.SchedulerViewModel = SchedulerViewModel;
