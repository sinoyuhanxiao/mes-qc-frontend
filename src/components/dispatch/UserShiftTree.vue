<template>
  <div>
    <!-- Search Input & Clear Button (Same Row) -->
    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
      <el-input
          v-model="searchQuery"
          placeholder="搜索班次"
          clearable
          style="flex: 1;"
          @input="filterTree"
      />
      <el-button type="warning" @click="clearSelection">清空选择</el-button>
    </div>

    <!-- Tree Wrapper with Conditional Red Border -->
    <div>
      <el-tree
          style="max-height: 300px; /* Set vertical limit */ overflow-y: auto;   /* Enable scrolling */ border: 1px solid #dcdfe6; border-radius: 4px; padding: 5px;"
          ref="treeRef"
          :data="filteredTreeData"
          show-checkbox
          node-key="nodeId"
          default-expand-all
          highlight-current
          :props="{ label: 'name', children: 'children' }"
          @check-change="handleSelection"
      />
    </div>
  </div>
</template>

<script>
import {getAllShifts} from "@/services/shiftService";
import {getAllShiftUsers} from "@/services/shiftUserService";
import {fetchUsers} from "@/services/userService";

export default {
  data() {
    return {
      searchQuery: "",
      shiftTreeData: [], // Full shift-user tree
      filteredTreeData: [], // Tree with search filter applied
      selectedUserIds: new Set(), // Unique selected user IDs
      userToNodesMap: new Map(), // Maps userId → all occurrences in tree
    };
  },
  async mounted() {
    await this.loadShiftTreeData();
  },
  methods: {
    /** Fetches shifts, shift-user mappings, and users */
    async loadShiftTreeData() {
      try {
        const [shiftsRes, shiftUserRes, usersRes] = await Promise.all([
          getAllShifts(),
          getAllShiftUsers(),
          fetchUsers(),
        ]);

        const shifts = (shiftsRes.data?.data || []).filter(user => user.status !== 0);
        const shiftUserMappings = shiftUserRes.data?.data || [];
        const users = (usersRes.data?.data || []).filter(user => user.status !== 0);

        // Build lookup maps
        const userMap = new Map(users.map(user => [user.id, user]));
        const shiftUserMap = new Map();

        // Build shift-user relationships
        shiftUserMappings.forEach(({shift_id, user_id}) => {
          if (!shiftUserMap.has(shift_id)) shiftUserMap.set(shift_id, []);
          const user = userMap.get(user_id);
          if (user) {
            const userNode = {id: user.id, name: user.name, nodeId: `${user.id}-${shift_id}`};
            shiftUserMap.get(shift_id).push(userNode);

            if (!this.userToNodesMap.has(user.id)) this.userToNodesMap.set(user.id, []);
            this.userToNodesMap.get(user.id).push(userNode.nodeId);
          }
        });

        // Build tree structure
        this.shiftTreeData = shifts.map(shift => ({
          id: `shift-${shift.id}`,
          name: shift.name,
          children: shiftUserMap.get(shift.id) || [],
        })).filter(shift => shift.children.length > 0);

        // Add standalone users (users not in shifts)
        users.forEach(user => {
          if (!shiftUserMappings.some(mapping => mapping.user_id === user.id)) {
            const userNode = {id: user.id, name: user.name, nodeId: `user-${user.id}`};
            if (!this.userToNodesMap.has(user.id)) this.userToNodesMap.set(user.id, []);
            this.userToNodesMap.get(user.id).push(userNode.nodeId);
            this.shiftTreeData.push(userNode);
          }
        });

        // Store filtered tree data and sync selections
        this.filteredTreeData = [...this.shiftTreeData];
      } catch (error) {
        console.error("Failed to load shifts and users:", error);
      }
    },
    /** Handles tree node selection and updates selected user IDs */
    handleSelection(node, checked) {
      if (!this.$refs.treeRef) return;

      // Get all checked node IDs
      const checkedKeys = this.$refs.treeRef.getCheckedKeys();

      // Extract user IDs and ensure they are numbers
      const userIds = new Set();

      checkedKeys.forEach(nodeId => {
        if (!nodeId) return; // Ignore undefined values

        let extractedId = null;
        if (nodeId.startsWith("user-")) {
          extractedId = nodeId.replace("user-", ""); // Extract standalone user ID
        } else if (!nodeId.startsWith("shift-")) {
          extractedId = nodeId.split("-")[0]; // Extract user ID from shift-user composite key
        }

        if (extractedId !== null) {
          userIds.add(parseInt(extractedId, 10)); // Convert to number
        }
      });

      // If a shift node is selected, include all users under that shift
      if (!node.isLeaf && checked) {
        node.children?.forEach(child => {
          if (child.isLeaf) {
            userIds.add(parseInt(child.id, 10)); // Convert to number
          }
        });
      }

      // Store unique selected user IDs
      this.selectedUserIds = userIds;

      // Emit only integer user IDs
      this.$emit("update-selected-users", [...userIds]);
    },

    /** Extracts the actual user ID from a nodeId */
    extractUserId(nodeId) {
      if (nodeId.startsWith("shift-")) return null; // Ignore shift nodes
      if (nodeId.startsWith("user-")) return nodeId.replace("user-", ""); // Standalone users
      return nodeId.split("-")[0]; // Extract user ID from shift-user composite key
    },


    isUserNode(nodeId) {
      const node = this.$refs.treeRef.getNode(nodeId);
      return node && node.isLeaf; // Only leaf nodes represent users
    },
    /** Filters the tree based on search input */
    filterTree() {
      if (!this.searchQuery) {
        this.filteredTreeData = [...this.shiftTreeData];
        return;
      }
      this.filteredTreeData = this.filterTreeNodes(this.shiftTreeData, this.searchQuery.toLowerCase());
    },

    /** Recursively filters tree nodes based on search query */
    filterTreeNodes(nodes, query) {
      return nodes
          .map(node => {
            if (node.name.toLowerCase().includes(query)) return node;
            if (node.children) {
              const filteredChildren = this.filterTreeNodes(node.children, query);
              if (filteredChildren.length) return {...node, children: filteredChildren};
            }
            return null;
          })
          .filter(node => node !== null);
    },

    /** Clears all selected nodes */
    clearSelection() {
      this.selectedUserIds.clear();
      this.$refs.treeRef.setCheckedKeys([]);
      this.$emit("update-selected-users", []);
    },
  },
};
</script>

<style scoped>
.tree-wrapper-error {
  border: 1px solid #f56c6c !important; /* Red border for validation */
  border-radius: 4px;
  padding: 5px;
}
</style>
