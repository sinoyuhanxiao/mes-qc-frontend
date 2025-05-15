// utils/compareFormChanges.js

export function getChangedFields(originalData, updatedData) {
    const changes = [];

    for (const key in updatedData) {
        if (updatedData.hasOwnProperty(key)) {
            const originalValue = originalData[key];
            const updatedValue = updatedData[key];
            if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
                changes.push({ key, originalValue, updatedValue });
            }
        }
    }

    return changes;
}

export function getLabelMapFromTemplate(templateJson) {
    const labelMap = {};

    function traverse(widgets) {
        widgets.forEach(widget => {
            if (widget.formItemFlag && widget.options?.name && widget.options?.label) {
                labelMap[widget.options.name] = widget.options.label;
            }
            if (widget.widgetList) traverse(widget.widgetList);
            if (widget.cols) {
                widget.cols.forEach(col => {
                    if (col.widgetList) traverse(col.widgetList);
                });
            }
        });
    }

    traverse(templateJson.widgetList || []);
    return labelMap;
}
