<template>
    <div ref="table"></div>
</template>

<script>
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator_bootstrap5.min.css";
import { ref, onMounted, watch } from "vue";

export default {
    name: "TabulatorTable",
    props: {
        rowData: {
            type: Array,
            required: true,
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

        watch(
            [() => props.rowData, () => props.columnDefs, () => props.tableOptions],
            ([newData, newColumns]) => {
                if (table.value) {
                    table.value.setColumns(newColumns);
                    table.value.setData(newData);
                }
            }
        );

        onMounted(() => {
            const options = {
                data: props.rowData,
                columns: props.columnDefs,
                layout: "fitColumns",
                columnDefaults: {
                    headerSort: true,
                    headerFilter: true,
                    headerHozAlign: "center",
                    editor: false,
                    resizable: "header",
                    width: 100,
                },
                tooltips: true,
                resizableColumns: true,
                movableColumns: true,
                groupToggleElement: "header",
                groupStartOpen: false,
                selectableRange: 1,
                selectableRangeColumns: false,
                selectableRangeRows: false,
                selectableRangeClearCells: false,
                editTriggerEvent: "dblclick",
                clipboard: true,
                clipboardCopyStyled: true,
                clipboardCopyConfig: {
                    formatCells: true,
                    rowHeaders: false,
                    columnHeaders: false,
                },
                clipboardCopyRowRange: "range",
                clipboardPasteParser: "range",
                clipboardPasteAction: "range",
                ...props.tableOptions,
            };

            table.value = new Tabulator(table.value, options);
        });

        return {
            table,
        };
    },
};
</script>

<style>
.tabulator {
    font-size: 14px;
}

.tabulator-table {
    padding-bottom: 5px !important;
}

.tabulator-row.tabulator-group {
    margin-top: 5px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
}
</style>