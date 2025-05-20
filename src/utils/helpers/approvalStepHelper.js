export const FLOW_STEP_MAP = {
    flow_1: ['填报员', '归档'],
    flow_2: ['填报员', '班长签字', '归档'],
    flow_3: ['填报员', '主管签字', '归档'],
    flow_4: ['填报员', '班长签字', '主管签字', '归档']
};

export function getStepsFromState(flow, state) {
    const titles = FLOW_STEP_MAP[flow] || [];
    let currentIndex = 0;

    // 模拟状态映射（你也可以从后端返回实际的状态）
    const stateToIndex = {
        pending: 0,
        pending_leader: 1,
        approved_leader: 2,
        pending_supervisor: flow === 'flow_3' ? 1 : 2,
        fully_approved: titles.length - 1,
        approved: titles.length - 1
    };

    if (state && stateToIndex[state] !== undefined) {
        currentIndex = stateToIndex[state];
    }

    return titles.map((title, index) => {
        if (index < currentIndex) return { title, status: 'success' };
        if (index === currentIndex) return { title, status: 'process' };
        return { title, status: 'wait' };
    });
}
