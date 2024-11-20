<template>
    <div class="parent-container">
        <!-- Header -->
        <div class="header">
            <h1>Incoming Libraries and Samples</h1>

            <!-- Sticky right section for search, advanced filters, and select columns -->
            <div class="sticky-actions">
                <div class="search-bar">
                    <input v-model="searchQuery" type="text" placeholder="Search" @input="onSearch" />
                    <font-awesome-icon icon="fa-solid fa-magnifying-glass" style="color: darkgrey;" />
                </div>
                <div class="button-popup-wrapper">
                    <button @click="toggleAdvancedFilters">
                        <font-awesome-icon icon="fa-solid fa-filter" style="color: white;" /> Advanced Filters
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
                        <font-awesome-icon icon="fa-solid fa-columns" style="color: white;" /> Select Columns
                    </button>

                    <div v-if="showSelectColumns" class="button-popup-container" style="left: -48px">
                        <ul style="padding-left: 0px;">
                            <li v-for="(column, index) in columnsList" :key="index">
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
                <TabulatorTable v-if="!loading" :rowData="filteredLibrariesSamples" :columnDefs="visibleColumns"
                    :tableOptions="tableOptions" @cellValueChanged="onCellValueChanged" />
            </div>
        </div>
    </div>
</template>



<script>
import TabulatorTable from "../components/TabulatorTable.vue";
import { showNotification, handleError, createAxiosObject, urlStringStartsWith } from "../utils/utilities";
const axiosRef = createAxiosObject();
const urlStringStart = urlStringStartsWith();

