// src/composables/useViewDetails.js
import { ref } from 'vue'
import { getMyDocument } from "@/services/qcTaskSubmissionLogsService";
import { parseFormDocument } from '@/utils/formUtils'
import {getUserById} from "@/services/userService";

// 📍 src/composables/useViewDetails.js
export function useViewDetails(basicInfo, systemInfo, groupedDetails, eSignature, dialogVisible) {
    async function viewDetailsFromRetest(row) {
        try {
            // 2. Fetch form document
            const submissionId = row.submission_id
            const collectionName = row.collection_name

            const qcFormTemplateId = row.qc_form_template_id
            const response = await getMyDocument(submissionId, qcFormTemplateId, 19, collectionName)
            const rawData = response.data

            // 3. Store meta info
            let selectedDetails = { ...rawData, submissionId: row._id };

            // 4. Resolve system fields
            systemInfo.value = {
                提交单号: selectedDetails.submissionId,
                提交时间: new Date(selectedDetails.created_at).toLocaleString("zh-CN", {
                    year: "numeric", month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit", second: "2-digit",
                    hour12: false
                }),
                提交人: await getUserById(selectedDetails.created_by).then(res => res.data?.data?.name || "-")
            };

            // Add a basicInfo field includes the 4 fields: 涉及产品，涉及批次，质检人员，所属班次, 所属班组
            basicInfo.value = {
                涉及产品: selectedDetails.uncategorized.related_products,
                涉及批次: selectedDetails.uncategorized.related_batches,
                质检人员: selectedDetails.uncategorized.related_inspectors,
                所属班次: selectedDetails.uncategorized.related_shifts,
                所属班组: selectedDetails.uncategorized.related_teams,
            };

            // // add dummy data first
            // this.basicInfo = {
            //   涉及产品: '土豆条, 红薯球',        // dummy product names
            //   涉及批次: 'BATCH20240401, BATCH20240402',   // dummy batch codes
            //   质检人员: '张三, 李四, 王五',              // dummy inspector names
            //   所属班次: 'A班, B班'                       // dummy shifts
            // };

            // 5. Parse document
            const { groupedDetails: grouped, eSignature: signature } = parseFormDocument(selectedDetails);

            // 5.1 Remove all "related_" fields from 'uncategorized'
            if (grouped.uncategorized) {
                for (const key of Object.keys(grouped.uncategorized)) {
                    if (key.startsWith("related_")) {
                        delete grouped.uncategorized[key];
                    }
                    if (key === "approver_updated_at") {
                        delete grouped.uncategorized[key];
                    }
                }
            }

            groupedDetails.value = grouped;
            eSignature.value = signature;

            // 6. Open dialog
            dialogVisible.value = true;
        } catch (err) {
            console.error("❌ Failed to view details from retest record:", err)
        }
    }

    return { viewDetailsFromRetest }
}
