<template>
  <div ref="tabulatorTableRef"></div>
</template>

<script>
import { TabulatorFull as Tabulator } from "tabulator-tables";
import * as XLSX from "xlsx";
import "tabulator-tables/dist/css/tabulator_bootstrap5.min.css";

export default {
  name: "TabulatorTable",
  props: {
    rowData: {
      type: Array
    },
    columnDefs: {
      type: Array,
      required: true
    },
    tableOptions: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      tabulatorInstance: null
    };
  },
  watch: {
    rowData(newData, oldData) {
      if (newData !== oldData) {
        this.updateTableData();
      }
    },
    columnDefs(newColumns, oldColumns) {
      if (newColumns !== oldColumns) {
        this.updateTableColumns();
      }
    }
  },
  mounted() {
    this.initializeTable();
  },
  methods: {
    initializeTable() {
      if (this.rowData && this.columnDefs) {
        const options = {
          data: this.rowData,
          columns: this.columnDefs,
          layout: "fitColumns",
          columnDefaults: {
            headerSort: true,
            headerFilter: false,
            editor: false,
            headerHozAlign: "center",
            resizable: "header",
            headerContextMenu: [],
          },
          tooltips: true,
          resizableColumns: true,
          groupToggleElement: "header",
          groupStartOpen: true,
          selectable: true,
          selectableRange: 1,
          selectableRangeColumns: false,
          selectableRangeRows: false,
          selectableRangeClearCells: false,
          editTriggerEvent: "dblclick",
          clipboard: true,
          clipboardCopyStyled: false,
          clipboardCopyConfig: {
            formatCells: false,
            rowHeaders: false,
            columnHeaders: false
          },
          clipboardCopyRowRange: "range",
          clipboardPasteParser: "range",
          clipboardPasteAction: "range",
          // clipboardPasteParser: (clipboard) => {
          //   const rows= this.tabulatorInstance.getRows();
          //         return rows.map(row => {
          //             return row.map((cell, colIndex) => {
          //                 const column = table.getColumnDefinitions()[colIndex];
          //                 if (column.columns[colIndex].editor) {
          //                     // Allow pasting only in editable columns
          //                     return cell;
          //                 } else {
          //                     // Prevent pasting in non-editable columns
          //                     return null;
          //                 }
          //             });
          //         });
          //     },
          //     clipboardPasteAction: "update",
          dependencies: {
            XLSX: XLSX
          },
          downloadConfig: {},
          groupContextMenu: [],
          ...this.tableOptions
        };

        this.tabulatorInstance = new Tabulator(
          this.$refs.tabulatorTableRef,
          options
        );

        this.tabulatorInstance.on("cellEdited", (cell) => {
          // let updatedData = { field: cell.getField(), value: cell.getValue() };
          // let rowData = cell.getData();
          // if (this.tableOptions?.onCellValueChanged) {
          //   this.tableOptions.onCellValueChanged(rowData, updatedData);
          // }
        });

        this.tabulatorInstance.on("columnResized", () => {
          this.refreshTable();
        });
      }
    },

    getTabulatorElement() {
      return this.$refs.tabulatorTableRef;
    },

    // Tabulator Bug: When we use table.setData() or table.replaceData(), range paste does not work and gives "No bounds defined for this range" error. Hence only using table update methods.
    updateTableData() {
      if (this.tabulatorInstance) {

        if (!this.rowData || !Array.isArray(this.rowData)) {
          console.warn("No valid rowData provided.");
          return;
        }

        const currentData = this.tabulatorInstance.getData(); // Fetch current data from the table
        const currentIds = currentData.map((row) => row.id); // Extract existing row IDs (ensure 'id' field is unique)
        const newIds = this.rowData.map((row) => row.id); // Extract IDs from the new data

        const newData = [];
        const updatedData = [];
        const removedDataIds = [];

        // Split data into updated and new rows based on their IDs
        this.rowData.forEach((row) => {
          if (currentIds.includes(row.id)) {
            updatedData.push(row); // Update rows with matching IDs
          } else {
            newData.push(row); // Add new rows with unique IDs
          }
        });

        // Identify rows to remove (IDs in current data but not in new data)
        currentIds.forEach((id) => {
          if (!newIds.includes(id)) {
            removedDataIds.push(id);
          }
        });

        // Use updateData for updating existing rows
        if (updatedData.length > 0) {
          this.tabulatorInstance.updateData(updatedData).then(() => {
            console.log("Rows updated successfully.");
          }).catch((error) => {
            console.error("Error updating rows:", error);
          });
        }

        // Use updateOrAddData for new rows to add
        if (newData.length > 0) {
          this.tabulatorInstance.updateOrAddData(newData).then(() => {
            console.log("New rows added successfully.");
          }).catch((error) => {
            console.error("Error adding new rows:", error);
          });
        }

        // Remove rows that no longer exist in the new data
        if (removedDataIds.length > 0) {
          this.tabulatorInstance.deleteRow(removedDataIds).then(() => {
            console.log("Old rows removed successfully.");
          }).catch((error) => {
            console.error("Error removing old rows:", error);
          });
        }
      }
    },

    updateTableColumns() {
      if (this.tabulatorInstance) {
        this.tabulatorInstance.blockRedraw();
        this.tabulatorInstance.setColumns(this.columnDefs);
        this.tabulatorInstance.restoreRedraw();
        this.refreshTable();
      }
    },

    // Tabulator Bug: When we use group.show(), range paste does not work and gives "No bounds defined for this range" error. Hence not using this function.
    showAllGroups() {
      if (this.tabulatorInstance) {
        this.tabulatorInstance.blockRedraw();
        this.tabulatorInstance.getGroups().forEach((group) => group.show());
        this.tabulatorInstance.restoreRedraw();
      }
    },

    hideAllGroups() {
      if (this.tabulatorInstance) {
        this.tabulatorInstance.blockRedraw();
        this.tabulatorInstance.getGroups().forEach((group) => group.hide());
        this.tabulatorInstance.restoreRedraw();
      }
    },

    refreshTable() {
      if (this.tabulatorInstance) {
        this.tabulatorInstance.redraw();
      }
    },

    recreateTable() {
      if (this.tabulatorInstance) {
        this.tabulatorInstance.destroy();
        this.initializeTable();
      }
    },

    getTable() {
      return this.tabulatorInstance;
    }
  }
};
</script>

