<template>
    <div class="parent-container">
        <!-- Header -->
        <div class="header">
            <h1>Incoming Libraries and Samples</h1>

            <!-- Sticky right section for search, advanced filters, and select columns -->
            <div class="sticky-actions">
                <div class="search-bar">
                    <input v-model="searchQuery" type="text" placeholder="Search" />
                    <font-awesome-icon icon="fa-solid fa-magnifying-glass" style="color: darkgrey" />
                </div>
                <div class="button-popup-wrapper">
                    <button @click="toggleAdvancedFilters">
                        <font-awesome-icon icon="fa-solid fa-filter" style="color: white" />
                        Advanced Filters
                    </button>
                    <div v-if="showAdvancedFilters" class="button-popup-container">
                        <label>
                            <input type="checkbox" v-model="filters.showLibraries" />
                            Show Libraries
                        </label>
                        <label>
                            <input type="checkbox" v-model="filters.showSamples" />
                            Show Samples
                        </label>
                    </div>
                </div>
                <div class="button-popup-wrapper">
                    <button @click="toggleSelectColumns">
                        <font-awesome-icon icon="fa-solid fa-columns" style="color: white" />
                        Select Columns
                    </button>

                    <div v-if="showSelectColumns" class="button-popup-container" style="left: -48px">
                        <ul style="padding-left: 0px">
                            <li v-for="(column, index) in columnsList.filter(
                                (column) => column.field !== 'select'
                            )" :key="index">
                                <label>
                                    <input type="checkbox" v-model="column.visible" />
                                    {{ column.title }}
                                </label>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main content section with table -->
        <div class="table-container">
            <div style="margin: 10px; border: 1px solid lightgray">
                <TabulatorTable v-if="!loading" ref="tabulatorTableRef" :rowData="filteredLibrariesSamples"
                    :columnDefs="currentVisibleColumns" :tableOptions="{ ...tableOptions, onCellValueChanged }" />
            </div>
        </div>
    </div>
</template>

<script>
import TabulatorTable from "../components/TabulatorTable.vue";
import {
    showNotification,
    handleError,
    createAxiosObject,
    urlStringStartsWith
} from "../utils/utilities";
const axiosRef = createAxiosObject();
const urlStringStart = urlStringStartsWith();

