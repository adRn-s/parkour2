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

        this.tabulatorInstance.on("tableBuilt", () => {
          this.showAllGroups();
        });

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

    updateTableData() {
      if (this.tabulatorInstance) {
        this.tabulatorInstance.replaceData(this.rowData);
      }
    },

    updateTableColumns() {
      if (this.tabulatorInstance) {
        this.tabulatorInstance.setColumns(this.columnDefs);
        this.tabulatorInstance.redraw(true);
      }
    },

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
  text-align: center;
  border-bottom: 1px solid grey !important;
  border-right: 1px solid grey !important;
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

.no-group-by .tabulator-row-odd:nth-child(1) {
  margin-top: 5px;
}

.no-group-by .tabulator-row-odd:nth-child(1) .tabulator-cell {
  border-top: 1px solid grey !important;
}

.text-align-left {
  text-align: left !important;
}
</style>
