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
      tabulatorInstance: null,
      previousData: null,
      tableFilters: {
        typesIn: [{ field: "type", type: "=", value: "L" }, { field: "type", type: "=", value: "S" }],
        typesNotIn: []
      },
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
    },
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

        this.previousData = JSON.stringify(this.rowData);

        this.tabulatorInstance.on("dataChanged", (updatedData) => {
          const currentData = JSON.stringify(updatedData);
          const previousParsed = JSON.parse(this.previousData);

          updatedData.forEach((row, index) => {
            const oldRow = previousParsed[index] || {};
            Object.keys(row).forEach((key) => {
              if (key !== "selected" && key !== "samples_submitted" && key !== "quality_check") {
                if (row[key] !== oldRow[key]) {
                  const change = {
                    rowData: row,
                    updatedData: { field: key, value: row[key] },
                  };

                  if (this.tableOptions?.onCellValueChanged) {
                    this.tableOptions.onCellValueChanged(change.rowData, change.updatedData);
                  }
                }
              }
            });
          });

          this.previousData = currentData;
        });

        this.tabulatorInstance.on("columnResized", () => {
          this.refreshTable();
        });
      }
    },

    getTabulatorElement() {
      return this.$refs.tabulatorTableRef;
    },

    // Tabulator Bug: When we use table.setData() or table.replaceData(), range paste does not work and gives "No bounds defined for this range" error.
    // Hence not using this function.
    updateTableData() {
      if (this.tabulatorInstance) {
        this.tabulatorInstance.setData(this.rowData);
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

    filterTableData(operation, keyword) {
      let typesIn = this.tableFilters.typesIn;
      let typesNotIn = this.tableFilters.typesNotIn;
      switch (operation) {
        case "search":
          if (keyword !== "") {
            this.tableFilters.search = [
              [
                { field: "name", type: "like", value: keyword },
                { field: "request_name", type: "like", value: keyword },
                { field: "barcode", type: "like", value: keyword },
                { field: "nucleic_acid_type_name", type: "like", value: keyword },
                { field: "library_protocol_name", type: "like", value: keyword },
                { field: "comments", type: "like", value: keyword },
                { field: "comments_facility", type: "like", value: keyword }
              ]
            ];
          } else {
            delete this.tableFilters.search;
          }
          break;

        case "showLibraries":
          const foundInL = typesIn.find(item => item.value === "L");
          if (keyword === true && !foundInL) {
            typesIn.push({ field: "type", type: "=", value: "L" });
            typesNotIn = typesNotIn.filter(item => item.value !== "L");
          } else if (keyword === false && foundInL) {
            typesIn = typesIn.filter(item => item.value !== "L");
            typesNotIn.push({ field: "type", type: "!=", value: "L" });
          }
          this.tableFilters.typesIn = typesIn;
          this.tableFilters.typesNotIn = typesNotIn;
          break;

        case "showSamples":
          const foundInS = typesIn.find(item => item.value === "S");
          if (keyword === true && !foundInS) {
            typesIn.push({ field: "type", type: "=", value: "S" });
            typesNotIn = typesNotIn.filter(item => item.value !== "S");
          } else if (keyword === false && foundInS) {
            typesIn = typesIn.filter(item => item.value !== "S");
            typesNotIn.push({ field: "type", type: "!=", value: "S" });
          }
          this.tableFilters.typesIn = typesIn;
          this.tableFilters.typesNotIn = typesNotIn;
          break;

        case "onlySamplesSubmitted":
          if (keyword === true) {
            this.tableFilters.onlySamplesSubmitted = {
              field: "samples_submitted",
              type: "=",
              value: keyword
            };
          } else {
            delete this.tableFilters.onlySamplesSubmitted;
          }
          break;

        case "onlyGmo":
          if (keyword === true) {
            this.tableFilters.onlyGmo = { field: "gmo", type: "=", value: true };
          } else {
            delete this.tableFilters.onlyGmo;
          }
          break;

        default:
          break;
      }

      let flatFilters = Object.entries(this.tableFilters)
        .filter(([key, value]) => {
          if (key === "typesNotIn") return false;
          return Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0;
        })
        .map(([key, value]) => value);

      if (typesNotIn.length > 0) {
        flatFilters.push(...typesNotIn);
      }

      console.log(flatFilters)
      this.tabulatorInstance.setFilter(flatFilters);
    },

    // Tabulator Bug: When we use group.show(), range paste does not work and gives "No bounds defined for this range" error.
    // Hence not using this function.
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
        this.tabulatorInstance.redraw(true);
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
  border-radius: 4px !important;
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
  padding: 0px !important;
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

.tabulator-col-vertical:not(.tabulator-frozen) {
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

.tabulator-row:hover .group-action-buttons-container {
  display: flex;
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
</style>
