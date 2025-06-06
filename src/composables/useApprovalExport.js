// 📁 src/composables/useApprovalExport.js
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { formatDate } from '@/utils/task-center/dateFormatUtils'
import { APPROVAL_STATE_LABELS } from '@/utils/constants/approvalStates'
import { FLOW_TYPE_LABELS } from '@/utils/constants/flowTypes'

export function useApprovalExport() {
    // Excel 导出函数
    const exportToExcel = (assignments) => {
        const data = assignments.map(item => ({
            ID: item.id,
            表单名称: item.qc_form_template_name,
            审批流程: FLOW_TYPE_LABELS[item.approval_type] || item.approval_type,
            当前状态: APPROVAL_STATE_LABELS[item.state] || item.state,
            产生时间: formatDate(item.created_at),
        }))

        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, '审批记录')

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
        saveAs(blob, '审批记录.xlsx')
    }

    // PDF 导出函数
    const exportToPDF = (assignments) => {
        const pdf = new jsPDF()
        const tableData = assignments.map(item => [
            item.id,
            item.qc_form_template_name,
            FLOW_TYPE_LABELS[item.approval_type] || item.approval_type,
            APPROVAL_STATE_LABELS[item.state] || item.state,
            formatDate(item.created_at)
        ])

        autoTable(pdf, {
            head: [['ID', '表单名称', '审批流程', '当前状态', '产生时间']],
            body: tableData
        })

        pdf.save('审批记录.pdf')
    }

    return {
        exportToExcel,
        exportToPDF
    }
}