export default {
    name: "LibrariesSamples",
    components: {
        TabulatorTable
    },
    data() {
        return {
            tabulatorInstance: null,
            loading: true,
            librariesSamplesList: [],
            filteredLibrariesSamples: [],
            columnsList: [],
            tableOptions: {
                groupBy: "request_name",
                groupHeader: (value, count, data) => {
                    const totalDepth = data.reduce(
                        (sum, row) => sum + (row.sequencing_depth || 0),
                        0
                    );

                    return `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <label class="switch">
                        <input type="checkbox" style="top:2.5px">
                    </label>
                    <span style="font-weight: bold; font-size: 14px;">${value}</span>
                    <span style="font-weight: normal; font-size: 12px;">(${count} item${count > 1 ? "s" : ""
                        }, Total Depth: ${totalDepth}M)</span>
                </div>
                <div class="group-action-buttons-container" style="position: sticky; right: 0; gap: 10px;">
                    <button title="Select All" class="group-action-button" onclick="handleGroupButtonClick(event, '${value}', 'selectAll')">
                        <i class="fas fa-square" style="color: blue;"></i>
                    </button>
                    <button title="Deselect All" class="group-action-button" onclick="handleGroupButtonClick(event, '${value}', 'deselectAll')">
                        <i class="fas fa-square" style="color: blue;"></i>
                    </button>
                    <button title="Mark Request as Sample Submitted" class="group-action-button" onclick="handleGroupButtonClick(event, '${value}', 'sampleSubmitted')">
                    <i class="fas fa-square" style="color: blue;"></i>
                    </button>
                    <button title="Mark selected as Quality Checked: Passed" class="group-action-button" onclick="handleGroupButtonClick(event, '${value}', 'qualityPassed')">
                        <i class="fas fa-check-circle" style="color: green;"></i>
                    </button>
                    <button title="Mark selected as Quality Checked: Compromised" class="group-action-button" onclick="handleGroupButtonClick(event, '${value}', 'qualityCompromised')">
                        <i class="fas fa-exclamation-circle" style="color: orange;"></i>
                    </button>
                    <button title="Mark selected as Quality Checked: Failed" class="group-action-button" onclick="handleGroupButtonClick(event, '${value}', 'qualityFailed')">
                        <i class="fas fa-times-circle" style="color: red;"></i>
                    </button>
                </div>
            </div>
        `;
                },
                initialSort: [{ column: "name", dir: "asc" }],
                rowContextMenu: [
                    {
                        label: "Apply to All",
                        action: function (e, row) { }
                    }
                ]
            },
            currentSelectedRows: [],
            showAdvancedFilters: false,
            filters: {
                showLibraries: true,
                showSamples: true
            },
            searchQuery: "",
            showSelectColumns: false,
            libraryProtocols: []
        };
    },
    mounted() {
        // this.getLibraryProtocols();
        this.getLibrariesSamples();
        this.setColumns();

        window.handleGroupButtonClick = this.handleGroupButtonClick.bind(this);
    },
    watch: {
        searchQuery() {
            this.onSearch();
        },
        selectedFilter() {
            this.getLibrariesSamples();
        },
        "filters.showLibraries"(newValue, oldValue) {
            if (newValue !== oldValue) {
                this.setFilters();
            }
        },
        "filters.showSamples"(newValue, oldValue) {
            if (newValue !== oldValue) {
                this.setFilters();
            }
        },
    },
    computed: {
        currentVisibleColumns() {
            return this.columnsList.filter((column) => column.visible);
        },
    },
    methods: {
        async getLibrariesSamples() {
            try {
                let response = await axiosRef.get(
                    urlStringStart + "/api/incoming_libraries/"
                );
                let fetchedRows = response.data.map((element) => ({
                    pk: element.pk,
                    record_type: element.record_type,
                    request_id: element.request,
                    request_name: element.request_name,
                    name: element.name,
                    type: element.barcode[2] === "L" ? "L" : "S",
                    barcode: element.barcode,
                    sample_submitted: element.sample_submitted,
                    nucleic_acid_type_name: element.nucleic_acid_type_name || "-",
                    library_protocol_name: element.library_protocol_name,
                    measuring_unit: element.measuring_unit,
                    measured_value: element.measured_value,
                    input:
                        element.measuring_unit === "concentration"
                            ? `${String(element.measured_value || "")} ng/µl`
                            : element.measuring_unit === "m"
                                ? `${String(element.measured_value || "")} M`
                                : element.measuring_unit !== "-"
                                    ? `${String(element.measured_value || "")} ${String(
                                        element.measuring_unit
                                    )}`
                                    : `${String(element.measured_value || "")}`,
                    volume: element.volume || "-",
                    mean_fragment_size: element.mean_fragment_size || "-",
                    comments: element.comments,
                    measuring_unit_facility: element.measuring_unit_facility || "-",
                    measured_value_facility: element.measured_value_facility || "-",
                    sample_volume_facility: element.sample_volume_facility || "-",
                    size_distribution_facility: element.size_distribution_facility || "-",
                    rna_quality: element.rna_quality || "-",
                    gmo: element.gmo,
                    comments_facility: element.comments_facility
                }));
                this.librariesSamplesList = fetchedRows;
                this.filteredLibrariesSamples = fetchedRows;
            } catch (error) {
                handleError(error);
            } finally {
                this.loading = false;
            }
        },
        async getLibraryProtocols() {
            try {
                let response = await axiosRef.get(
                    urlStringStart + "/api/library_protocols/"
                );
                let fetchedRows = response.data;
                this.libraryProtocols = fetchedRows;
            } catch (error) {
                handleError(error);
            } finally {
                this.loading = false;
            }
        },
        setColumns() {
            this.columnsList = [
                {
                    field: "select",
                    visible: true,
                    headerSort: false,
                    frozen: true,
                    formatter: function (cell) {
                        const row = cell.getRow();
                        const rowData = row.getData();
                        const checkbox = `<input type="checkbox" style="top:-4px" ${rowData.selected ? "checked" : ""
                            } />`;

                        return checkbox;
                    },
                    hozAlign: "center",
                    width: 50,
                    cellClick: function (e, cell) {
                        const clickedRow = cell.getRow();
                        const rowData = clickedRow.getData();
                        const checkbox = e.target;

                        rowData.selected = checkbox.checked;

                        if (rowData.selected) {
                            this.currentSelectedRows.push(rowData);
                        } else {
                            let currentSelectedRows = this.currentSelectedRows.filter(r => r.id !== rowData.id);
                            this.currentSelectedRows = currentSelectedRows;
                        }

                        const selectedRows = clickedRow.getTable().getRows().filter(row => row.getData().selected);

                        const selectedGroups = new Set(
                            selectedRows.map(row => {
                                const group = row.getGroup();
                                return group ? group.key : null;
                            })
                        );

                        clickedRow.getTable().getRows().forEach(row => {
                            const rowGroup = row.getGroup();
                            const rowElement = row.getElement();
                            const checkbox = rowElement.querySelector("input[type=checkbox]");

                            if (rowGroup && !selectedGroups.has(rowGroup.key)) {
                                if (checkbox) checkbox.disabled = true;
                            } else {
                                if (checkbox) checkbox.disabled = false;
                            }
                        });
                    }
                },
                {
                    title: "Name",
                    field: "name",
                    minWidth: 150,
                    width: "20%",
                    headerFilter: true,
                    visible: true,
                    frozen: true,
                    cssClass: "details-column"
                },
                {
                    title: "Barcode",
                    field: "barcode",
                    minWidth: 120,
                    width: "12%",
                    headerFilter: true,
                    visible: true,
                    frozen: true,
                    cssClass: "details-column"
                },
                {
                    title: "From Users",
                    headerHozAlign: "left",
                    vertAlign: "bottom",
                    visible: true,
                    columns: [
                        {
                            title: "Input Type",
                            field: "nucleic_acid_type_name",
                            minWidth: 120,
                            width: "7.95%",
                            headerVertical: true,
                            visible: true,
                            vertAlign: "bottom",
                            cssClass: "user-entry-column"
                        },
                        {
                            title: "Protocol",
                            field: "library_protocol_name",
                            minWidth: 120,
                            width: "7.95%",
                            headerVertical: true,
                            visible: true,
                            vertAlign: "bottom",
                            cssClass: "user-entry-column"
                        },
                        {
                            title: "Comment Library/Input",
                            field: "comments",
                            minWidth: 120,
                            width: "7.95%",
                            headerVertical: true,
                            visible: true,
                            vertAlign: "bottom",
                            cssClass: "user-entry-column"
                        },
                        {
                            title: "Input",
                            field: "input",
                            minWidth: 120,
                            width: "7.95%",
                            headerVertical: true,
                            visible: true,
                            vertAlign: "bottom",
                            cssClass: "user-entry-column"
                        },
                        {
                            title: "Volume",
                            field: "volume",
                            minWidth: 120,
                            width: "7.95%",
                            headerVertical: true,
                            visible: true,
                            vertAlign: "bottom",
                            cssClass: "user-entry-column",
                            formatter: function (cell) {
                                let value = cell.getValue();
                                if (value === null || value === undefined) {
                                    return "-";
                                }
                                return value % 1 === 0 ? value.toFixed(1) : value;
                            }
                        },
                        {
                            title: "Size",
                            field: "mean_fragment_size",
                            minWidth: 120,
                            width: "7.95%",
                            headerVertical: true,
                            visible: true,
                            vertAlign: "bottom",
                            cssClass: "user-entry-column",
                            formatter: function (cell) {
                                let value = cell.getValue();
                                if (value === null || value === undefined) {
                                    return "-";
                                }
                                return value % 1 === 0 ? value.toFixed(1) : value;
                            }
                        }
                    ]
                },
                {
                    title: "From Facility",
                    headerHozAlign: "left",
                    vertAlign: "bottom",
                    visible: true,
                    columns: [
                        {
                            title: "Measuring Unit",
                            field: "measuring_unit_facility",
                            minWidth: 120,
                            width: "7.95%",
                            editor: "list",
                            editorParams: {
                                values: [
                                    { label: "ng/µl (Concentration)", value: "concentration" },
                                    { label: "M (Cells)", value: "m" },
                                    { label: "Unknown", value: "-" }
                                ]
                            },
                            headerVertical: true,
                            visible: true,
                            vertAlign: "bottom",
                            cssClass: "facility-entry-column",
                            formatter: function (cell) {
                                const value = cell.getValue();
                                const options = {
                                    concentration: "ng/µl (Concentration)",
                                    m: "M (Cells)",
                                    "-": "Unknown"
                                };
                                return options[value] || value || "";
                            }
                        },
                        {
                            title: "Measured Value",
                            field: "measured_value_facility",
                            minWidth: 120,
                            width: "7.95%",
                            editor: "number",
                            headerVertical: true,
                            visible: true,
                            vertAlign: "bottom",
                            cssClass: "facility-entry-column",
                            formatter: function (cell) {
                                let value = cell.getValue();
                                if (value === null || value === undefined) {
                                    return "-";
                                }
                                return value % 1 === 0 ? value.toFixed(1) : value;
                            }
                        },
                        {
                            title: "Volume",
                            field: "sample_volume_facility",
                            minWidth: 120,
                            width: "7.95%",
                            editor: "number",
                            headerVertical: true,
                            visible: true,
                            vertAlign: "bottom",
                            cssClass: "facility-entry-column",
                            formatter: function (cell) {
                                let value = cell.getValue();
                                if (value === null || value === undefined) {
                                    return "-";
                                }
                                return value % 1 === 0 ? value.toFixed(1) : value;
                            }
                        },
                        {
                            title: "Size",
                            field: "size_distribution_facility",
                            minWidth: 120,
                            width: "7.95%",
                            editor: "number",
                            headerVertical: true,
                            visible: true,
                            vertAlign: "bottom",
                            cssClass: "facility-entry-column",
                            formatter: function (cell) {
                                let value = cell.getValue();
                                if (value === null || value === undefined) {
                                    return "-";
                                }
                                return value % 1 === 0 ? value.toFixed(1) : value;
                            }
                        },
                        {
                            title: "RQN",
                            field: "rna_quality",
                            minWidth: 80,
                            width: "5.30%",
                            editor: "number",
                            headerVertical: true,
                            visible: true,
                            vertAlign: "bottom",
                            cssClass: "facility-entry-column",
                            formatter: function (cell) {
                                let value = cell.getValue();
                                if (value === null || value === undefined) {
                                    return "-";
                                }
                                return value % 1 === 0 ? value.toFixed(1) : value;
                            }
                        },
                        {
                            title: "GMO Documentation",
                            field: "gmo",
                            minWidth: 80,
                            width: "5.30%",
                            editor: "list",
                            editorParams: {
                                values: [
                                    { label: "Not Needed", value: "false" },
                                    { label: "Risk Assessment Done", value: "true" }
                                ]
                            },
                            headerFilter: false,
                            headerVertical: true,
                            visible: true,
                            vertAlign: "bottom",
                            cssClass: "facility-entry-column",
                            formatter: function (cell) {
                                const value = cell.getValue();
                                const options = {
                                    false: "Not Needed",
                                    true: "Risk Assessment Done"
                                };
                                return options[value] || value || "";
                            }
                        },
                        {
                            title: "Comment",
                            field: "comments_facility",
                            minWidth: 80,
                            width: "5.30%",
                            editor: "input",
                            headerVertical: true,
                            visible: true,
                            vertAlign: "bottom",
                            cssClass: "facility-entry-column"
                        }
                    ]
                }
            ];
        },
        toggleAdvancedFilters() {
            this.showAdvancedFilters = !this.showAdvancedFilters;
        },
        toggleSelectColumns() {
            this.showSelectColumns = !this.showSelectColumns;
        },
        handleGroupButtonClick(event, groupValue, action) {
            console.log(`Action: ${action} for group: ${groupValue}`);
            event.stopPropagation(); // Prevent the group toggle behavior
            if (this.tabulatorInstance == null) {
                const table = this.$refs.tabulatorTableRef.getTable();
                this.tabulatorInstance = table;
            } // Access Tabulator instance
            if (!this.tabulatorInstance) {
                console.error("Tabulator instance is not available");
                return;
            }

            console.log("ss", this.tabulatorInstance);

            console.log("rrrr00", this.tabulatorInstance.getGroups())

            const group = this.tabulatorInstance
                .getGroups()
                .find((g) => g.getKey() === groupValue);
            if (!group) return;

            const rows = group.getRows();


            switch (action) {
                case "selectAll":
                    rows.forEach((row) => {
                            row.getData().selected = true;
                            row.update({});
                    });
                    break;

                case "deselectAll":
                    rows.forEach((row) => {
                        row.getData().selected = false;
                        row.update({});
                    });
                    break;

                case "qualityPassed":
                    rows.forEach((row) => {
                        console.log(`Marked ${row.getData().name} as Passed`);
                        row.update({ qualityCheck: "Passed" });
                    });
                    break;

                case "qualityCompromised":
                    rows.forEach((row) => {
                        console.log(`Marked ${row.getData().name} as Compromised`);
                        row.update({ qualityCheck: "Compromised" });
                    });
                    break;

                case "qualityFailed":
                    rows.forEach((row) => {
                        console.log(`Marked ${row.getData().name} as Failed`);
                        row.update({ qualityCheck: "Failed" });
                    });
                    break;
            }

            this.tabulatorInstance.redraw();
        },
        setFilters() {
            // Convert the filter options into the necessary filtering logic
            let filteredData = this.librariesSamplesList.filter((row) => {
                // If the filter option for 'showLibraries' is false and the row type is "L", exclude it
                if (!this.filters.showLibraries && row.type === "L") return false;

                // If the filter option for 'showSamples' is false and the row type is "S", exclude it
                if (!this.filters.showSamples && row.type === "S") return false;

                // Otherwise, return the row as it passes the filter conditions
                return true;
            });

            // Update the filtered data in the component state
            this.filteredLibrariesSamples = filteredData;

            // Ensure tabulatorInstance is available before setting data
            if (this.tabulatorInstance == null) {
                // Get the Tabulator instance (if not already set)
                const table = this.$refs.tabulatorTableRef.getTable();
                this.tabulatorInstance = table;
            }

            // Update Tabulator with the filtered data
            this.tabulatorInstance.setData(filteredData);

            console.log("Filtered data applied to Tabulator:", this.tabulatorInstance);
        },
        onSearch() {
            let lowercasedQuery = this.searchQuery.toLowerCase();
            let filteredData = [];
            if (lowercasedQuery.trim() === "") {
                filteredData = [...this.librariesSamplesList];
            } else {
                filteredData = this.librariesSamplesList.filter(row => {
                    return (
                        (row.name && row.name.toLowerCase().includes(lowercasedQuery)) ||
                        (row.barcode && row.barcode.toLowerCase().includes(lowercasedQuery)) ||
                        (row.nucleic_acid_type_name && row.nucleic_acid_type_name.toLowerCase().includes(lowercasedQuery)) ||
                        (row.library_protocol_name && row.library_protocol_name.toLowerCase().includes(lowercasedQuery)) ||
                        (row.comments && row.comments.toLowerCase().includes(lowercasedQuery))
                    );
                });
                this.filteredLibrariesSamples = filteredData;
                if (this.tabulatorInstance == null) {
                    const table = this.$refs.tabulatorTableRef.getTable();
                    this.tabulatorInstance = table;
                }
                this.tabulatorInstance.setData(filteredData)
                console.log("in", this.tabulatorInstance);

            }
        },
        async onCellValueChanged(rowData, updatedData) {
            try {
                const payload = {
                    data: [
                        {
                            pk: rowData.pk,
                            record_type: rowData.record_type,
                            [updatedData.field]: updatedData.value
                        }
                    ]
                };

                const response = await axiosRef.post(
                    `${urlStringStart}/api/incoming_libraries/edit/`,
                    JSON.stringify(jsonObject)
                );
                showNotification("Record updated successfully.", "success");
            } catch (error) {
                console.log(error);
                handleError(error);
            }
        }
    }
};
</script>

