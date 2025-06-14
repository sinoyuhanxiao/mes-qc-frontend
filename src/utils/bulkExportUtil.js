// utils/BulkExportUtil.js
import { parseFormDocument } from '@/utils/formUtils';
// import { getUserById } from '@/services/userService';
import JSZip from 'jszip';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import callAddFont from "@/assets/simfang.js"; // ✅ Regular Simfang font
import callAddBoldFont from "@/assets/simfang-bold.js";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import {useAlertHighlight} from '@/composables/useAlertHighlight'
const { getAlertTooltip, getAlertTextColor, getStyledValueWithIcon } = useAlertHighlight(true);

export function generateSingleRecordPdf({ formLabel, groupedDetails, basicInfo, systemInfo, eSignature, translate }) {
    const doc = new jsPDF();
    const excludedKeys = ['e-signature', 'exceeded_info', 'approval_info', 'version_group_id', 'version'];
    callAddFont.call(doc);
    callAddBoldFont.call(doc);
    doc.setFont("simfang", "bold");

    let y = 10;
    const title = `${formLabel}${translate('Export.titleSuffix')}`;
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = doc.getTextWidth(title);
    const x = (pageWidth - textWidth) / 2;
    doc.setFontSize(16);
    doc.text(title, x, y);
    y += 10;

    Object.entries(groupedDetails).forEach(([category, fields]) => {
        if (category === 'exceeded_info') return;

        const tableData = Object.entries(fields)
            .filter(([key, val]) =>
                !excludedKeys.includes(key) && val !== undefined && val !== null && val !== ""
            )
            .map(([key, value]) => {
                const styledVal = getStyledValueWithIcon(value, groupedDetails.exceeded_info?.[key]);
                const passedRange = groupedDetails.exceeded_info?.[key]
                    ? getAlertTooltip(groupedDetails, key, { removePrefix: true })
                    : "-";
                return [key, styledVal, passedRange];
            });

        if (tableData.length === 0) return;

        const sectionTitle = category === 'uncategorized'
            ? translate('FormDataSummary.recordTable.groupUncategorized')
            : category;

        doc.setFontSize(14);
        doc.text(sectionTitle, 10, y);
        y += 6;

        autoTable(doc, {
            startY: y,
            head: [translate('Export.tableHeadValidRange')],
            body: tableData,
            theme: "grid",
            styles: { font: "simfang", fontSize: 10 },
            headStyles: { font: "simfang", fontStyle: 'bold', fontSize: 12, fillColor: [0, 133, 164] },
            didParseCell: function (data) {
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

    doc.setFontSize(14);
    doc.text('质检基础信息', 10, y);
    y += 6;

    autoTable(doc, {
        startY: y,
        head: [translate('Export.tableHead')],
        body: [
            ["涉及产品", basicInfo.涉及产品 || translate('Export.fallback')],
            ["涉及批次", basicInfo.涉及批次 || translate('Export.fallback')],
            ["质检人员", basicInfo.质检人员 || translate('Export.fallback')],
            ["所属班次", basicInfo.所属班次 || translate('Export.fallback')],
            ["所属班组", basicInfo.所属班组 || translate('Export.fallback')]
        ],
        theme: "grid",
        styles: { font: "simfang", fontSize: 10 },
        headStyles: { font: "simfang", fontStyle: 'bold', fontSize: 12, fillColor: [0, 133, 164] },
    });

    y = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(14);
    doc.text(translate('Export.groupTitle'), 10, y);
    y += 6;

    autoTable(doc, {
        startY: y,
        head: [translate('Export.tableHead')],
        body: [
            // [translate('Export.systemInfo.submitter'), systemInfo.提交人 || translate('Export.fallback')],
            [translate('Export.systemInfo.submittedAt'), systemInfo.提交时间 || translate('Export.fallback')],
            [translate('Export.systemInfo.submissionId'), systemInfo.提交单号 || translate('Export.fallback')]
        ],
        theme: "grid",
        styles: { font: "simfang", fontSize: 10 },
        headStyles: { font: "simfang", fontStyle: 'bold', fontSize: 12, fillColor: [0, 133, 164] },
    });

    y = doc.lastAutoTable.finalY + 10;

    if (eSignature) {
        const imgWidth = 150;
        const imgHeight = 30; // height could be adjusted
        const pageHeight = doc.internal.pageSize.getHeight();

        if (y + imgHeight + 20 > pageHeight) {
            doc.addPage();
            y = 10;
        }

        doc.setFontSize(14);
        doc.text(translate('Export.signatureTitle'), 10, y);
        y += 10;

        doc.addImage(eSignature, 'PNG', 10, y, imgWidth, imgHeight);
        y += imgHeight + 10;
    }

    console.log(doc.getFontList());
    return doc;
}

export async function exportDocumentsToZip(documents, translate, onProgress) {
    const zip = new JSZip();

    for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        onProgress(i + 1, documents.length);
        await new Promise(resolve => setTimeout(resolve, 0));
        try {
            const submissionId = doc._id;
            const createdAt = new Date(doc.created_at);
            const formattedTime = createdAt.toLocaleString("zh-CN", {
                year: "numeric", month: "2-digit", day: "2-digit",
                hour: "2-digit", minute: "2-digit", second: "2-digit",
                hour12: false
            });
            const submitterName = "-" // await getUserById(doc.created_by).then(res => res.data?.data?.name || "-");

            const systemInfo = {
                提交单号: submissionId,
                提交时间: formattedTime,
                // 提交人: submitterName
            };

            const uncategorized = doc.uncategorized || {};
            const basicInfo = {
                涉及产品: uncategorized.related_products || '-',
                涉及批次: uncategorized.related_batches || '-',
                质检人员: uncategorized.related_inspectors || '-',
                所属班次: uncategorized.related_shifts || '-',
                所属班组: uncategorized.related_teams || '-'
            };

            const cleanedUncategorized = { ...uncategorized };
            for (const key of Object.keys(cleanedUncategorized)) {
                if (key.startsWith("related_") || key.startsWith("qc_form_template") || key === "approver_updated_at") {
                    delete cleanedUncategorized[key];
                }
            }

            const { groupedDetails, eSignature } = parseFormDocument({
                ...doc,
                submissionId: doc._id
            });

            if (groupedDetails.uncategorized) {
                groupedDetails.uncategorized = {
                    ...cleanedUncategorized
                };
            }

            let inspectorStr = Array.isArray(doc.uncategorized.related_inspectors)
                ? doc.uncategorized.related_inspectors.join('_')
                : String(doc.uncategorized.related_inspectors || '');
            const safeTemplateName = (doc.uncategorized.qc_form_template_name || 'unknown').trim().replace(/[\\/:*?"<>|]/g, '_');
            const safeInspectorStr = inspectorStr.trim().replace(/[\\/:*?"<>|]/g, '_');
            const docName = `${safeTemplateName}_${safeInspectorStr}_${formatDate(doc.created_at)}.pdf`;

            const pdf = generateSingleRecordPdf({
                formLabel: doc.uncategorized.qc_form_template_name || 'unknown',
                groupedDetails,
                basicInfo,
                systemInfo,
                eSignature,
                translate
            });

            const pdfBlob = pdf.output('blob');
            zip.file(docName, pdfBlob);
        } catch (err) {
            console.error(`❌ Failed to export doc with _id=${doc._id}`, err);
        }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, '质检汇总_pdf.zip');
}

// utils/BulkExportUtil.js 下方添加
export async function exportDocumentsToExcelZip(documents, translate, onProgress) {
    const zip = new JSZip();

    for (let i = 0; i < documents.length; i++) {

        const doc = documents[i];
        onProgress(i + 1, documents.length);
        await new Promise(resolve => setTimeout(resolve, 0));

        const { groupedDetails } = parseFormDocument({
            ...doc,
            submissionId: doc._id
        });

        const createdAt = new Date(doc.created_at);
        const formattedTime = createdAt.toLocaleString("zh-CN", {
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
            hour12: false
        });

        const systemInfo = {
            提交单号: doc._id,
            提交时间: formattedTime,
            // 提交用户: "-"
        };

        const uncategorized = doc.uncategorized || {};
        const basicInfo = {
            涉及产品: uncategorized.related_products || '-',
            涉及批次: uncategorized.related_batches || '-',
            质检人员: uncategorized.related_inspectors || '-',
            所属班次: uncategorized.related_shifts || '-',
            所属班组: uncategorized.related_teams || '-'
        };

        try {
            const {
                created_at,
                created_by,
                _id,
                'e-signature': signature,
                ...rest
            } = doc;

            const entries = Object.entries(rest);

            const normalFields = entries.filter(([key]) =>
                !key.startsWith('related_') &&
                !key.endsWith('_id') &&
                !key.endsWith('_ids') &&
                !key.endsWith('approval_info') &&
                !key.endsWith('version_group_id') &&
                !key.endsWith('version') &&
                !key.endsWith('exceeded_info')
            );

            const relatedFields = entries
                .filter(([key]) =>
                    key.startsWith('related_') &&
                    !key.endsWith('_id') &&
                    !key.endsWith('_ids')
                )
                .map(([key, value]) => {
                    let translatedKey = key;
                    if (key === 'related_products') translatedKey = '涉及产品';
                    else if (key === 'related_batches') translatedKey = '涉及批次';
                    else if (key === 'related_inspectors') translatedKey = '质检人员';
                    else if (key === 'related_shifts') translatedKey = '所属班次';
                    else if (key === 'related_teams') translatedKey = '所属班组';
                    return [translatedKey, value];
                });

            // 将所有字段展开为平铺结构
            const flatRow = {};

            flatRow[translate('Export.systemInfo.submittedAt')] = doc.created_at || "-";
            // flatRow[translate('Export.systemInfo.submitter')] = "-";

            // 展开 groupedDetails 的所有子字段
            Object.entries(groupedDetails).forEach(([category, fields]) => {
                if (typeof fields !== 'object' || fields === null) return;

                Object.entries(fields).forEach(([key, value]) => {
                    if (
                        key === 'e-signature' ||
                        key === 'approval_info' ||
                        key.startsWith('related_') ||
                        key.startsWith('qc_form_template') ||
                        key === 'version_group_id' ||
                        key === 'version' ||
                        key === 'exceeded_info'
                    ) return;

                    flatRow[key] = Array.isArray(value) ? value.join(', ') : value;
                });
            });

            // Basic Info
            Object.entries(basicInfo).forEach(([key, value]) => {
                flatRow[key] = value;
            });

            // System Info
            Object.entries(systemInfo).forEach(([key, value]) => {
                flatRow[key] = value;
            });

            const tableData = [flatRow];
            const headers = Object.keys(flatRow);

            const worksheet = XLSX.utils.json_to_sheet(tableData, { header: headers, skipHeader: false });
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "QC记录");


            const safeTemplateName = (doc.uncategorized?.qc_form_template_name || 'unknown').trim().replace(/[\\/:*?"<>|]/g, '_');
            const inspectorStr = Array.isArray(doc.uncategorized?.related_inspectors)
                ? doc.uncategorized.related_inspectors.join('_')
                : String(doc.uncategorized?.related_inspectors || '');
            const safeInspectorStr = inspectorStr.trim().replace(/[\\/:*?"<>|]/g, '_');

            const fileName = `${safeTemplateName}_${safeInspectorStr}_${formatDate(created_at)}.xlsx`;
            const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

            zip.file(fileName, excelBuffer);
        } catch (err) {
            console.error(`❌ Failed to export Excel for doc with _id=${doc._id}`, err);
        }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, '质检汇总_excel.zip');
}


function formatDate(isoStr) {
    try {
        const date = new Date(isoStr);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        const s = String(date.getSeconds()).padStart(2, '0');
        return `${y}${m}${d}_${h}${min}${s}`;
    } catch {
        return 'invalid_date';
    }
}
