import dayjs from "dayjs";

// Utility function to determine if the task is usable
function isTaskUsable(dueDate, dispatchedTaskStateId) {
    if (!dueDate) {
        return false; // If no due date, the task is not usable
    }

    const now = dayjs();
    const due = dayjs(dueDate);

    // Condition 1: Check if not overdue
    const isNotOverdue = !due.isBefore(now);

    // Condition 2: Check if not a future 30-minute task
    const isWithin30Minutes = due.diff(now, "minute") <= 60;

    // Condition 3: Check if dispatched_task_state_id is 4, 5, or 3
    const isDuable = [1, 2].includes(dispatchedTaskStateId);

    // The task is usable only if all conditions are true
    return isNotOverdue && isWithin30Minutes && isDuable;
}

export default isTaskUsable;
