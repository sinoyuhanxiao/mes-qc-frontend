import { Top, Bottom, WarningFilled } from '@element-plus/icons-vue'

export function useAlertHighlight(showAlerts) {
    const getAlertStyle = (row, field) => {
        if (!showAlerts.value) return {}

        const info = row.exceeded_info?.[field]
        if (!info || !info.result) return {}

        const colorMap = {
            high: '#F56C6C', // red
            low: '#409EFF',  // blue
            invalid: '#f8af3d' // orange
        }

        return {
            color: colorMap[info.result] || '',
            fontWeight: 'bold'
        }
    }

    const getAlertIcon = (row, field) => {
        if (!showAlerts.value) return null

        const result = row.exceeded_info?.[field]?.result
        const iconMap = {
            high: Top,
            low: Bottom,
            invalid: WarningFilled
        }
        return iconMap[result] || null
    }

    return { getAlertStyle, getAlertIcon }
}
