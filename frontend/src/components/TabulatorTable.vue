<template>
  <div ref="tabulatorTableRef"></div>
</template>

<script>
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator_bootstrap5.min.css";
import { ref, onMounted, watch, nextTick } from "vue";

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
  setup(props, { expose }) {
    const tabulatorTableRef = ref(null);

    onMounted(() => {
      const options = {
        data: props.rowData,
        columns: props.columnDefs,
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
        ...props.tableOptions
      };

      tabulatorTableRef.value = new Tabulator(tabulatorTableRef.value, options);

      tabulatorTableRef.value.on("cellEdited", (cell) => {
        let updatedData = { field: cell.getField(), value: cell.getValue() };
        let rowData = cell.getData();
        if (props.tableOptions?.onCellValueChanged) {
          props.tableOptions.onCellValueChanged(rowData, updatedData);
        }
      });
    });

    expose({
      getTable() {
        return tabulatorTableRef.value;
      }
    });

    return {
      tabulatorTableRef
    };
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
}

.tabulator-col-group {
  border-right: 1px solid grey !important;
}

.tabulator-col.tabulator-frozen {
  border-right: 1px solid grey !important;
}

.tabulator-cell {
  border-bottom: 1px solid grey !important;
}

.tabulator-cell.tabulator-frozen {
  border-right: 1px solid grey !important;
}

.tabulator-cell.disable-range-selection {
  pointer-events: none;
}

.tabulator-cell.tabulator-editing {
  background-color: lightgoldenrodyellow !important;
}

.tabulator-cell {
  height: 35px !important;
  line-height: 10px; /* Match the height */
  text-align: center; /* Optional: centers text horizontally */
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

.tabulator-col.user-entry-column {
}

.tabulator-col.facility-entry-column {
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
