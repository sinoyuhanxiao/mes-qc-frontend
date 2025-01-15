import dayjs from "dayjs";

// Utility function to determine if the task is false (not usable)
function isTaskNotUsable(dueDate) {
    if (!dueDate) {
        return true; // If no due date, the task is not usable
    }

    const now = dayjs();
    const due = dayjs(dueDate);

    // Condition 1: Check if overdue
    const isOverdue = due.isBefore(now);

    // Condition 2: Check if it's a future 30-minute task
    const isFuture30Minutes = due.diff(now, "minute") > 30;

    // The task is not usable if it's either overdue or a future 30-minute task
    return isOverdue || isFuture30Minutes;
}

export default isTaskNotUsable;
