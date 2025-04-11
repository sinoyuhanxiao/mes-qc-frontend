<template>
  <div style="display: flex; flex-direction: column; max-width: 100%;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; ">
      <!-- Top Section -->
      <div style="display: flex; align-items: center;">
        <h2>{{ translate('samplingLocationManagement.title') }}</h2>
        <!-- Search Bar -->
        <el-input
            v-model="searchQuery"
            :placeholder="translate('common.searchPlaceholder')"
            clearable
            style="width: 300px; margin-left: 20px;"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div style="display: flex; gap: 10px;">
        <!-- Refresh Button -->
        <el-tooltip :content="translate('orderManagement.refreshList')" placement="top">
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
          {{ translate('common.addButton') }}
        </el-button>
      </div>
    </div>


    <!-- Sampling Location List -->
    <SamplingLocationList
        :locations="locations"
        @edit-location="openDialog"
        @delete-location="confirmDelete"
        :search-input="searchQuery"
    />


    <!-- Dialog for Create / Edit -->
    <el-dialog
        v-model="dialogVisible"
        :title="isEditMode ? translate('samplingLocationManagement.editSamplingLocation') : translate('samplingLocationManagement.addSamplingLocation')"
        :close-on-click-modal="false"
    >
      <SamplingLocationForm
          :location="locationForm"
          :is-edit-mode="isEditMode"
          @submit="submitForm"
          @cancel="dialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script>
import {
  getAllSamplingLocations,
  createSamplingLocation,
  updateSamplingLocation,
  deleteSamplingLocation
} from "@/services/samplingLocationService";
import {RefreshRight, Search} from "@element-plus/icons-vue";
import SamplingLocationList from "@/components/sampling-location/SamplingLocationList.vue";
import SamplingLocationForm from "@/components/sampling-location/SamplingLocationForm.vue";
import samplingLocationList from "@/components/sampling-location/SamplingLocationList.vue";
import {translate, translateWithParams} from "@/utils/i18n";

export default {
  components: { RefreshRight, Search, SamplingLocationList, SamplingLocationForm },
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
  methods: {
    translate,
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
        await this.loadLocations();
        this.refreshKey++;
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
        await this.loadLocations();
      } catch (error) {
        console.error("Error deleting sampling location:", error);
      }
    },
    async handleRefreshButton() {
      this.searchQuery = "";
      await this.loadLocations()
      this.$notify({
        title: "提示",
        message: "列表已更新。",
        type: "success",
      });
    },
  },
  mounted() {
    this.loadLocations();
  },
};
</script>

<style scoped>

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
