// mockServices/alert/alertService.js

import Mock from 'mockjs';

/**
 * Fetch all alert records (mock data).
 * @returns {Promise} API response with list of alerts.
 */
export const getAllAlerts = () => {
    return Promise.resolve({
        data: Mock.mock({
            'data|55': [{
                'id|+1': 1,
                'product_name': '@cword(3,5)薯条',
                'batch_number': 'B@date("yyyyMMdd")',
                'form_name': '@ctitle(4, 7)',
                'inspection_item': '@cword(3,6)',
                'value|80-200': 1,
                'unit': '@pick(["mg/L", "ppm", "℃", "%", "mL"])',
                'standard_min|80-100': 1,
                'standard_max|150-200': 1,
                'exceed_status': '@pick(["超标", "正常"])',
                'risk_level': '@pick(["高风险", "中风险", "低风险"])',
                'inspector': '@cname',
                'reviewer': '@cname',
                'status': '@pick(["处理中", "已关闭"])',
                'alert_time': '@datetime("yyyy-MM-dd HH:mm:ss")',
                'alert_code': function() {
                    return `AL${Mock.Random.date('yyyyMMdd')}-${this.id}`;
                },
                'isEditing': false,
                'rpn': function() {
                    const rpn = Mock.Random.integer(1, 1000);
                    this.risk_level = rpn >= 200 ? '高风险' : rpn >= 100 ? '中风险' : '低风险';
                    return rpn;
                }
            }]
        }).data
    });
};
