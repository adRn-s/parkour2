<template>
    <div ref="table"></div>
</template>

<script>
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator_bootstrap5.min.css";
import { ref, onMounted, watch, nextTick } from "vue";

export default {
    name: "TabulatorTable",
    props: {
        rowData: {
            type: Array,
        },
        columnDefs: {
            type: Array,
            required: true,
        },
        tableOptions: {
            type: Object,
            default: () => ({}),
        },
    },
    setup(props) {
        const table = ref(null);

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
                    width: 70,
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
                    columnHeaders: false,
                },
                clipboardCopyRowRange: "range",
                clipboardPasteParser: "range",
                clipboardPasteAction: "range",
                ...props.tableOptions,
            };

            table.value = new Tabulator(table.value, options);

            table.value.on("cellEdited", (cell) => {
                let updatedData = { field: cell.getField(), value: cell.getValue() };
                let rowData = cell.getData();
                if (props.tableOptions?.onCellValueChanged) {
                    props.tableOptions.onCellValueChanged(rowData, updatedData);
                }
            });
        });

        return {
            table,
        };
    },
};
</script>


<style>
.tabulator {
    font-size: 12px;
}

.tabulator-table {
    padding-bottom: 5px;
    height: 470px;
    overflow-y: visible;
}

.tabulator-col {
    font-size: 13px;
}

.tabulator-col-group {
    border-left: 1px solid lightgrey;
}

.tabulator-row.tabulator-group {
    margin-top: 5px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
}

.tabulator-col.tabulator-frozen.tabulator-frozen-right {
    border-right: 1px solid lightgrey;
}

.tabulator-frozen.tabulator-frozen-right {
    border-right: 1px solid lightgrey;
}

.tabulator-cell.disable-range-selection {
    pointer-events: none;
}

.tabulator-cell.tabulator-editing {
    background-color: lightgoldenrodyellow !important;
}

.tabulator-col.user-entry-column {}

.tabulator-col.facility-entry-column {}

.tabulator-cell.details-column {
    font-weight: bold !important;
    background-color: white !important;
    color: darkslategrey !important;
}

.tabulator-cell.user-entry-column {
    background-color: #ffebee;
    color: #C62828;
}

.tabulator-cell.facility-entry-column {
    background-color: #c4ecc2;
    color: #388E3C;
}
</style>