<style>
.parent-container {
    display: flex;
    flex-direction: column;
    padding: 10px;
}

.table-container {
    width: 100%;
    overflow-x: auto;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    width: 100%;
    height: 70px;
    margin-bottom: 10px;
}

.header h1 {
    margin: 0;
    font-size: 18px;
    color: white;
}

.sticky-actions {
    position: sticky;
    top: 0;
    display: flex;
    gap: 10px;
    align-items: center;
    z-index: 10;
    padding: 10px 0;
}

.search-bar {
    display: flex;
    align-items: center;
    padding: 0 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #f9f9f9;
    width: 550px;
}

.search-bar input {
    border: none;
    outline: none;
    color: #555;
    padding: 10px;
    font-size: 14px;
    flex-grow: 1;
    background: none;
}

.search-bar input::placeholder {
    color: #888;
}

.search-bar i {
    cursor: pointer;
    font-size: 16px;
    color: #aaa;
}

button {
    display: flex;
    align-items: center;
    padding: 10px 15px;
    font-size: 14px;
    background-color: #006c66;
    border: 1px solid white;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    gap: 8px;
    transition: background-color 0.3s ease;
}

button:hover {
    background-color: #005b59;
}

button i {
    font-size: 16px;
}

.button-popup-container {
    position: absolute;
    top: 100%;
    left: 0;
    background-color: white;
    border: 1px solid #ccc;
    padding: 15px 15px 8px 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    z-index: 100;
    border-radius: 4px;
    width: 200px;
}

