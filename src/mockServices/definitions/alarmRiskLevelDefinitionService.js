// mockServices/definitions/alarmRiskLevelDefinitionService.js

export const getAllAlarmRiskLevels = () => {
    return Promise.resolve({
        data: [
            { id: 1, name: "高风险", description: "风险等级高" },
            { id: 2, name: "中风险", description: "风险等级中" },
            { id: 3, name: "低风险", description: "风险等级低" }
        ]
    });
};
