<template>
  <div id="tabulatorTable" ref="tabulatorTableRef"></div>
</template>

<script>
import { TabulatorFull as Tabulator } from "tabulator-tables";
import * as XLSX from "xlsx";
import "tabulator-tables/dist/css/tabulator_bootstrap5.min.css";
import {
  showNotification,
  handleError,
  createAxiosObject,
  urlStringStartsWith
} from "../utils/utilities";

const axiosRef = createAxiosObject();
const urlStringStart = urlStringStartsWith();

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
      tableFiltersState: {
        typesIn: [
          { field: "type", type: "=", value: "L" },
          { field: "type", type: "=", value: "S" }
        ],
        typesNotIn: []
      },
      tableRangeBoundsState: {
        start: null,
        end: null
      },
      tableGroupsToggleState: 0,
      tableGroupsConfig: {
        groupBy: "request_name",
        noGroupByClass: false
      },
      tableEachGroupsToggleState: []
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
  beforeDestroy() {
    document.removeEventListener("keydown", this.handleKeyDown);
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
            headerContextMenu: []
          },
          tooltips: true,
          resizableColumns: true,
          groupToggleElement: "header",
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
          clipboardPasteAction: "range",
          clipboardPasteParser: async (clipboard) => {
            const selectedRanges = this.tabulatorInstance.getRanges();
            if (!selectedRanges || selectedRanges.length === 0) {
              showNotification(
                "Please select a range before pasting.",
                "warning"
              );
              return [];
            }

            const firstRange = selectedRanges[0]._range;
            const {
              top: rowStart,
              bottom: rowEnd,
              left: colStart,
              right: colEnd
            } = firstRange;
            const firstRangeCells = firstRange.getComponent().getCells();
            const allColumns = this.tabulatorInstance.getColumns();
            const rangeColumns = [];

            firstRangeCells.forEach((row, rowIndex) => {
              row.forEach((cell, colIndex) => {
                const columnField = cell.getField();
                const column = allColumns.find(
                  (col) => col.getField() === columnField
                );
                if (column && !rangeColumns.includes(column)) {
                  rangeColumns.push(column);
                }
              });
            });

            const pastedData = clipboard
              .trim()
              .split("\n")
              .map((row) => row.split("\t"));

            let hasValidationErrors = false;
            const batchUpdates = {};

            pastedData.forEach((pastedRow, rowOffset) => {
              console.log(pastedData, pastedRow);
              const tableRow = this.tabulatorInstance.getRowFromPosition(
                rowStart + rowOffset + 1
              );
              if (!tableRow) return;

              const rowData = tableRow.getData();
              const updatedRow = { ...rowData };

              pastedRow.forEach((cellValue, colOffset) => {
                const column = rangeColumns[colOffset];
                if (!column) return;

                const field = column.getField();
                const columnDef = column.getDefinition();
                const cell = tableRow.getCell(field);

                if (
                  columnDef.editor === false ||
                  cell.getElement().classList.contains("disable-editing")
                ) {
                  hasValidationErrors = true;
                  showNotification(
                    "Editing is not allowed in one or more cells.",
                    "warning"
                  );
                  return;
                }

                try {
                  updatedRow[field] = this.validateCellValue(
                    cellValue,
                    columnDef,
                    rowData
                  );
                } catch (error) {
                  hasValidationErrors = true;
                  showNotification(error.message, "error");
                  return;
                }
              });

              batchUpdates[rowData.barcode] = updatedRow;
            });
            console.log(batchUpdates);

            if (hasValidationErrors) {
              return [];
            }

            const updatedRowsArray = Object.values(batchUpdates);
            if (updatedRowsArray.length > 0) {
              this.tabulatorInstance.updateData(updatedRowsArray);
              console.log(updatedRowsArray);
            }

            return [];
          },
          dependencies: {
            XLSX: XLSX
          },
          downloadConfig: {},
          groupContextMenu: [],
          groupBy: this.tableGroupsConfig.groupBy,
          groupStartOpen: (value) => {
            const groupState = this.tableEachGroupsToggleState.find(
              (item) => item.group === value
            );
            return groupState ? !groupState.isClose : true;
          },
          ...this.tableOptions
        };

        this.tabulatorInstance = new Tabulator("#tabulatorTable", options);

        this.tabulatorInstance.on("tableBuilt", () => {
          document.addEventListener("keydown", this.handleKeyDown);

          if (
            this.tableRangeBoundsState.start &&
            this.tableRangeBoundsState.end
          ) {
            let start = this.tableRangeBoundsState.start;
            let end = this.tableRangeBoundsState.end;
            this.tabulatorInstance.addRange(
              start.getComponent(),
              end.getComponent()
            );
          }

          if (!document.querySelector(".button-popup-container")) {
            document
              .getElementsByClassName("tabulator-range-selected")[0]
              ?.click();
          }

          const tabulatorElement = this.getTabulatorElement();

          if (this.tableGroupsConfig.noGroupByClass) {
            tabulatorElement.classList.add("no-group-by");
          } else {
            tabulatorElement.classList.remove("no-group-by");
          }

          this.tabulatorInstance.setGroupBy(this.tableGroupsConfig.groupBy);

          let typesNotIn = this.tableFiltersState.typesNotIn;
          let flatFilters = Object.entries(this.tableFiltersState)
            .filter(([key, value]) => {
              if (key === "typesNotIn") return false;
              return Array.isArray(value)
                ? value.length > 0
                : Object.keys(value).length > 0;
            })
            .map(([key, value]) => value);

          if (typesNotIn.length > 0) {
            flatFilters.push(...typesNotIn);
          }

          this.tabulatorInstance.setFilter(flatFilters);
        });

        this.previousData = JSON.stringify(this.rowData);

        this.tabulatorInstance.on("dataChanged", (updatedData) => {
          const currentData = JSON.stringify(updatedData);
          const previousParsed = JSON.parse(this.previousData);
          const batchChanges = [];

          updatedData.forEach((row, index) => {
            const oldRow = previousParsed[index] || {};
            const changedFields = {};

            Object.keys(row).forEach((key) => {
              if (
                key !== "selected" &&
                key !== "samples_submitted" &&
                key !== "quality_check"
              ) {
                if (row[key] !== oldRow[key]) {
                  changedFields[key] = row[key] === "" ? null : row[key];
                }
              }
            });

            if (Object.keys(changedFields).length > 0) {
              batchChanges.push({
                pk: row.pk,
                record_type: row.record_type,
                ...changedFields
              });
            }
          });

          this.previousData = currentData;

          if (batchChanges.length > 0) {
            this.tableOptions.onBatchCellValueChanged(batchChanges);
          }
        });

        this.tabulatorInstance.on("columnResized", () => {
          this.refreshTable();
        });

        this.tabulatorInstance.on("rangeChanged", (range) => {
          const start = range.getBounds().start;
          const end = range.getBounds().end;
          this.tableRangeBoundsState = {
            start: start,
            end: end
          };
        });

        this.tabulatorInstance.on("clipboardCopied", () => {
          this.recreateTable();
        });

        this.tabulatorInstance.on(
          "groupVisibilityChanged",
          (group, visible) => {
            const groupValue = group.getKey();

            const index = this.tableEachGroupsToggleState.findIndex(
              (item) => item.group === groupValue
            );

            if (index !== -1) {
              this.tableEachGroupsToggleState[index].isClose = !visible;
            } else {
              this.tableEachGroupsToggleState.push({
                group: groupValue,
                isClose: !visible
              });
            }

            const rows = this.tabulatorInstance.getRows();
            if (rows.length > 0) {
              const firstRow = rows[0];
              const cells = firstRow.getCells();
              if (cells.length > 0) {
                const topLeftCell = cells[0];
                this.tabulatorInstance.addRange(topLeftCell, topLeftCell);
              }
            }
          }
        );
      }
    },

    getTabulatorElement() {
      return document.getElementById("tabulatorTable");
    },

    // Tabulator Bug: When we use table.setData() or table.replaceData(), range paste does not work and gives "No bounds defined for this range" error.
    // Hence we need to destroy and recreate table again, when using these methods.
    updateTableData() {
      if (this.tabulatorInstance) {
        this.tabulatorInstance.setData(this.rowData);
      }
    },

    updateTableColumns() {
      if (this.tabulatorInstance) {
        this.tabulatorInstance.setColumns(this.columnDefs);
        this.getTabulatorElement().classList.remove("no-group-by");
        this.showAllGroups();
        this.tabulatorInstance.setGroupBy("request_name");
        this.tableRangeBoundsState = {
          start: null,
          end: null
        };
        this.recreateTable();
      }
    },

    filterTableData(operation, keyword) {
      let typesIn = this.tableFiltersState.typesIn;
      let typesNotIn = this.tableFiltersState.typesNotIn;
      switch (operation) {
        case "search":
          if (keyword !== "") {
            this.tableFiltersState.search = [
              [
                { field: "name", type: "like", value: keyword },
                { field: "request_name", type: "like", value: keyword },
                { field: "barcode", type: "like", value: keyword },
                {
                  field: "nucleic_acid_type_name",
                  type: "like",
                  value: keyword
                },
                {
                  field: "library_protocol_name",
                  type: "like",
                  value: keyword
                },
                { field: "comments", type: "like", value: keyword },
                { field: "comments_facility", type: "like", value: keyword }
              ]
            ];
          } else {
            delete this.tableFiltersState.search;
          }
          break;

        case "showLibraries":
          const foundInL = typesIn.find((item) => item.value === "L");
          if (keyword === true && !foundInL) {
            typesIn.push({ field: "type", type: "=", value: "L" });
            typesNotIn = typesNotIn.filter((item) => item.value !== "L");
          } else if (keyword === false && foundInL) {
            typesIn = typesIn.filter((item) => item.value !== "L");
            typesNotIn.push({ field: "type", type: "!=", value: "L" });
          }
          this.tableFiltersState.typesIn = typesIn;
          this.tableFiltersState.typesNotIn = typesNotIn;
          break;

        case "showSamples":
          const foundInS = typesIn.find((item) => item.value === "S");
          if (keyword === true && !foundInS) {
            typesIn.push({ field: "type", type: "=", value: "S" });
            typesNotIn = typesNotIn.filter((item) => item.value !== "S");
          } else if (keyword === false && foundInS) {
            typesIn = typesIn.filter((item) => item.value !== "S");
            typesNotIn.push({ field: "type", type: "!=", value: "S" });
          }
          this.tableFiltersState.typesIn = typesIn;
          this.tableFiltersState.typesNotIn = typesNotIn;
          break;

        case "onlySamplesSubmitted":
          if (keyword === true) {
            this.tableFiltersState.onlySamplesSubmitted = {
              field: "samples_submitted",
              type: "=",
              value: keyword
            };
          } else {
            delete this.tableFiltersState.onlySamplesSubmitted;
          }
          break;

        case "onlyGmo":
          if (keyword === true) {
            this.tableFiltersState.onlyGmo = {
              field: "gmo",
              type: "=",
              value: true
            };
          } else {
            delete this.tableFiltersState.onlyGmo;
          }
          break;

        default:
          break;
      }

      let flatFilters = Object.entries(this.tableFiltersState)
        .filter(([key, value]) => {
          if (key === "typesNotIn") return false;
          return Array.isArray(value)
            ? value.length > 0
            : Object.keys(value).length > 0;
        })
        .map(([key, value]) => value);

      if (typesNotIn.length > 0) {
        flatFilters.push(...typesNotIn);
      }

      this.tabulatorInstance.setFilter(flatFilters);
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

    toggleGroups(goToInitial, fromExport) {
      if (fromExport && this.tableGroupsToggleState == 2) {
        this.tableGroupsToggleState == 2;
      } else if (goToInitial === true || this.tableGroupsToggleState == 2) {
        this.tableGroupsToggleState = 0;
      } else {
        const allGroups = this.tabulatorInstance.getGroups();
        const closedGroupCount = allGroups.filter(
          (group) => !group._group.visible
        ).length;

        if (closedGroupCount === allGroups.length) {
          this.tableGroupsToggleState = 2;
        } else if (closedGroupCount === 0) {
          this.tableGroupsToggleState = 1;
        } else {
          this.tableGroupsToggleState = 0;
        }
      }

      switch (this.tableGroupsToggleState) {
        case 0:
          this.showAllGroups();
          this.tableGroupsConfig.groupBy = "request_name";
          this.tableGroupsConfig.noGroupByClass = false;
          break;

        case 1:
          this.hideAllGroups();
          this.tableGroupsConfig.groupBy = "request_name";
          this.tableGroupsConfig.noGroupByClass = false;
          break;

        case 2:
          this.showAllGroups();
          this.tableGroupsConfig.groupBy = false;
          this.tableGroupsConfig.noGroupByClass = true;
          break;
      }

      this.recreateTable();
    },

    refreshTable() {
      if (this.tabulatorInstance) {
        this.tabulatorInstance.redraw();
      }
    },

    recreateTable() {
      const oldTable = document.getElementById("tabulatorTable");
      const newTable = oldTable.cloneNode(false);
      oldTable.replaceWith(newTable);
      this.$nextTick(() => {
        this.initializeTable();
      });
    },

    getTable() {
      return this.tabulatorInstance;
    },

    handleKeyDown(event) {
      const isDeleteOrBackspace =
        event.key === "Delete" || event.key === "Backspace";
      const isPrintableKey =
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey;

      let selectedRanges = this.tabulatorInstance.getRanges();
      let selectedRangesData = this.tabulatorInstance.getRangesData();
      let isRangeSelected =
        selectedRangesData.length > 0 &&
        (selectedRangesData[0].length > 1 ||
          Object.keys(selectedRangesData[0][0]).length > 1);

      if (isDeleteOrBackspace) {
        if (!isRangeSelected) return;
        const clearableFields = [
          "measuring_unit_facility",
          "measured_value_facility",
          "sample_volume_facility",
          "size_distribution_facility",
          "rna_quality",
          "gmo_facility",
          "comments_facility"
        ];
        let firstRangeCells = selectedRanges[0]
          ? selectedRanges[0].getCells()
          : [];
        firstRangeCells.forEach((row) => {
          row.forEach((cell) => {
            let columnField = cell.getField();
            let disabledEditing = cell
              .getElement()
              .classList.contains("disable-editing");

            if (clearableFields.includes(columnField) && !disabledEditing) {
              cell.setValue("");
            }
          });
        });
        event.preventDefault();
        return;
      }

      if (isPrintableKey) {
        let firstRangeCells = selectedRanges[0]
          ? selectedRanges[0].getCells()
          : [];
        let firstCell = firstRangeCells[0][0];

        if (
          document.activeElement &&
          document.activeElement.tagName === "INPUT"
        ) {
          return;
        }
        if (firstCell) {
          let disabledEditing = firstCell
            .getElement()
            .classList.contains("disable-editing");
          if (disabledEditing) {
            showNotification("Editing is disabled for this field.", "warning");
            return;
          }
          firstCell.edit();
        }
      }
    },

    validateCellValue(value, columnDef, rowData) {
      const editorType = columnDef.editor;
      const editorParams =
        typeof columnDef.editorParams === "function"
          ? columnDef.editorParams({
              getRow: () => ({ getData: () => rowData })
            })
          : columnDef.editorParams;

      switch (editorType) {
        case "number":
          const numValue = parseFloat(value);
          if (isNaN(numValue))
            throw new Error("Invalid numeric format, please check!");
          return numValue;

        case "list":
          const options =
            editorParams?.values?.map((opt) =>
              typeof opt === "object" ? opt.value : opt
            ) || [];
          const optionLabels =
            editorParams?.values?.map((opt) =>
              typeof opt === "object" ? opt.label : opt
            ) || [];
          if (!options.includes(value)) {
            throw new Error(
              `Invalid option! valid choices are ➜ \n${optionLabels.join(
                ", "
              )}.`
            );
          }
          return value;

        case "input":
        default:
          if (columnDef.validator) {
            const validationResult = columnDef.validator(value);
            if (validationResult !== true) {
              throw new Error(
                validationResult || "Invalid data format, please check!"
              );
            }
          }
          return value;
      }
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
  height: 544px;
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
  height: 544px !important;
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

.tabulator-cell.tabulator-editable {
  cursor: pointer;
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

.tabulator-cell.facility-entry-column.disable-editing {
  background-color: #b6dbb4;
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

.checkbox-column:not(.tabulator-col) {
  padding: 12px 8px !important;
}
</style>
