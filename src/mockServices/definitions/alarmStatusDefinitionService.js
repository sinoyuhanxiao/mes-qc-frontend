// mockServices/definitions/alarmStatusDefinitionService.js

export const getAllAlarmStatuses = () => {
    return Promise.resolve({
        data: [
            { id: 1, name: "处理中", description: "告警正在处理中" },
            { id: 2, name: "已关闭", description: "告警已处理关闭" }
        ]
    });
};
