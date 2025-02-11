<template>
  <el-container class="sampling-location-page">
    <div class="top-section">
      <!-- Top Section -->
      <div class="top-left">
        <h2>采样点管理</h2>
        <!-- Search Bar -->
        <el-input
            v-model="searchQuery"
            placeholder="搜索采样点名称"
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
          新增采样点
        </el-button>
      </div>
    </div>

    <el-main class="table-section">
      <!-- Sampling Location List -->
      <SamplingLocationList
          :locations="filteredLocations"
          @edit-location="openDialog"
          @delete-location="confirmDelete"
      />

      <!-- Pagination -->
      <el-pagination
          class="pagination"
          background
          layout="prev, pager, next"
          :total="filteredLocations.length"
          :page-size="10"
      />
    </el-main>

    <!-- Dialog for Create / Edit -->
    <el-dialog
        v-model="dialogVisible"
        :title="isEditMode ? '编辑采样点' : '新增采样点'"
        width="500px"
        :close-on-click-modal="false"
    >
      <SamplingLocationForm
          :location="locationForm"
          :is-edit-mode="isEditMode"
          @submit="submitForm"
          @cancel="dialogVisible = false"
      />
    </el-dialog>
  </el-container>
</template>

<script>
import {
  getAllSamplingLocations,
  createSamplingLocation,
  updateSamplingLocation,
  deleteSamplingLocation
} from "@/services/samplingLocationService";
import { Search } from "@element-plus/icons-vue";
import SamplingLocationList from "@/components/sampling-location/SamplingLocationList.vue";
import SamplingLocationForm from "@/components/sampling-location/SamplingLocationForm.vue";

export default {
  components: { Search, SamplingLocationList, SamplingLocationForm },
  data() {
    return {
      locations: [],
      searchQuery: "",
      dialogVisible: false,
      isEditMode: false,
      locationForm: {
        id: null,
        name: "",
        description: "",
      },
    };
  },
  computed: {
    filteredLocations() {
      if (!this.searchQuery) return this.locations;
      return this.locations.filter((location) =>
          location.name.includes(this.searchQuery)
      );
    },
  },
  methods: {
    async loadLocations() {
      try {
        const response = await getAllSamplingLocations();
        if (response.data && response.data.data) {
          this.locations = response.data.data;
        } else {
          this.locations = [];
        }
      } catch (error) {
        console.error("Failed to load sampling locations:", error);
        this.locations = [];
      }
    },
    openDialog(location = null) {
      this.isEditMode = !!location;
      this.locationForm = location
          ? { ...location }
          : { name: "", description: "" };
      this.dialogVisible = true;
    },
    async submitForm(updatedLocation) {
      try {
        console.log(updatedLocation);
        if (this.isEditMode) {
          await updateSamplingLocation(updatedLocation.id, updatedLocation, 1);
        } else {
          await createSamplingLocation(updatedLocation, 1);
        }
        this.dialogVisible = false;
        this.loadLocations();
      } catch (error) {
        console.error("Error saving sampling location:", error);
      }
    },
    async confirmDelete(id) {
      try {
        await this.$confirm("确定删除该采样点吗？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });
        await deleteSamplingLocation(id, 1);
        this.loadLocations();
      } catch (error) {
        console.error("Error deleting sampling location:", error);
      }
    },
  },
  mounted() {
    this.loadLocations();
  },
};
</script>

<style scoped>
.sampling-location-page {
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
