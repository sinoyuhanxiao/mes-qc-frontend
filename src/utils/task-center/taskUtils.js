import dayjs from "dayjs";

// Utility function to determine if the task is false (not usable)
function isTaskNotUsable(dueDate, dispatchedTaskStateId) {
    if (!dueDate) {
        return true; // If no due date, the task is not usable
    }

    const now = dayjs();
    const due = dayjs(dueDate);

    // Condition 1: Check if overdue
    const isOverdue = due.isBefore(now);

    // Condition 2: Check if it's a future 30-minute task
    const isTooFarInFuture  = due.diff(now, "minute") > 30;

    // Condition 3: Check if dispatched_task_state_id is not 4, 5, or 3
    const isNotDuable = [4, 5, 3].includes(dispatchedTaskStateId);

    // The task is not usable if any of the conditions are true
    return isOverdue || isTooFarInFuture  || isNotDuable;
}

export default isTaskNotUsable;