.button-popup-container label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: black;
    margin-bottom: 10px;
    cursor: pointer;
    padding: 8px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    transition: background-color 0.3s ease;
    width: 100%;
}

.button-popup-container label:hover {
    background-color: #f0f0f0;
}

.button-popup-wrapper {
    position: relative;
}

input[type="checkbox"] {
    width: 18px;
    height: 18px;
    appearance: none;
    border: 2px solid #888;
    border-radius: 4px;
    background-color: white;
    cursor: pointer;
    display: inline-block;
    position: relative;
}

input[type="checkbox"]:checked {
    background-color: #006c66;
    border-color: #006c66;
}

input[type="checkbox"]:checked::before {
    content: "✔";
    font-size: 14px;
    color: white;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.group-action-buttons-container {
    position: sticky;
    right: 0;
    /* Position it to the right */
    display: flex;
    justify-content: flex-end;
    /* Align buttons to the right */
    background-color: white;
    /* Prevent overlap from background elements */
    z-index: 10;
    /* Ensure it stays above other content */
    padding: 0 10px;
    /* Add some padding for spacing */
    border-left: 1px solid #ddd;
    /* Optional: adds a subtle separator */
}

.group-action-button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    padding: 0 5px;
}

.group-action-button:hover {
    color: #007bff;
    /* Change color on hover */
}
</style>
