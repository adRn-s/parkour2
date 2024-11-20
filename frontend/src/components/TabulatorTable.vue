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

        // Watch for changes in rowData and columnDefs
        watch([() => props.rowData, () => props.columnDefs], ([newData, newColumns]) => {
            nextTick(() => {
                if (table.value) {
                    // Update columns visibility based on the 'visible' property
                    newColumns.forEach(column => {
                        if (column.visible) {
                            table.value.showColumn(column.field);
                        } else {
                            table.value.hideColumn(column.field);
                        }
                    });
                    // Update table data
                    table.value.setData(newData);
                }
            });
        });

        // Initialize the Tabulator table on mounted
        onMounted(() => {
            const options = {
                data: props.rowData,
                columns: [
                    {
                        formatter: "rowSelection",
                        titleFormatter: "rowSelection",
                        hozAlign: "center",
                        headerSort: false,
                        cellClick: function (e, cell) {
                            cell.getRow().toggleSelect();
                        },
                    },
                    ...props.columnDefs,
                ],
                layout: "fitColumns",
                fitColumns: true,
                columnDefaults: {
                    headerSort: true,
                    headerFilter: false,
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
                groupContextMenu: [
                    {
                        label: "Select All",
                        action: function (e, group) {
                            group.hide();
                        }
                    },
                    {
                        label: "Deselect All",
                        action: function (e, group) {
                            group.hide();
                        }
                    },
                ],
                rowContextMenu: [
                    {
                        label: "Apply to All",
                        action: function (e, row) {
                            row.delete();
                        }
                    },
                    {
                        label: "Quality Check: Pass",
                        action: function (e, row) {
                            row.delete();
                        }
                    },
                ],
                ...props.tableOptions,
            };

            // Initialize Tabulator instance
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
    font-size: 12px;
}

.tabulator-table {
    padding-bottom: 5px !important;
}

.tabulator-col {
    font-size: 13px !important;
}

.tabulator-row.tabulator-group {
    margin-top: 5px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
}

.tabulator-col.user-entry-column {}

.tabulator-col.facility-entry-column {}

.tabulator-cell.details-column {
    background-color: #ffffff !important;
    font-weight: bold !important;
    color: darkslategrey !important;
    pointer-events: none;
}

.tabulator-block-select{
    border: none !important;
}

.tabulator-cell.user-entry-column {
    background-color: #ffebee;
    color: #C62828;
}

.tabulator-cell.facility-entry-column {
    background-color: #c4ecc2;
    color: #388E3C;
}

.tabulator-col-group {
    border-left: 1px solid lightgrey !important;
}

.tabulator-frozen.tabulator-frozen-right {
    border-right: 1px solid lightgrey !important;
}
</style>