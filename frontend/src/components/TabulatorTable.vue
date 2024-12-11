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
            width: 70
          },
          tooltips: true,
          resizableColumns: true,
          movableColumns: true,
          groupToggleElement: "header",
          groupStartOpen: false,
          selectable: true,
          selectableRange: 1,
          selectableRangeColumns: false,
          selectableRangeRows: false,
          selectableRangeClearCells: false,
          editTriggerEvent: "dblclick",
          clipboard: true,
          clipboardCopyStyled: true,
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
          ...this.tableOptions
        };

        this.tabulatorInstance = new Tabulator(
          this.$refs.tabulatorTableRef,
          options
        );

        this.tabulatorInstance.on("cellEdited", (cell) => {
          let updatedData = { field: cell.getField(), value: cell.getValue() };
          let rowData = cell.getData();
          if (this.tableOptions?.onCellValueChanged) {
            this.tableOptions.onCellValueChanged(rowData, updatedData);
          }
        });
      }
    },

    updateTableData() {
      if (this.tabulatorInstance) {
        this.tabulatorInstance.replaceData(this.rowData);
      }
    },

    updateTableColumns() {
      if (this.tabulatorInstance) {
        this.tabulatorInstance.setColumns(this.columnDefs);
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
}

.tabulator-table {
  padding-bottom: 5px;
  height: 470px;
  background-color: #7788992d !important;
  overflow-y: visible;
}

.tabulator-col {
  font-size: 13px;
  border-right: 1px solid lightgrey !important;
}

.tabulator-cell {
  border-bottom: 1px solid grey !important;
  border-right: 1px solid grey !important;
}

.tabulator-col-group {
  border-right: 1px solid lightgrey !important;
}

.tabulator-cell.disable-range-selection {
  pointer-events: none;
}

.tabulator-cell.tabulator-editing {
  background-color: lightgoldenrodyellow !important;
}

.tabulator-cell {
  height: 35px !important;
  line-height: 10px;
  text-align: center;
}

.tabulator-row {
  min-height: 0;
  height: 35px !important;
}

.tabulator-row[role="row"] {
  border: none !important;
}

.tabulator-row.tabulator-group {
  margin-top: 5px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background-color: rgb(250, 241, 210);
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
</style>