export default {
    name: "LibrariesSamples",
    components: {
        TabulatorTable,
    },
    data() {
        return {
            loading: true,
            librariesSamplesList: [
                { request_id: 1, request_name: "Request A1", name: "Sample A1", type: "L", barcode: "ABC123L", input_type: "DNA", library_protocol: "Protocol X", concentration: "20ng/µL", mean_fragment_size: "300bp", rqn: "7.8", sequencing_depth: 15, comment_library_input: "No issues", input: "100µL", volume: "5µL", size: "500bp", measuring_unit: "ng/µL", measured_value: "20", gmo_documentation: "Yes", comment: "Sample in good condition" },
                { request_id: 1, request_name: "Request A1", name: "Sample A2", type: "L", barcode: "DEF456L", input_type: "RNA", library_protocol: "Protocol Y", concentration: "25ng/µL", mean_fragment_size: "320bp", rqn: "8.0", sequencing_depth: 20, comment_library_input: "Requires dilution", input: "50µL", volume: "3µL", size: "400bp", measuring_unit: "ng/µL", measured_value: "25", gmo_documentation: "No", comment: "Concentration adjusted" },
                { request_id: 1, request_name: "Request A1", name: "Sample A1", type: "L", barcode: "ABC123L", input_type: "DNA", library_protocol: "Protocol X", concentration: "20ng/µL", mean_fragment_size: "300bp", rqn: "7.8", sequencing_depth: 15, comment_library_input: "No issues", input: "100µL", volume: "5µL", size: "500bp", measuring_unit: "ng/µL", measured_value: "20", gmo_documentation: "Yes", comment: "Sample in good condition" },
                { request_id: 2, request_name: "Request A2", name: "Sample B1", type: "L", barcode: "DEF456L", input_type: "RNA", library_protocol: "Protocol Y", concentration: "25ng/µL", mean_fragment_size: "320bp", rqn: "8.0", sequencing_depth: 20, comment_library_input: "Requires dilution", input: "50µL", volume: "3µL", size: "400bp", measuring_unit: "ng/µL", measured_value: "25", gmo_documentation: "No", comment: "Concentration adjusted" },
                { request_id: 2, request_name: "Request A2", name: "Sample B2", type: "L", barcode: "ABC123L", input_type: "DNA", library_protocol: "Protocol X", concentration: "20ng/µL", mean_fragment_size: "300bp", rqn: "7.8", sequencing_depth: 15, comment_library_input: "No issues", input: "100µL", volume: "5µL", size: "500bp", measuring_unit: "ng/µL", measured_value: "20", gmo_documentation: "Yes", comment: "Sample in good condition" },
                { request_id: 2, request_name: "Request A2", name: "Sample B3", type: "L", barcode: "DEF456L", input_type: "RNA", library_protocol: "Protocol Y", concentration: "25ng/µL", mean_fragment_size: "320bp", rqn: "8.0", sequencing_depth: 20, comment_library_input: "Requires dilution", input: "50µL", volume: "3µL", size: "400bp", measuring_unit: "ng/µL", measured_value: "25", gmo_documentation: "No", comment: "Concentration adjusted" },
                { request_id: 3, request_name: "Request A2", name: "Sample B4", type: "L", barcode: "ABC123L", input_type: "DNA", library_protocol: "Protocol X", concentration: "20ng/µL", mean_fragment_size: "300bp", rqn: "7.8", sequencing_depth: 15, comment_library_input: "No issues", input: "100µL", volume: "5µL", size: "500bp", measuring_unit: "ng/µL", measured_value: "20", gmo_documentation: "Yes", comment: "Sample in good condition" },
                { request_id: 4, request_name: "Request A3", name: "Sample B5", type: "L", barcode: "DEF456L", input_type: "RNA", library_protocol: "Protocol Y", concentration: "25ng/µL", mean_fragment_size: "320bp", rqn: "8.0", sequencing_depth: 20, comment_library_input: "Requires dilution", input: "50µL", volume: "3µL", size: "400bp", measuring_unit: "ng/µL", measured_value: "25", gmo_documentation: "No", comment: "Concentration adjusted" },
                { request_id: 5, request_name: "Request A4", name: "Sample C1", type: "L", barcode: "ABC123L", input_type: "DNA", library_protocol: "Protocol X", concentration: "20ng/µL", mean_fragment_size: "300bp", rqn: "7.8", sequencing_depth: 15, comment_library_input: "No issues", input: "100µL", volume: "5µL", size: "500bp", measuring_unit: "ng/µL", measured_value: "20", gmo_documentation: "Yes", comment: "Sample in good condition" },
                { request_id: 6, request_name: "Request A5", name: "Sample D2", type: "L", barcode: "DEF456L", input_type: "RNA", library_protocol: "Protocol Y", concentration: "25ng/µL", mean_fragment_size: "320bp", rqn: "8.0", sequencing_depth: 20, comment_library_input: "Requires dilution", input: "50µL", volume: "3µL", size: "400bp", measuring_unit: "ng/µL", measured_value: "25", gmo_documentation: "No", comment: "Concentration adjusted" },
                { request_id: 7, request_name: "Request A6", name: "Sample E1", type: "L", barcode: "ABC123L", input_type: "DNA", library_protocol: "Protocol X", concentration: "20ng/µL", mean_fragment_size: "300bp", rqn: "7.8", sequencing_depth: 15, comment_library_input: "No issues", input: "100µL", volume: "5µL", size: "500bp", measuring_unit: "ng/µL", measured_value: "20", gmo_documentation: "Yes", comment: "Sample in good condition" },
                { request_id: 8, request_name: "Request B1", name: "Sample F2", type: "L", barcode: "DEF456L", input_type: "RNA", library_protocol: "Protocol Y", concentration: "25ng/µL", mean_fragment_size: "320bp", rqn: "8.0", sequencing_depth: 20, comment_library_input: "Requires dilution", input: "50µL", volume: "3µL", size: "400bp", measuring_unit: "ng/µL", measured_value: "25", gmo_documentation: "No", comment: "Concentration adjusted" },
                { request_id: 9, request_name: "Request B2", name: "Sample G1", type: "L", barcode: "ABC123L", input_type: "DNA", library_protocol: "Protocol X", concentration: "20ng/µL", mean_fragment_size: "300bp", rqn: "7.8", sequencing_depth: 15, comment_library_input: "No issues", input: "100µL", volume: "5µL", size: "500bp", measuring_unit: "ng/µL", measured_value: "20", gmo_documentation: "Yes", comment: "Sample in good condition" },
                { request_id: 10, request_name: "Request B3", name: "Sample H2", type: "L", barcode: "DEF456L", input_type: "RNA", library_protocol: "Protocol Y", concentration: "25ng/µL", mean_fragment_size: "320bp", rqn: "8.0", sequencing_depth: 20, comment_library_input: "Requires dilution", input: "50µL", volume: "3µL", size: "400bp", measuring_unit: "ng/µL", measured_value: "25", gmo_documentation: "No", comment: "Concentration adjusted" },
            ],
            columnsList: [],
            tableOptions: {
                groupBy: "request_name",
                groupHeader: (value, count, data) => {
                    const totalDepth = data.reduce((sum, row) => sum + (row.sequencing_depth || 0), 0);
                    return `<span style="font-weight: bold; font-size: 14px;">${value}</span><span style="font-weight: normal; font-size: 12px;">(${count} item${count > 1 ? 's' : ''}, Total Depth: ${totalDepth}M)</span>`;
                },
                initialSort: [{ column: "name", dir: "asc" }],
                selectableRangeColumnsDisabled: [0, 1, 2]
            },
            showAdvancedFilters: false,
            filters: {
                showLibraries: true,
                showSamples: true,
            },
            showSelectColumns: false,
        };
    },
    mounted() {
        this.getLibrariesSamples();
        this.setColumns();
    },
    watch: {
        selectedFilter() {
            this.getLibrariesSamples();
        },
    },
    computed: {
        visibleColumns() {
            // Only include columns that have "visible" set to true
            return this.columnsList.filter(column => column.visible);
        },
        filteredLibrariesSamples() {
            return this.librariesSamplesList.filter((row) => {
                if (!this.filters.showLibraries && row.type === "L") return false;
                if (!this.filters.showSamples && row.type === "S") return false;
                return true;
            });
        },
    },
    methods: {
        async getLibrariesSamples() {
            try {
                let response = await axiosRef.get(urlStringStart + "/api/incoming_libraries/");
                let fetchedRows = response.data.map((element) => ({
                    request_id: element.id,
                    name: element.name,
                    type: element.barcode[2] === "L" ? "L" : "S",
                    barcode: element.barcode,
                    input_type: element.input_type || "-",
                    library_protocol: element.library_protocol,
                    concentration: element.concentration || "-",
                    mean_fragment_size: element.mean_fragment_size || "-",
                    rqn: element.rna_quality || "-",
                    request_name: element.request_name,
                    sequencing_depth: element.sequencing_depth || 0,
                }));
                this.librariesSamplesList = fetchedRows;
            } catch (error) {
                handleError(error);
            } finally {
                this.loading = false;
            }
        },
        setColumns() {
            this.columnsList = [
                { title: "Name", field: "name", minWidth: 150, width: "20%", headerFilter: true, visible: true, frozen: true, cssClass: "details-column" },
                { title: "Barcode", field: "barcode", minWidth: 120, width: "12%", headerFilter: true, visible: true, cssClass: "details-column" },
                {
                    title: "From Users", headerHozAlign: "left", vertAlign: "bottom", visible: true, columns: [
                        { title: "Input Type", field: "input_type", minWidth: 120, width: "7.95%", editor: "input", headerVertical: true, visible: true, vertAlign: "bottom", cssClass: "user-entry-column" },
                        { title: "Protocol", field: "library_protocol", minWidth: 120, width: "7.95%", editor: "input", headerVertical: true, visible: true, vertAlign: "bottom", cssClass: "user-entry-column" },
                        { title: "Comment Library/Input", field: "comments", minWidth: 120, width: "7.95%", editor: "input", headerVertical: true, visible: true, vertAlign: "bottom", cssClass: "user-entry-column" },
                        { title: "Input", field: "comments", minWidth: 120, width: "7.95%", editor: "input", headerVertical: true, visible: true, vertAlign: "bottom", cssClass: "user-entry-column" },
                        { title: "Volume", field: "comments", minWidth: 120, width: "7.95%", editor: "input", headerVertical: true, visible: true, vertAlign: "bottom", cssClass: "user-entry-column" },
                        { title: "Size", field: "comments", minWidth: 120, width: "7.95%", editor: "input", headerVertical: true, visible: true, vertAlign: "bottom", cssClass: "user-entry-column" },]
                },
                {
                    title: "From Facility", headerHozAlign: "left", vertAlign: "bottom", visible: true, columns: [
                        { title: "Measuring Unit", field: "comments", minWidth: 120, width: "7.95%", editor: "input", headerVertical: true, visible: true, vertAlign: "bottom", cssClass: "facility-entry-column" },
                        { title: "Measured Value", field: "comments", minWidth: 120, width: "7.95%", editor: "input", headerVertical: true, visible: true, vertAlign: "bottom", cssClass: "facility-entry-column" },
                        { title: "Volume", field: "comments", minWidth: 120, width: "7.95%", editor: "input", headerVertical: true, visible: true, vertAlign: "bottom", cssClass: "facility-entry-column" },
                        { title: "Size", field: "comments", minWidth: 120, width: "7.95%", editor: "input", headerVertical: true, visible: true, vertAlign: "bottom", cssClass: "facility-entry-column" },
                        { title: "RQN", field: "concentration", minWidth: 80, width: "5.30%", editor: "input", headerVertical: true, visible: true, vertAlign: "bottom", cssClass: "facility-entry-column" },
                        { title: "GMO Documentation", field: "mean_fragment_size", minWidth: 80, width: "5.30%", editor: "input", headerFilter: false, headerVertical: true, visible: true, vertAlign: "bottom", cssClass: "facility-entry-column" },
                        { title: "Comment", field: "rqn", minWidth: 80, width: "5.30%", editor: "input", headerVertical: true, visible: true, vertAlign: "bottom", cssClass: "facility-entry-column" },]
                }
            ];
        },
        toggleAdvancedFilters() {
            this.showAdvancedFilters = !this.showAdvancedFilters;
        },
        toggleSelectColumns() {
            this.showSelectColumns = !this.showSelectColumns;
        },
        async onCellValueChanged(updatedData) {
            try {
                await axiosRef.post(urlStringStart + "/api/incoming_libraries/", updatedData);
                const updatedIndex = this.librariesSamplesList.findIndex(
                    (item) => item.request_id === updatedData.request_id
                );
                if (updatedIndex !== -1) {
                    this.$set(this.librariesSamplesList, updatedIndex, {
                        ...this.librariesSamplesList[updatedIndex],
                        ...updatedData
                    });
                }
                showNotification("Update successful", "success");
            } catch (error) {
                handleError(error);
            }
        },
    },
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
    /* Reduce space for cleaner appearance */
}

