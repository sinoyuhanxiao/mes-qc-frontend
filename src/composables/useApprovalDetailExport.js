// 📁 src/composables/useApprovalDetailExport.js
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { formatDate } from '@/utils/task-center/dateFormatUtils'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import callAddFont from '@/assets/simfang.js'
import callAddBoldFont from '@/assets/simfang-bold.js'
import { useAlertHighlight } from '@/composables/useAlertHighlight'
const { getAlertTextColor, getStyledValueWithIcon, getAlertTooltip } = useAlertHighlight(true)

const excludedKeys = ['exceeded_info', 'approval_info', 'version_group_id', 'version', 'approver_updated_at']; // set the excluded key in uncategorized in here

const relatedFieldTitleMap = {
    related_products: '涉及产品',
    related_batches: '涉及批次',
    related_inspectors: '质检人员',
    related_shifts: '所属班次',
    related_teams: '所属班组'
}

export function useApprovalDetailExport() {
    const exportApprovalAndRecordsToExcel = async (records, approvalRecords, qcFormTemplateName) => {
        const workbook = XLSX.utils.book_new()

        // 🧾 1️⃣ Sheet 1: 质检记录
        const cleanRecords = records.map(record => {
            const clean = { ...record }

            // 提取前置字段
            const 提交时间 = record['提交时间']
            const 提交人 = record['提交人'] || record['created_by_name'] || '-'

            // 提取需要保留的 related 字段（非 *_id / *_ids）并翻译表头
            const relatedFields = {}
            for (const key of Object.keys(clean)) {
                if (
                    key.startsWith('related_') &&
                    !key.endsWith('_id') &&
                    !key.endsWith('_ids') &&
                    relatedFieldTitleMap[key]
                ) {
                    relatedFields[relatedFieldTitleMap[key]] = clean[key]
                }
            }

            // 删除所有相关字段
            for (const key of Object.keys(clean)) {
                if (key.startsWith('related_') || [
                    '_id', 'created_by', 'created_at', 'e-signature',
                    'version', 'approval_info', 'exceeded_info', 'version_group_id', 'approver_updated_at'
                ].includes(key)) {
                    delete clean[key]
                }
            }

            // 构造最终对象
            return {
                提交时间,
                提交人,
                ...Object.fromEntries(
                    Object.entries(clean).map(([key, value]) => {
                        if (Array.isArray(value)) {
                            return [key, value.join(', ')];
                        }
                        return [key, value];
                    })
                ),
                ...relatedFields
            }
        })
        const sheet1 = XLSX.utils.json_to_sheet(cleanRecords)

        // not working for setting the color, need the sheetjs pro https://docs.sheetjs.com/docs/csf/features/#cell-styles
        const range1 = XLSX.utils.decode_range(sheet1['!ref'])
        for (let C = range1.s.c; C <= range1.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C })
            if (sheet1[cellAddress]) {
                sheet1[cellAddress].s = { font: { bold: true } }
            }
        }
        XLSX.utils.book_append_sheet(workbook, sheet1, '质检记录')

        // 🧾 2️⃣ Sheet 2: 审批记录（带图像）
        const sheet2Rows = [
            ['审批人', '角色', '审批状态', '审批时间', '审批意见', '需要复检']
        ]

        for (const r of approvalRecords) {
            sheet2Rows.push([
                r.user_name,
                { submitter: '填报员', leader: '班长', supervisor: '主管' }[r.role] || r.role,
                { completed: '已完成', pending: '待操作', not_started: '未开始' }[r.status] || r.status,
                formatDate(r.timestamp),
                r.comments || '',
                r.suggest_retest ? '是' : '否',
            ])
        }

        const sheet2 = XLSX.utils.aoa_to_sheet(sheet2Rows)
        XLSX.utils.book_append_sheet(workbook, sheet2, '审批记录')

        // 📦 导出
        const excelBuffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array',
            cellStyles: true
        })
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
        saveAs(blob, `${qcFormTemplateName}_质检及审批记录.xlsx`)
    }

    const exportApprovalAndRecordsToPdf = async (
        allVersionData, // ✅ array of { groupedDetails, basicInfo, systemInfo }
        approvalRecords,
        qcFormTemplateName
    ) => {
        const doc = new jsPDF();
        callAddFont.apply(doc);
        callAddBoldFont.apply(doc);
        doc.setFont("simfang", "bold");

        let y = 10;
        const now = new Date().toLocaleString('zh-CN', { hour12: false });

        // 标题
        const title = `${qcFormTemplateName} - 质检审批详情报告`;
        const pageWidth = doc.internal.pageSize.getWidth();
        const textWidth = doc.getTextWidth(title);
        const x = (pageWidth - textWidth) / 2;
        doc.setFontSize(16);
        doc.text(title, x, y);
        y += 10;

        // 遍历所有版本记录
        for (let i = 0; i < allVersionData.length; i++) {
            const { groupedDetails, basicInfo, systemInfo, approvalInfo } = allVersionData[i];

            const versionTitle = i === 0 ? '当前版本' : `历史版本 ${i}`;
            doc.setFontSize(14);
            doc.setTextColor(i === 0 ? 180 : 0, i === 0 ? 0 : 90, i === 0 ? 0 : 140); // 当前版本红色，其余蓝色
            doc.text(versionTitle, 10, y);
            doc.setTextColor(0, 0, 0); // 重置为默认黑色，避免影响后续文字
            y += 10; // 保留更大底部间距

            // Grouped Details
            Object.entries(groupedDetails).forEach(([category, fields]) => {
                if (category === 'exceeded_info' || category === 'e-signature') return;

                const tableData = Object.entries(fields)
                    .filter(([key, val]) =>
                        !excludedKeys.includes(key) &&
                        val !== undefined &&
                        val !== null &&
                        val !== ''
                    )
                    .map(([key, value]) => {
                        const styledVal = getStyledValueWithIcon(value, groupedDetails.exceeded_info?.[key]);
                        const passedRange = groupedDetails.exceeded_info?.[key]
                            ? getAlertTooltip(groupedDetails, key, { removePrefix: true })
                            : '-';
                        return [key, styledVal, passedRange];
                    });

                if (tableData.length === 0) return;

                const sectionTitle = category === 'uncategorized' ? '通用信息' : category;

                doc.setFontSize(12);
                doc.text(sectionTitle, 10, y);
                y += 6;

                autoTable(doc, {
                    startY: y,
                    head: [['项目', '检测值', '标准范围']],
                    body: tableData,
                    theme: 'grid',
                    styles: { font: 'simfang', fontSize: 10 },
                    headStyles: {
                        font: 'simfang',
                        fontStyle: 'bold',
                        fontSize: 12,
                        fillColor: [0, 133, 164],
                        textColor: 255
                    },
                    didParseCell(data) {
                        if (data.section === 'body' && data.column.index === 1) {
                            const key = data.row.raw[0];
                            const color = getAlertTextColor(groupedDetails, key);
                            if (color) {
                                data.cell.styles.textColor = color;
                                data.cell.styles.fontStyle = 'bold';
                            }
                        }
                    }
                });

                y = doc.lastAutoTable.finalY + 10;
            });

            // Basic Info
            doc.setFontSize(13);
            doc.text('质检基础信息', 10, y);
            y += 6;
            autoTable(doc, {
                startY: y,
                head: [['字段', '内容']],
                body: [
                    ['涉及产品', basicInfo.涉及产品 || '-'],
                    ['涉及批次', basicInfo.涉及批次 || '-'],
                    ['质检人员', basicInfo.质检人员 || '-'],
                    ['所属班次', basicInfo.所属班次 || '-'],
                    ['所属班组', basicInfo.所属班组 || '-']
                ],
                theme: 'grid',
                styles: { font: 'simfang', fontSize: 10 },
                headStyles: {
                    font: 'simfang',
                    fontStyle: 'bold',
                    fontSize: 12,
                    fillColor: [0, 133, 164],
                    textColor: 255
                }
            });
            y = doc.lastAutoTable.finalY + 10;

            // System Info
            doc.setFontSize(13);
            doc.text('系统信息', 10, y);
            y += 6;
            autoTable(doc, {
                startY: y,
                head: [['字段', '内容']],
                body: [
                    ['提交人', systemInfo.提交人 || '-'],
                    ['提交时间', systemInfo.提交时间 || '-'],
                    ['提交单号', systemInfo.提交单号 || '-']
                ],
                theme: 'grid',
                styles: { font: 'simfang', fontSize: 10 },
                headStyles: {
                    font: 'simfang',
                    fontStyle: 'bold',
                    fontSize: 12,
                    fillColor: [0, 133, 164],
                    textColor: 255
                }
            });

            y = doc.lastAutoTable.finalY + 12;

            // 当前版本 e-signature 签名图像（如果有）
            if (groupedDetails?.['e-signature']) {
                const signatureImage = groupedDetails['e-signature'];
                const imgWidth = 80;
                const imgHeight = 30;

                const pageHeight = doc.internal.pageSize.getHeight();
                if (y + imgHeight + 20 > pageHeight) {
                    doc.addPage();
                    y = 10;
                }

                doc.setFontSize(13);
                doc.text('填报人签名', 10, y);
                y += 6;
                doc.addImage(signatureImage, 'PNG', 10, y, imgWidth, imgHeight);
                y += imgHeight + 12;
            }

            if (i < allVersionData.length - 1) {
                doc.addPage();
                y = 10;
            }
        }

        // Always new page for approval records fields
        doc.addPage();
        y = 10;
        doc.setFontSize(14);
        doc.text('审批记录', 10, y);

        y += 6;
        autoTable(doc, {
            startY: y,
            head: [['审批人', '角色', '状态', '审批时间', '意见', '是否复检']],
            body: approvalRecords.map(r => [
                r.user_name,
                { submitter: '填报员', leader: '班长', supervisor: '主管' }[r.role] || r.role,
                { completed: '已完成', pending: '待操作', not_started: '未开始' }[r.status] || r.status,
                r.timestamp || '-',
                r.comments || '',
                r.suggest_retest ? '是' : '否'
            ]),
            theme: 'grid',
            styles: { font: 'simfang', fontSize: 10 },
            headStyles: {
                font: 'simfang',
                fontStyle: 'bold',
                fontSize: 12,
                fillColor: [0, 133, 164],
                textColor: 255
            }
        });

        // Approval Signature Section:
        const signatureList = allVersionData[0]?.approvalInfo || [];

        if (signatureList.length > 0) {
            y = doc.lastAutoTable.finalY + 10;

            doc.setFontSize(14);
            doc.text('签字确认', 10, y);
            y += 8;

            const pageHeight = doc.internal.pageSize.getHeight();

            for (const item of signatureList) {
                if (!item['e-signature']) continue;

                const label = item.label || '-';
                const imageData = item['e-signature'];

                const imgWidth = 50;
                const imgHeight = 20;

                // ✅ 🧠 在渲染签名前判断是否需要分页
                if (y + imgHeight + 20 > pageHeight) {
                    doc.addPage();
                    y = 10;
                }

                // ✅ 渲染文字
                doc.setFontSize(11);
                doc.text(`${label}:`, 10, y + 5);

                // ✅ 渲染图像
                doc.addImage(imageData, 'PNG', 40, y, imgWidth, imgHeight);

                y += imgHeight + 12;
            }
        }

        // 📦 下载
        doc.save(`${qcFormTemplateName}_审批详情报告.pdf`);
    };

    return {
        exportApprovalAndRecordsToExcel,
        exportApprovalAndRecordsToPdf
    }
}
