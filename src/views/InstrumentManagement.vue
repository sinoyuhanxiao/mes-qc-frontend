<template>
  <el-container class="instrument-page">
    <div class="top-section">
      <!-- Top Section -->
      <div class="top-left">
        <h2>仪器管理</h2>
        <!-- Search Bar -->
        <el-input
            v-model="searchQuery"
            placeholder="搜索关键字"
            clearable
            class="search-bar"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        </div>

      <div class="top-right">
        <!-- Refresh Button -->
        <el-tooltip content="刷新列表" placement="top">
          <el-button
              class="refresh-button"
              type="primary"
              circle
              @click="handleRefreshButton"
          >
            <el-icon style="color: #004085;">
              <RefreshRight />
            </el-icon>
          </el-button>
        </el-tooltip>

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
          :instruments="instruments"
          @edit-instrument="openDialog"
          @delete-instrument="confirmDelete"
          :search-input="searchQuery"
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
import {RefreshRight, Search} from "@element-plus/icons-vue";
import InstrumentList from "@/components/instrument/instrumentList.vue";
import InstrumentForm from "@/components/instrument/instrumentForm.vue";

export default {
  components: { RefreshRight, Search, InstrumentList, InstrumentForm },
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
        console.log(updatedInstrument);
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
    async handleRefreshButton() {
      this.searchQuery = "";
      await this.loadInstruments()
      this.$notify({
        title: "提示",
        message: "列表已更新。",
        type: "success",
      });
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

.top-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  padding: 0;
  margin-top: 20px;
}

.refresh-button {
  background-color: #80cfff; /* Slightly lighter shade of primary color */
  border-color: #80cfff; /* Match lighter background */
}

.refresh-button:hover {
  background-color: #66b5ff; /* Slightly darker hover effect */
  border-color: #66b5ff;
  transform: rotate(360deg); /* Rotate on hover */
  transition: transform 0.3s ease-in-out, background-color 0.2s ease; /* Smooth animation */
}

.refresh-button el-icon {
  color: #004085; /* Darker primary-like color for the refresh icon */
}
</style>
