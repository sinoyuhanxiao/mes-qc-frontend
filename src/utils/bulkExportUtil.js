// utils/BulkExportUtil.js
import { parseFormDocument } from '@/utils/parseFormDocument';
import { getUserById } from '@/services/personnelService';
import JSZip from 'jszip';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import callAddFont from "@/assets/simfang.js"; // ✅ Regular Simfang font
import callAddBoldFont from "@/assets/simfang-bold.js";
import { saveAs } from "file-saver";
import {useAlertHighlight} from '@/composables/useAlertHighlight'
const { getAlertTooltip, getAlertTextColor, getStyledValueWithIcon } = useAlertHighlight(true);

export function generateSingleRecordPdf({ formLabel, groupedDetails, basicInfo, systemInfo, eSignature, translate }) {
    const doc = new jsPDF({
        compress: true,
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        userUnit: 1,
        useCORS: true, // 启用 CORS 以防图片/字体跨域资源未加载
    });
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

        doc.setFont("simfang");
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
    doc.setFont("simfang");
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
    doc.setFont("simfang");
    autoTable(doc, {
        startY: y,
        head: [translate('Export.tableHead')],
        body: [
            [translate('Export.systemInfo.submitter'), systemInfo.提交人 || translate('Export.fallback')],
            [translate('Export.systemInfo.submittedAt'), systemInfo.提交时间 || translate('Export.fallback')],
            [translate('Export.systemInfo.submissionId'), systemInfo.提交单号 || translate('Export.fallback')]
        ],
        theme: "grid",
        styles: { font: "simfang", fontSize: 10 },
        headStyles: { font: "simfang", fontStyle: 'bold', fontSize: 12, fillColor: [0, 133, 164] },
    });

    y = doc.lastAutoTable.finalY + 10;

    const signatureImg = document.querySelector('img[alt="e-signature"]');
    if (signatureImg) {
        const imgWidth = 150;
        const aspectRatio = signatureImg.naturalWidth / signatureImg.naturalHeight;
        const imgHeight = imgWidth / aspectRatio;
        const pageHeight = doc.internal.pageSize.getHeight();

        if (y + imgHeight + 20 > pageHeight) {
            doc.addPage();
            y = 10;
        }

        doc.setFontSize(14);
        doc.text(translate('Export.signatureTitle'), 10, y);
        y += 10;

        doc.addImage(signatureImg, 'PNG', 10, y, imgWidth, imgHeight);
        y += imgHeight + 10;
    }

    console.log(doc.getFontList());
    return doc;
}

export async function exportDocumentsToZip(documents, translate) {
    const zip = new JSZip();

    for (const doc of documents) {
        try {
            const submissionId = doc._id;
            const createdAt = new Date(doc.created_at);
            const formattedTime = createdAt.toLocaleString("zh-CN", {
                year: "numeric", month: "2-digit", day: "2-digit",
                hour: "2-digit", minute: "2-digit", second: "2-digit",
                hour12: false
            });
            const submitterName = await getUserById(doc.created_by).then(res => res.data?.data?.name || "-");

            const systemInfo = {
                提交单号: submissionId,
                提交时间: formattedTime,
                提交人: submitterName
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
                if (key.startsWith("related_") || key === "approver_updated_at") {
                    delete cleanedUncategorized[key];
                }
            }

            const { groupedDetails, eSignature } = parseFormDocument({
                ...doc,
                submissionId: doc._id
            });

            if (groupedDetails.uncategorized) {
                groupedDetails.uncategorized = {
                    ...groupedDetails.uncategorized,
                    ...cleanedUncategorized
                };
            }

            let inspectorStr = Array.isArray(doc.related_inspectors)
                ? doc.related_inspectors.join('_')
                : String(doc.related_inspectors || 'unknown');
            const docName = `${doc.qc_form_template_name || 'unknown'}_${inspectorStr}_${formatDate(doc.created_at)}.pdf`;

            const pdf = generateSingleRecordPdf({
                formLabel: doc.qc_form_template_name || 'unknown',
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
    saveAs(zipBlob, '质检汇总.zip');
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
