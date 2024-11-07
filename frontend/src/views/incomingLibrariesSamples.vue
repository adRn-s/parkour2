<template>
    <div class="parent-container"
        style="padding: 10px; display: flex; flex-wrap: wrap; justify-content: space-between;">
        <div class="table-container" style="flex: 1; margin-bottom: 15px;">
            <div style="margin: 10px; border: 1px solid lightgray">
                <TabulatorTable :rowData="LibrariesSamplesList" :columnDefs="columnsList" :tableOptions="tableOptions"
                    @cellValueChanged="onCellValueChanged" />
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
            LibrariesSamplesList: [],
            columnsList: [],
            tableOptions: {
                groupBy: "request_name",
                initialGroupBy: ["request_name"],
                groupHeader: (value, count, data) => {
                    const totalDepth = data.reduce((sum, row) => sum + (row.sequencing_depth || 0), 0);
                    return `<span style="font-weight: bold; font-size: 14px;">${value}</span><span style="font-weight: normal; font-size: 12px;">(${count} item${count > 1 ? 's' : ''}, Total Depth: ${totalDepth}M)</span>`;
                },
                initialSort: [{ column: "name", dir: "asc" }]
            },
        };
    },
    beforeMount() {
        this.getLibrariesSamples();
        this.setColumns();
    },
    watch: {
        selectedFilter() {
            this.getLibrariesSamples();
        },
    },
    methods: {
        async getLibrariesSamples() {
            try {
                const response = await axiosRef.get(urlStringStart + "/api/incoming_libraries/");
                const fetchedRows = response.data.map((element) => ({
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
                this.LibrariesSamplesList = fetchedRows;
            } catch (error) {
                handleError(error);
            }
        },
        setColumns() {
            this.columnsList = [
                { title: "Name", field: "name", minWidth: 150, width: "20%" },
                { title: "Type", field: "type", minWidth: 80, width: "12%" },
                { title: "Barcode", field: "barcode", minWidth: 120, width: "15%" },
                { title: "Input Type", field: "input_type", minWidth: 120, width: "15%", editor: "input" },
                { title: "Protocol", field: "library_protocol", minWidth: 120, width: "15%", editor: "input" },
                { title: "Comment Library/Input", field: "comments", minWidth: 120, width: "15%", editor: "input" },
                { title: "Input", field: "comments", minWidth: 120, width: "15%", editor: "input" },
                { title: "Volume", field: "comments", minWidth: 120, width: "15%", editor: "input" },
                { title: "Size", field: "comments", minWidth: 120, width: "15%", editor: "input" },
                { title: "Measuring Unit", field: "comments", minWidth: 120, width: "15%", editor: "input" },
                { title: "Measured Value", field: "comments", minWidth: 120, width: "15%", editor: "input" },
                { title: "Volume", field: "comments", minWidth: 120, width: "15%", editor: "input" },
                { title: "Size", field: "comments", minWidth: 120, width: "15%", editor: "input" },
                { title: "RQN", field: "concentration", minWidth: 80, width: "10%", editor: "input" },
                { title: "GMO Documentation", field: "mean_fragment_size", minWidth: 80, width: "10%", editor: "input" },
                { title: "Comment", field: "rqn", minWidth: 80, width: "10%", editor: "input" },
            ];
        },
        async onCellValueChanged(updatedData) {
            try {
                await axiosRef.post(urlStringStart + "/api/incoming_libraries/", updatedData);
                showNotification("Update successful", "success");
            } catch (error) {
                handleError(error);
            }
        },
    },
};
</script>

<style>
.table-container {
    width: 100%;
    overflow-x: auto;
    font-size: 14px;
}

.parent-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    padding: 10px;
}
</style>