.header h1 {
    margin: 0;
    font-size: 18px;
    color: white;
    /* Darker text for readability */
}

.sticky-actions {
    position: sticky;
    top: 0;
    display: flex;
    gap: 10px;
    align-items: center;
    z-index: 10;
    padding: 10px 0;
    /* Add padding for separation */
}

.search-bar {
    display: flex;
    align-items: center;
    padding: 0 10px;
    border: 1px solid #ccc;
    /* Neutral border */
    border-radius: 4px;
    /* Slightly rounded corners */
    background-color: #f9f9f9;
    width: 550px;
}

.search-bar input {
    border: none;
    outline: none;
    color: #555;
    /* Neutral text color */
    padding: 10px;
    font-size: 14px;
    flex-grow: 1;
    background: none;
    /* Matches container background */
}

.search-bar input::placeholder {
    color: #888;
    /* Subtle placeholder color */
}

.search-bar i {
    cursor: pointer;
    font-size: 16px;
    color: #aaa;
    /* Neutral icon color */
}

button {
    display: flex;
    align-items: center;
    padding: 10px 15px;
    font-size: 14px;
    background-color: #006c66;
    border: 1px solid white;
    /* Primary color */
    color: white;
    /* Remove default border */
    border-radius: 4px;
    /* Rounded corners */
    cursor: pointer;
    gap: 8px;
    transition: background-color 0.3s ease;
    /* Smooth hover effect */
}

button:hover {
    background-color: #005b59;
    /* Slightly darker hover effect */
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
    /* Neutral border */
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
    /* Interactive appearance */
    padding: 8px 10px;
    border: 1px solid #ddd;
    /* Subtle separation */
    border-radius: 4px;
    transition: background-color 0.3s ease;
    width: 100%;
}

.button-popup-container label:hover {
    background-color: #f0f0f0;
    /* Subtle hover effect */
}

.button-popup-container input[type="checkbox"] {
    width: 20px;
    height: 20px;
    appearance: none;
    /* Remove default styles */
    border: 2px solid #888;
    border-radius: 4px;
    /* Rounded corners */
    background-color: white;
    cursor: pointer;
    display: inline-block;
    position: relative;
}

.button-popup-container input[type="checkbox"]:checked {
    background-color: #006c66;
    border-color: #006c66;
}

.button-popup-container input[type="checkbox"]:checked::before {
    content: '✔';
    font-size: 14px;
    color: white;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.button-popup-wrapper {
    position: relative;
}
</style>