<style>
.tabulator {
  font-size: 12px;
  border: 1px solid grey;
}

.tabulator-table {
  height: 470px;
  background-color: #7788992d !important;
  z-index: 10;
}

.tabulator-header {
  border: none !important;
}

.tabulator-tableholder {
  overflow-x: scroll !important;
}

.tabulator-placeholder {
  text-align: center;
  width: 600px !important;
  height: 470px !important;
  background-color: #7788992d !important;
  white-space: nowrap;
}

.tabulator-cell {
  height: 35px !important;
  line-height: 10px;
  border-bottom: 1px solid grey !important;
  border-right: 1px solid grey !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tabulator-cell.no-right-border {
  border-right: none !important;
}

.tabulator-cell.disable-range-selection {
  pointer-events: none;
}

.tabulator-cell.tabulator-range-selected {
  background-color: #c0e7fd !important;
  border: none !important;
  color: #003757 !important;
  border-bottom: 1px solid grey !important;
}

.tabulator-cell.tabulator-editing {
  background-color: lightgoldenrodyellow !important;
  padding-left: 10px !important;
}

.tabulator-cell.tabulator-frozen {
  z-index: 1 !important;
}

.tabulator-cell.details-column {
  font-weight: bold !important;
  color: darkslategrey !important;
}

.tabulator-cell.user-entry-column {
  background-color: #ffebee;
  color: #c62828;
}

.tabulator-cell.facility-entry-column {
  background-color: #c4ecc2;
  color: #388e3c;
}

.tabulator-col {
  font-size: 13px;
  border-right: 1px solid grey !important;
  border-bottom: 1px solid grey !important;
}

.tabulator-col-vertical {
  border-top: 1px solid grey !important;
}

.tabulator-col-group-cols {
  border: none !important;
}

.tabulator-row {
  min-height: 0;
  height: 35px !important;
}

.tabulator-row[role="row"] {
  border: none !important;
}

.tabulator-row:not(.tabulator-group):nth-child(even),
.tabulator-row:not(.tabulator-group):nth-child(odd) {
  background-color: white !important;
}

.tabulator-row.tabulator-group {
  margin-top: 5px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background-color: #faf1d2;
  z-index: 20;
}

.tabulator-row.tabulator-group:hover {
  background-color: #fff9e1;
}

.barcode-column .tabulator-col-title {
  padding-right: 12px !important;
}

.no-group-by .tabulator-row-odd:nth-child(1) {
  margin-top: 5px;
}

.no-group-by .tabulator-row-odd:nth-child(1) .tabulator-cell {
  border-top: 1px solid grey !important;
}

.checkbox-column:not(.tabulator-col),
.empty-column:not(.tabulator-col) {
  padding: 12px 8px !important;
}

.name-column:not(.tabulator-col) {
  padding: 8px 8px !important;
}
</style>
