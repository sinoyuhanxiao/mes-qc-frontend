import dayjs from "dayjs";

export function cleanPayload(payload) {
    // Clone the payload to avoid mutating the original object
    const cleanedPayload = { ...payload };

    // Map 'dispatch_forms' to 'formIds'
    if (cleanedPayload.dispatch_forms) {
        cleanedPayload.formIds = cleanedPayload.dispatch_forms;
        delete cleanedPayload.dispatch_forms;
    }

    // Remove empty or null fields
    for (const key in cleanedPayload) {
        if (cleanedPayload[key] === "" || cleanedPayload[key] === null) {
            delete cleanedPayload[key];
        }
    }

    console.log("clean payload: " + cleanedPayload);

    return cleanedPayload;
}

// Extracts time in HH:mm format from different time structures
export function extractTimeOfDay(timeOfDay) {
    console.log("Received timeOfDay:", timeOfDay);

    if (!timeOfDay) {
        console.log("Returning null for missing timeOfDay");
        return null;
    }

    let date;

    if (timeOfDay instanceof Date) {
        date = timeOfDay;
    } else if (typeof timeOfDay === "string") {
        date = new Date(timeOfDay);
    } else if (timeOfDay._custom?.value) {
        date = new Date(timeOfDay._custom.value);
    } else {
        console.log("Invalid timeOfDay structure, returning null");
        return null;
    }

    const formattedTime = `${date.getHours().toString().padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

    console.log("Extracted timeOfDay:", formattedTime);
    return formattedTime;
}

// Formats a date string into "YYYY-MM-DD HH:mm:ss"
export function formatDate(dateString) {
    if (!dateString) return "-";
    return dayjs(dateString).format("YYYY-MM-DD HH:mm:ss");
}

// Formats the schedule type into human-readable Chinese text
export function formatScheduleType(type) {
    switch (type) {
        case "SCHEDULED":
            return "计划派发";
        case "MANUAL":
            return "手动派发";
        default:
            return "未知";
    }
}

export function generateFormMap(formNodes) {
    const formMap = {};

    function traverse(nodes) {
        nodes.forEach(node => {
            if (node.nodeType === "document") {
                formMap[node.id] = node.label;
            }
            if (node.children && node.children.length) {
                traverse(node.children);
            }
        });
    }

    traverse(formNodes);
    return formMap;
}