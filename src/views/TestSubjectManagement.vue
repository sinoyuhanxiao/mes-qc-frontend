<template>
  <el-container class="test-subject-page">
    <div class="top-section">
      <!-- Top Section -->
      <div class="top-left">
        <h2>检测项目管理</h2>
        <!-- Search Bar -->
        <el-input
            v-model="searchQuery"
            placeholder="搜索检测项目名称"
            clearable
            class="search-bar"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div class="top-right">
        <el-button type="primary" @click="openDialog()">
          新增检测项目
        </el-button>
      </div>
    </div>

    <el-main class="table-section">
      <!-- Test Subject List -->
      <TestSubjectList
          :testSubjects="filteredTestSubjects"
          @edit-test-subject="openDialog"
          @delete-test-subject="confirmDelete"
      />

      <!-- Pagination -->
      <el-pagination
          class="pagination"
          background
          layout="prev, pager, next"
          :total="filteredTestSubjects.length"
          :page-size="10"
      />
    </el-main>

    <!-- Dialog for Create / Edit -->
    <el-dialog
        v-model="dialogVisible"
        :title="isEditMode ? '编辑检测项目' : '新增检测项目'"
        width="500px"
        :close-on-click-modal="false"
    >
      <TestSubjectForm
          :testSubject="testSubjectForm"
          :is-edit-mode="isEditMode"
          @submit="submitForm"
          @cancel="dialogVisible = false"
      />
    </el-dialog>
  </el-container>
</template>

<script>
import {
  getAllTestSubjects,
  createTestSubject,
  updateTestSubject,
  deleteTestSubject
} from "@/services/testSubjectService";
import { Search } from "@element-plus/icons-vue";
import TestSubjectList from "@/components/test-subject/TestSubjectList.vue";
import TestSubjectForm from "@/components/test-subject/TestSubjectForm.vue";

export default {
  components: { Search, TestSubjectList, TestSubjectForm },
  data() {
    return {
      testSubjects: [],
      searchQuery: "",
      dialogVisible: false,
      isEditMode: false,
      testSubjectForm: {
        id: null,
        name: "",
        description: "",
      },
    };
  },
  computed: {
    filteredTestSubjects() {
      if (!this.searchQuery) return this.testSubjects;
      return this.testSubjects.filter((subject) =>
          subject.name.includes(this.searchQuery)
      );
    },
  },
  methods: {
    async loadTestSubjects() {
      try {
        const response = await getAllTestSubjects();
        if (response.data && response.data.data) {
          this.testSubjects = response.data.data;
        } else {
          this.testSubjects = [];
        }
      } catch (error) {
        console.error("Failed to load test subjects:", error);
        this.testSubjects = [];
      }
    },
    openDialog(testSubject = null) {
      this.isEditMode = !!testSubject;
      this.testSubjectForm = testSubject
          ? { ...testSubject }
          : { name: "", description: "" };
      this.dialogVisible = true;
    },
    async submitForm(updatedTestSubject) {
      try {
        console.log(updatedTestSubject);
        if (this.isEditMode) {
          await updateTestSubject(updatedTestSubject.id, updatedTestSubject);
        } else {
          await createTestSubject(updatedTestSubject);
        }
        this.dialogVisible = false;
        await this.loadTestSubjects();
      } catch (error) {
        console.error("Error saving test subject:", error);
      }
    },
    async confirmDelete(id) {
      try {
        await this.$confirm("确定删除该检测项目吗？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });
        await deleteTestSubject(id, 1);
        await this.loadTestSubjects();
      } catch (error) {
        console.error("Error deleting test subject:", error);
      }
    },
  },
  mounted() {
    this.loadTestSubjects();
  },
};
</script>

<style scoped>
.test-subject-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 100%;
  overflow: hidden;
}

.search-bar {
  width: 300px;
  margin-left: 20px;
}

.pagination {
  margin-top: 16px;
  text-align: center;
}

.top-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
}

.top-left {
  display: flex;
  align-items: center;
}

.top-right {
  display: flex;
  gap: 10px;
}

.table-section {
  flex: 1;
  padding: 20px;
}
</style>
