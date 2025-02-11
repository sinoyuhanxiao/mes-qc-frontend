<template>
  <el-container class="instrument-page">
    <div class="top-section">
      <!-- Top Section -->
      <div class="top-left">
        <h2>仪器管理</h2>
        <!-- Search Bar -->
        <el-input
            v-model="searchQuery"
            placeholder="搜索仪器名称或型号"
            clearable
            class="search-bar"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        </div>

      <div class="top-right">
        <el-button
            type="primary"
            @click="openDialog()"
        >
          新增仪器
        </el-button>
      </div>
    </div>

    <el-main class="table-section">
      <!-- Instrument List -->
      <InstrumentList
          :instruments="filteredInstruments"
          @edit-instrument="openDialog"
          @delete-instrument="confirmDelete"
      />

      <!-- Pagination -->
      <el-pagination
          class="pagination"
          background
          layout="prev, pager, next"
          :total="filteredInstruments.length"
          :page-size="10"
      />
    </el-main>
    <!-- Dialog for Create / Edit -->
    <el-dialog
        v-model="dialogVisible"
        :title="isEditMode ? '编辑仪器' : '新增仪器'"
        width="500px"
        :close-on-click-modal="false"
    >
      <InstrumentForm
          :instrument="instrumentForm"
          :is-edit-mode="isEditMode"
          @submit="submitForm"
          @cancel="dialogVisible = false"
      />
    </el-dialog>
  </el-container>
</template>

<script>
import { getAllInstruments, createInstrument, updateInstrument, deleteInstrument } from "@/services/instrumentService";
import { Search } from "@element-plus/icons-vue";
import InstrumentList from "@/components/instrument/instrumentList.vue";
import InstrumentForm from "@/components/instrument/instrumentForm.vue";

export default {
  components: { Search, InstrumentList, InstrumentForm },
  data() {
    return {
      instruments: [],
      searchQuery: "",
      dialogVisible: false,
      isEditMode: false,
      instrumentForm: {
        id: null,
        name: "",
        type: "",
        manufacturer: "",
        modelNumber: "",
        description: "",
      },
    };
  },
  computed: {
    filteredInstruments() {
      if (!this.searchQuery) return this.instruments;
      return this.instruments.filter((instrument) =>
          instrument.name.includes(this.searchQuery) || instrument.modelNumber.includes(this.searchQuery)
      );
    },
  },
  methods: {
    async loadInstruments() {
      try {
        const response = await getAllInstruments();
        if (response.data && response.data.data) {
          this.instruments = response.data.data;  // Extract only the `data` array
        } else {
          this.instruments = []; // Ensure instruments is always an array
        }
      } catch (error) {
        console.error("Failed to load instruments:", error);
        this.instruments = []; // Fallback to an empty array in case of error
      }
    },
  openDialog(instrument = null) {
      this.isEditMode = !!instrument;
      this.instrumentForm = instrument ? { ...instrument } : {
        name: "",
        type: "",
        manufacturer: "",
        modelNumber: "",
        description: "",
      };
      this.dialogVisible = true;
    },
    async submitForm(updatedInstrument) {
      try {
        if (this.isEditMode) {
          await updateInstrument(updatedInstrument.id, updatedInstrument);
        } else {
          await createInstrument(updatedInstrument);
        }
        this.dialogVisible = false;
        await this.loadInstruments();
      } catch (error) {
        console.error("Error saving instrument:", error);
      }
    },
    async confirmDelete(id) {
      try {
        await this.$confirm("确定删除该仪器吗？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });
        await deleteInstrument(id, 1);
        await this.loadInstruments();
      } catch (error) {
        console.error("Error deleting instrument:", error);
      }
    },
  },
  mounted() {
    this.loadInstruments();
  },
};
</script>

<style scoped>
.instrument-page {
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
