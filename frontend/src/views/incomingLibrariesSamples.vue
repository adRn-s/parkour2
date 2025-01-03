<template>
  <div class="parent-container">
    <!-- Loading overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Loading Incoming Libraries and Samples...</p>
    </div>
    <!-- Header -->
    <div class="header">
      <h1>Incoming Libraries and Samples</h1>

      <!-- Sticky right section for search, advanced filters, and select columns -->
      <div class="sticky-actions">
        <div class="search-bar">
          <input ref="searchInput" v-model="searchQuery" type="text" placeholder="Search" />
          <font-awesome-icon icon="fa-solid fa-magnifying-glass" style="color: darkgrey" />
        </div>
        <div class="button-popup-wrapper">
          <button @click="toggleGroups">
            <font-awesome-icon icon="fa-solid fa-layer-group" style="color: white" />
            Toggle Views
          </button>
        </div>
        <div class="button-popup-wrapper">
          <button id="toggleAdvancedFiltersButton" @click="toggleAdvancedFilters">
            <font-awesome-icon icon="fa-solid fa-filter" style="color: white" />
            Advanced Filters
          </button>
          <div id="advancedFiltersPopup" v-if="showAdvancedFilters" class="button-popup-container">
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
          <button id="toggleSelectColumnsButton" @click="toggleSelectColumns">
            <font-awesome-icon icon="fa-solid fa-columns" style="color: white" />
            Select Columns
          </button>
          <div id="selectColumnsPopup" v-if="showSelectColumns" class="button-popup-container"
            style="left: -50px; width: 250px; padding-right: 8px; padding-top: 10px; padding-bottom: 10px;">
            <ul style="padding-left: 0px; padding-right: 10px; max-height: 300px; overflow-y: auto;">
              <li v-for="(column, index) in columnsList" :key="index" style="list-style: none;">
                <template v-if="column.field !== 'select'">
                  <label
                    :style="{ backgroundColor: column.columns ? '#faf1d2' : 'white', cursor: column.columns ? 'default' : 'pointer' }">
                    <input v-if="!column.columns" type="checkbox" :checked="column.visible"
                      @change="toggleColumnVisibility(column, true)" />
                    <span v-if="column.columns"
                      style="display: flex; align-items: center; justify-content: center; border: 2px solid black; padding: 0; height: 18px; width: 18px; border-radius: 3px; text-align: center; background-color: #45bbff; color: white;">
                      🔽
                    </span>
                    {{ column.title }}
                  </label>
                  <ul v-if="column.columns" style="padding-left: 20px;">
                    <li v-for="(subColumn, subIndex) in column.columns" :key="subIndex" style="list-style: none;">
                      <label>
                        <input type="checkbox" :checked="subColumn.visible"
                          @change="toggleColumnVisibility(subColumn, false)" />
                        {{ subColumn.title }}
                      </label>
                    </li>
                  </ul>
                </template>
              </li>
            </ul>
          </div>
        </div>
        <button @click="exportToExcel">
          <font-awesome-icon icon="fa-solid fa-file-excel" style="color: white" />
          Export to Excel
        </button>
      </div>
    </div>

    <!-- Main content section with table -->
    <div class="table-container">
      <div style="margin: 10px">
        <TabulatorTable v-if="!loading" ref="tabulatorTableRef" :rowData="filteredLibrariesSamples"
          :columnDefs="columnsList" :tableOptions="{ ...tableOptions, onCellValueChanged }" />
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
      groupState: 0,
      tableOptions: {
        groupBy: "request_name",
        placeholder: "No Libraries and Samples to show.",
        groupHeader: (value, count, data) => {
          const totalDepth = data.reduce(
            (sum, row) => sum + (row.sequencing_depth || 0),
            0
          );
          return `
  <div style="display: flex; justify-content: space-between; align-items: center;">
<div style="display: flex; justify-content: space-between; align-items: center;">
    ${data.sample_submitted ?
              `
              <div  title="Sample Submitted" style="display: flex; align-items: center;">
                <svg fill="none" width="24px" height="24px" version="1.1" xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <path opacity="0.3" d="M13.8179 4.54512L13.6275 4.27845C12.8298 3.16176 11.1702 3.16176 10.3725 4.27845L10.1821 4.54512C9.76092 5.13471 9.05384 5.45043 8.33373 5.37041L7.48471 5.27608C6.21088 5.13454 5.13454 6.21088 5.27608 7.48471L5.37041 8.33373C5.45043 9.05384 5.13471 9.76092 4.54512 10.1821L4.27845 10.3725C3.16176 11.1702 3.16176 12.8298 4.27845 13.6275L4.54512 13.8179C5.13471 14.2391 5.45043 14.9462 5.37041 15.6663L5.27608 16.5153C5.13454 17.7891 6.21088 18.8655 7.48471 18.7239L8.33373 18.6296C9.05384 18.5496 9.76092 18.8653 10.1821 19.4549L10.3725 19.7215C11.1702 20.8382 12.8298 20.8382 13.6275 19.7215L13.8179 19.4549C14.2391 18.8653 14.9462 18.5496 15.6663 18.6296L16.5153 18.7239C17.7891 18.8655 18.8655 17.7891 18.7239 16.5153L18.6296 15.6663C18.5496 14.9462 18.8653 14.2391 19.4549 13.8179L19.7215 13.6275C20.8382 12.8298 20.8382 11.1702 19.7215 10.3725L19.4549 10.1821C18.8653 9.76092 18.5496 9.05384 18.6296 8.33373L18.7239 7.48471C18.8655 6.21088 17.7891 5.13454 16.5153 5.27608L15.6663 5.37041C14.9462 5.45043 14.2391 5.13471 13.8179 4.54512Z" fill="green"/>
                    <path d="M13.8179 4.54512L13.6275 4.27845C12.8298 3.16176 11.1702 3.16176 10.3725 4.27845L10.1821 4.54512C9.76092 5.13471 9.05384 5.45043 8.33373 5.37041L7.48471 5.27608C6.21088 5.13454 5.13454 6.21088 5.27608 7.48471L5.37041 8.33373C5.45043 9.05384 5.13471 9.76092 4.54512 10.1821L4.27845 10.3725C3.16176 11.1702 3.16176 12.8298 4.27845 13.6275L4.54512 13.8179C5.13471 14.2391 5.45043 14.9462 5.37041 15.6663L5.27608 16.5153C5.13454 17.7891 6.21088 18.8655 7.48471 18.7239L8.33373 18.6296C9.05384 18.5496 9.76092 18.8653 10.1821 19.4549L10.3725 19.7215C11.1702 20.8382 12.8298 20.8382 13.6275 19.7215L13.8179 19.4549C14.2391 18.8653 14.9462 18.5496 15.6663 18.6296L16.5153 18.7239C17.7891 18.8655 18.8655 17.7891 18.7239 16.5153L18.6296 15.6663C18.5496 14.9462 18.8653 14.2391 19.4549 13.8179L19.7215 13.6275C20.8382 12.8298 20.8382 11.1702 19.7215 10.3725L19.4549 10.1821C18.8653 9.76092 18.5496 9.05384 18.6296 8.33373L18.7239 7.48471C18.8655 6.21088 17.7891 5.13454 16.5153 5.27608L15.6663 5.37041C14.9462 5.45043 14.2391 5.13471 13.8179 4.54512Z" stroke="#323232" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9 12L10.8189 13.8189V13.8189C10.9189 13.9189 11.0811 13.9189 11.1811 13.8189V13.8189L15 10" stroke="#323232" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </g>
                </svg>
              </div>`
              :
              `<div  title="Sample not Submitted" style="display: flex; align-items: center;">
                <svg title="Sample not Submitted" fill="none" width="24px" height="24px" style="cursor: auto;" version="1.1" xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <path opacity="0.1" d="M13.8179 4.54512L13.6275 4.27845C12.8298 3.16176 11.1702 3.16176 10.3725 4.27845L10.1821 4.54512C9.76092 5.13471 9.05384 5.45043 8.33373 5.37041L7.48471 5.27608C6.21088 5.13454 5.13454 6.21088 5.27608 7.48471L5.37041 8.33373C5.45043 9.05384 5.13471 9.76092 4.54512 10.1821L4.27845 10.3725C3.16176 11.1702 3.16176 12.8298 4.27845 13.6275L4.54512 13.8179C5.13471 14.2391 5.45043 14.9462 5.37041 15.6663L5.27608 16.5153C5.13454 17.7891 6.21088 18.8655 7.48471 18.7239L8.33373 18.6296C9.05384 18.5496 9.76092 18.8653 10.1821 19.4549L10.3725 19.7215C11.1702 20.8382 12.8298 20.8382 13.6275 19.7215L13.8179 19.4549C14.2391 18.8653 14.9462 18.5496 15.6663 18.6296L16.5153 18.7239C17.7891 18.8655 18.8655 17.7891 18.7239 16.5153L18.6296 15.6663C18.5496 14.9462 18.8653 14.2391 19.4549 13.8179L19.7215 13.6275C20.8382 12.8298 20.8382 11.1702 19.7215 10.3725L19.4549 10.1821C18.8653 9.76092 18.5496 9.05384 18.6296 8.33373L18.7239 7.48471C18.8655 6.21088 17.7891 5.13454 16.5153 5.27608L15.6663 5.37041C14.9462 5.45043 14.2391 5.13471 13.8179 4.54512Z" fill="#323232"/>
                    <path d="M13.8179 4.54512L13.6275 4.27845C12.8298 3.16176 11.1702 3.16176 10.3725 4.27845L10.1821 4.54512C9.76092 5.13471 9.05384 5.45043 8.33373 5.37041L7.48471 5.27608C6.21088 5.13454 5.13454 6.21088 5.27608 7.48471L5.37041 8.33373C5.45043 9.05384 5.13471 9.76092 4.54512 10.1821L4.27845 10.3725C3.16176 11.1702 3.16176 12.8298 4.27845 13.6275L4.54512 13.8179C5.13471 14.2391 5.45043 14.9462 5.37041 15.6663L5.27608 16.5153C5.13454 17.7891 6.21088 18.8655 7.48471 18.7239L8.33373 18.6296C9.05384 18.5496 9.76092 18.8653 10.1821 19.4549L10.3725 19.7215C11.1702 20.8382 12.8298 20.8382 13.6275 19.7215L13.8179 19.4549C14.2391 18.8653 14.9462 18.5496 15.6663 18.6296L16.5153 18.7239C17.7891 18.8655 18.8655 17.7891 18.7239 16.5153L18.6296 15.6663C18.5496 14.9462 18.8653 14.2391 19.4549 13.8179L19.7215 13.6275C20.8382 12.8298 20.8382 11.1702 19.7215 10.3725L19.4549 10.1821C18.8653 9.76092 18.5496 9.05384 18.6296 8.33373L18.7239 7.48471C18.8655 6.21088 17.7891 5.13454 16.5153 5.27608L15.6663 5.37041C14.9462 5.45043 14.2391 5.13471 13.8179 4.54512Z" stroke="#323232" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </g>
                </svg>
              </div>`
            }
  <div>
    <span style="font-weight: bold; font-size: 14px;">${value}</span>
    <span style="font-weight: normal; font-size: 12px;">
      (${count} item${count > 1 ? "s" : ""}, Total Depth: ${totalDepth}M)
    </span>
  </div>
</div>
    <div class="group-action-buttons-container" style="position: sticky; gap: 5px;">
      <div title="Select All" class="group-action-button" onclick="handleGroupButtonClick(event, '${value}', 'selectAll')">
        <svg fill="none" width="24px" height="24px" version="1.1" xmlns="http://www.w3.org/2000/svg">
          <g>
            <path opacity="0.5" d="M21 12H12V3H15.024C19.9452 3 21 4.05476 21 8.976V12Z" fill="lightblue"/>
            <path opacity="0.5" d="M3 15.024V12H12V21H8.976C4.05476 21 3 19.9452 3 15.024Z" fill="lightblue"/>
            <path d="M3 8.976C3 4.05476 4.05476 3 8.976 3H15.024C19.9452 3 21 4.05476 21 8.976V15.024C21 19.9452 19.9452 21 15.024 21H8.976C4.05476 21 3 19.9452 3 15.024V8.976Z" stroke="#323232" stroke-width="2"/>
            <path d="M12 3V21" stroke="#323232" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 12L3 12" stroke="#323232" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
        </svg>
      </div>
      <div title="Deselect All" class="group-action-button" onclick="handleGroupButtonClick(event, '${value}', 'deselectAll')">
        <svg fill="none" width="24px" height="24px" version="1.1" xmlns="http://www.w3.org/2000/svg">
          <g>
            <path opacity="0.5" d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" fill="lightblue"/>
            <path d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" stroke="#323232" stroke-width="2"/>
          </g>
        </svg>
      </div>
      <div title="Mark Request as Sample Submitted" class="group-action-button" onclick="handleGroupButtonClick(event, '${value}', 'sampleSubmitted')">
        <svg fill="none" width="24px" height="24px"version="1.1" xmlns="http://www.w3.org/2000/svg">
          <g>
            <path opacity="0.5" d="M13.8179 4.54512L13.6275 4.27845C12.8298 3.16176 11.1702 3.16176 10.3725 4.27845L10.1821 4.54512C9.76092 5.13471 9.05384 5.45043 8.33373 5.37041L7.48471 5.27608C6.21088 5.13454 5.13454 6.21088 5.27608 7.48471L5.37041 8.33373C5.45043 9.05384 5.13471 9.76092 4.54512 10.1821L4.27845 10.3725C3.16176 11.1702 3.16176 12.8298 4.27845 13.6275L4.54512 13.8179C5.13471 14.2391 5.45043 14.9462 5.37041 15.6663L5.27608 16.5153C5.13454 17.7891 6.21088 18.8655 7.48471 18.7239L8.33373 18.6296C9.05384 18.5496 9.76092 18.8653 10.1821 19.4549L10.3725 19.7215C11.1702 20.8382 12.8298 20.8382 13.6275 19.7215L13.8179 19.4549C14.2391 18.8653 14.9462 18.5496 15.6663 18.6296L16.5153 18.7239C17.7891 18.8655 18.8655 17.7891 18.7239 16.5153L18.6296 15.6663C18.5496 14.9462 18.8653 14.2391 19.4549 13.8179L19.7215 13.6275C20.8382 12.8298 20.8382 11.1702 19.7215 10.3725L19.4549 10.1821C18.8653 9.76092 18.5496 9.05384 18.6296 8.33373L18.7239 7.48471C18.8655 6.21088 17.7891 5.13454 16.5153 5.27608L15.6663 5.37041C14.9462 5.45043 14.2391 5.13471 13.8179 4.54512Z" fill="white"/>
            <path d="M13.8179 4.54512L13.6275 4.27845C12.8298 3.16176 11.1702 3.16176 10.3725 4.27845L10.1821 4.54512C9.76092 5.13471 9.05384 5.45043 8.33373 5.37041L7.48471 5.27608C6.21088 5.13454 5.13454 6.21088 5.27608 7.48471L5.37041 8.33373C5.45043 9.05384 5.13471 9.76092 4.54512 10.1821L4.27845 10.3725C3.16176 11.1702 3.16176 12.8298 4.27845 13.6275L4.54512 13.8179C5.13471 14.2391 5.45043 14.9462 5.37041 15.6663L5.27608 16.5153C5.13454 17.7891 6.21088 18.8655 7.48471 18.7239L8.33373 18.6296C9.05384 18.5496 9.76092 18.8653 10.1821 19.4549L10.3725 19.7215C11.1702 20.8382 12.8298 20.8382 13.6275 19.7215L13.8179 19.4549C14.2391 18.8653 14.9462 18.5496 15.6663 18.6296L16.5153 18.7239C17.7891 18.8655 18.8655 17.7891 18.7239 16.5153L18.6296 15.6663C18.5496 14.9462 18.8653 14.2391 19.4549 13.8179L19.7215 13.6275C20.8382 12.8298 20.8382 11.1702 19.7215 10.3725L19.4549 10.1821C18.8653 9.76092 18.5496 9.05384 18.6296 8.33373L18.7239 7.48471C18.8655 6.21088 17.7891 5.13454 16.5153 5.27608L15.6663 5.37041C14.9462 5.45043 14.2391 5.13471 13.8179 4.54512Z" stroke="#323232" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 12L10.8189 13.8189V13.8189C10.9189 13.9189 11.0811 13.9189 11.1811 13.8189V13.8189L15 10" stroke="#323232" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
        </svg>
      </div>
      <div title="Mark selected as Quality Checked: Passed" class="group-action-button" onclick="handleGroupButtonClick(event, '${value}', 'qualityPassed')">
        <svg fill="none" width="24px" height="24px" version="1.1" xmlns="http://www.w3.org/2000/svg">
          <g>
            <path opacity="0.3" d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" fill="green"/>
            <path d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" stroke="#323232" stroke-width="2"/>
            <path d="M9 12L10.6828 13.6828V13.6828C10.858 13.858 11.142 13.858 11.3172 13.6828V13.6828L15 10" stroke="#323232" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
        </svg>
      </div>
      <div title="Mark selected as Quality Checked: Failed" class="group-action-button" onclick="handleGroupButtonClick(event, '${value}', 'qualityFailed')">
        <svg fill="none" width="24px" height="24px" version="1.1" xmlns="http://www.w3.org/2000/svg">
          <g>
            <path opacity="0.3" d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" fill="red"/>
            <path d="M9 9L15 15" stroke="#323232" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15 9L9 15" stroke="#323232" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" stroke="#323232" stroke-width="2"/>
          </g>
        </svg>
      </div>
      <div title="Mark selected as Quality Checked: Compromised" class="group-action-button" onclick="handleGroupButtonClick(event, '${value}', 'qualityCompromised')">
        <svg fill="none" width="40px" height="40px" version="1.1" xmlns="http://www.w3.org/2000/svg">
          <g>
            <path opacity="0.3" d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" fill="orange"/>
            <path d="M12 8L12 13" stroke="#323232" stroke-width="2" stroke-linecap="round"/>
            <path d="M12 16V15.9888" stroke="#323232" stroke-width="2" stroke-linecap="round"/>
            <path d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" stroke="#323232" stroke-width="2"/>
          </g>
        </svg>
      </div>
    </div>
  </div>
`;
        },
        initialSort: [{ column: "name", dir: "asc" }],
      },
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

    document.addEventListener("click", this.handleOutsideClick);
    window.handleGroupButtonClick = this.handleGroupButtonClick.bind(this);
  },
  updated() {
    this.tabulatorInstance = this.$refs.tabulatorTableRef;
  },
  beforeDestroy() {
    document.removeEventListener("click", this.handleOutsideClick);
  },
  watch: {
    searchQuery() {
      this.onSearch();
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
    }
  },
  methods: {
    async getLibrariesSamples() {
      this.loading = true;
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
          comments_facility: element.comments_facility || ""
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
      }
    },
    setColumns() {
      this.columnsList = [
        {
          field: "select",
          visible: true,
          headerSort: false,
          frozen: true,
          resizable: false,
          formatter: function (cell) {
            const row = cell.getRow();
            const rowData = row.getData();
            const checkbox = `<input type="checkbox" style="top:-4px" ${rowData.selected ? "checked" : ""
              } />`;

            return checkbox;
          },
          hozAlign: "center",
          width: 50,
          contextMenu: () => this.cellContextMenu(false, false, false),
          cellClick: function (e, cell) {
            const clickedRow = cell.getRow();
            const rowData = clickedRow.getData();
            const checkbox = e.target;
            rowData.selected = checkbox.checked;
          }
        },
        {
          title: "Name",
          field: "name",
          minWidth: 220,
          headerFilter: true,
          visible: true,
          frozen: true,
          cssClass: "details-column text-align-left",
          contextMenu: () => this.cellContextMenu(true, false, false),
        },
        {
          title: "Barcode",
          field: "barcode",
          minWidth: 100,
          maxWidth: 160,
          headerFilter: true,
          visible: true,
          frozen: true,
          cssClass: "details-column",
          contextMenu: () => this.cellContextMenu(true, false, false),
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
              minWidth: 80,
              width: "6%",
              headerVertical: true,
              visible: true,
              vertAlign: "bottom",
              cssClass: "user-entry-column",
              contextMenu: () => this.cellContextMenu(true, false, false),
            },
            {
              title: "Protocol",
              field: "library_protocol_name",
              minWidth: 80,
              width: "6%",
              headerVertical: true,
              visible: true,
              vertAlign: "bottom",
              cssClass: "user-entry-column",
              contextMenu: () => this.cellContextMenu(true, false, false),
            },
            {
              title: "Comment Library/Input",
              field: "comments",
              minWidth: 100,
              headerVertical: true,
              visible: true,
              vertAlign: "bottom",
              cssClass: "user-entry-column",
              contextMenu: () => this.cellContextMenu(true, false, false),
            },
            {
              title: "Input",
              field: "input",
              minWidth: 60,
              width: "4%",
              headerVertical: true,
              visible: true,
              vertAlign: "bottom",
              cssClass: "user-entry-column",
              contextMenu: () => this.cellContextMenu(true, false, false),
            },
            {
              title: "Volume",
              field: "volume",
              minWidth: 60,
              width: "4%",
              headerVertical: true,
              visible: true,
              vertAlign: "bottom",
              cssClass: "user-entry-column",
              contextMenu: () => this.cellContextMenu(true, false, false),
              formatter: function (cell) {
                let value = Number(cell.getValue());
                if (!value) {
                  return "-";
                }
                return value % 1 === 0 ? value.toFixed(1) : value;
              }
            },
            {
              title: "Size",
              field: "mean_fragment_size",
              minWidth: 60,
              width: "4%",
              headerVertical: true,
              visible: true,
              vertAlign: "bottom",
              cssClass: "user-entry-column",
              contextMenu: () => this.cellContextMenu(true, false, false),
              formatter: function (cell) {
                let value = Number(cell.getValue());
                if (!value) {
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
              minWidth: 80,
              width: "6%",
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
              contextMenu: () => this.cellContextMenu(true, true, true),
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
              minWidth: 60,
              width: "4%",
              editor: "number",
              headerVertical: true,
              visible: true,
              vertAlign: "bottom",
              cssClass: "facility-entry-column",
              contextMenu: () => this.cellContextMenu(true, true, true),
              formatter: function (cell) {
                let value = Number(cell.getValue());
                if (!value) {
                  return "-";
                }
                if (value) return value % 1 === 0 ? value.toFixed(1) : value;
              }
            },
            {
              title: "Volume",
              field: "sample_volume_facility",
              minWidth: 60,
              width: "4%",
              editor: "number",
              headerVertical: true,
              visible: true,
              vertAlign: "bottom",
              cssClass: "facility-entry-column",
              contextMenu: () => this.cellContextMenu(true, true, true),
              formatter: function (cell) {
                let value = Number(cell.getValue());
                if (!value) {
                  return "-";
                }
                return value % 1 === 0 ? value.toFixed(1) : value;
              }
            },
            {
              title: "Size",
              field: "size_distribution_facility",
              minWidth: 60,
              width: "4%",
              editor: "number",
              headerVertical: true,
              visible: true,
              vertAlign: "bottom",
              cssClass: "facility-entry-column",
              contextMenu: () => this.cellContextMenu(true, true, true),
              formatter: function (cell) {
                let value = Number(cell.getValue());
                if (!value) {
                  return "-";
                }
                return value % 1 === 0 ? value.toFixed(1) : value;
              }
            },
            {
              title: "RQN",
              field: "rna_quality",
              minWidth: 60,
              width: "4%",
              editor: "number",
              headerVertical: true,
              visible: true,
              vertAlign: "bottom",
              cssClass: "facility-entry-column",
              contextMenu: () => this.cellContextMenu(true, true, true),
              formatter: function (cell) {
                let value = Number(cell.getValue());
                if (!value) {
                  return "-";
                }
                return value % 1 === 0 ? value.toFixed(1) : value;
              }
            },
            {
              title: "GMO Documentation",
              field: "gmo",
              minWidth: 60,
              width: "4%",
              editor: "list",
              contextMenu: () => this.cellContextMenu(true, true, true),
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
              minWidth: 100,
              editor: "input",
              headerVertical: true,
              visible: true,
              vertAlign: "bottom",
              cssClass: "facility-entry-column no-right-border",
              contextMenu: () => this.cellContextMenu(true, true, true),
            }
          ]
        }
      ];
    },
    cellContextMenu(allowCopy, allowPaste, allowApplyToAll) {
      const operations = [];
      let isRangeSelected = false;
      let selectedRanges = this.tabulatorInstance.getTable().getRangesData();
      if (selectedRanges.length > 0) {
        let firstRangeFields = Object.keys(selectedRanges[0][0]);
        isRangeSelected = selectedRanges[0].length > 1 || firstRangeFields.length > 1;
      }
      if (isRangeSelected) {
        if (allowCopy)
          operations.push({
            label: "Copy Range",
            action: () => {
              const rangeText = selectedRanges[0]
                .map(row =>
                  Object.values(row).join("\t")
                )
                .join("\n");

              navigator.clipboard.writeText(rangeText).then(() => {
                showNotification("Range copied to clipboard.", "success");
              }).catch(err => {
                showNotification("Failed to copy range.", "error");
              });
            },
          });

        if (allowPaste)
          operations.push({
            label: "Paste Range",
            action: () => {
              const ranges = this.tabulatorInstance.getTable().getRanges();

              if (!ranges || ranges.length === 0) {
                console.warn("No valid range selected for pasting.");
                return;
              }
              const parsedRows = [];

              navigator.clipboard.readText().then((text) => {
                parsedRows.push(text.split("\n").map(row => row.split("\t")));
                console.log(parsedRows);
                console.log(ranges);

                ranges.forEach((range, rangeIndex) => {
                  const startRow = range.start.row;
                  const startColumn = range.start.col;

                  parsedRows.forEach((rowData, rowIndex) => {
                    const targetRow = this.tabulatorInstance.getTable().getRowFromPosition(startRow.index + rowIndex);

                    if (targetRow) {
                      rowData.forEach((cellData, colIndex) => {
                        const targetCell = targetRow.getCell(startColumn.field);
                        if (targetCell) {
                          targetCell.setValue(cellData);
                        }
                      });
                    }
                  });
                });
              });
            },
          });
      } else {
        if (allowCopy) {
          operations.push({
            label: "Copy",
            action: (e, cell) => {
              const value = cell.getValue();
              navigator.clipboard.writeText(value);
            },
          });
        }

        if (allowPaste) {
          operations.push({
            label: "Paste",
            action: (e, cell) => {
              navigator.clipboard.readText().then((text) => {
                cell.setValue(text);
              });
            },
          });
        }

        if (allowApplyToAll) {
          operations.push({
            label: "Apply to All",
            action: (e, cell) => {
              const value = cell.getValue();
              const field = cell.getField();
              this.tabulatorInstance.getTable().getRows().forEach((row) => {
                if (row.getData().request_name === cell.getRow().getData().request_name)
                  row.getCell(field).setValue(value);
              });
            },
          });
        }
      }

      return operations.length ? operations : [];
    },
    handleOutsideClick(event) {
      const advancedFiltersPopup = this.$el.querySelector(
        "#advancedFiltersPopup"
      );
      const advancedFiltersButton = this.$el.querySelector(
        "#toggleAdvancedFiltersButton"
      );
      const selectColumnsPopup = this.$el.querySelector("#selectColumnsPopup");
      const selectColumnsButton = this.$el.querySelector(
        "#toggleSelectColumnsButton"
      );

      if (
        this.showAdvancedFilters &&
        advancedFiltersPopup &&
        !advancedFiltersPopup.contains(event.target) &&
        advancedFiltersButton !== event.target &&
        !advancedFiltersButton.contains(event.target)
      ) {
        this.showAdvancedFilters = false;
      }

      if (
        this.showSelectColumns &&
        selectColumnsPopup &&
        !selectColumnsPopup.contains(event.target) &&
        selectColumnsButton !== event.target &&
        !selectColumnsButton.contains(event.target)
      ) {
        this.showSelectColumns = false;
      }
    },
    toggleGroups() {
      const tabulatorElement = this.tabulatorInstance.getTabulatorElement();
      this.groupState = (this.groupState + 1) % 3;

      switch (this.groupState) {
        case 0:
          tabulatorElement.classList.remove('no-group-by');
          this.tabulatorInstance.getTable().showColumn("select");
          this.tabulatorInstance.getTable().setGroupBy("request_name");
          this.tabulatorInstance.showAllGroups();
          this.tabulatorInstance.refreshTable();
          break;

        case 1:
          tabulatorElement.classList.remove('no-group-by');
          this.tabulatorInstance.getTable().showColumn("select");
          this.tabulatorInstance.getTable().setGroupBy("request_name");
          this.tabulatorInstance.hideAllGroups();
          this.tabulatorInstance.refreshTable();
          break;

        case 2:
          tabulatorElement.classList.add('no-group-by');
          this.tabulatorInstance.getTable().hideColumn("select");
          this.tabulatorInstance.getTable().setGroupBy(false);
          this.tabulatorInstance.refreshTable();
          break;
      }
    },
    toggleAdvancedFilters() {
      this.showAdvancedFilters = !this.showAdvancedFilters;
      if (this.showAdvancedFilters) {
        this.showSelectColumns = false;
      }
    },
    toggleSelectColumns() {
      this.showSelectColumns = !this.showSelectColumns;
      if (this.showSelectColumns) {
        this.showAdvancedFilters = false;
      }
    },
    toggleColumnVisibility(column, isMainColumn) {
      let updatedColumns;

      if (isMainColumn) {
        updatedColumns = this.columnsList.map((col) => ({
          ...col,
          visible: col === column ? !col.visible : col.visible,
        }));
      } else {
        updatedColumns = this.columnsList.map((col) => {
          if (col.columns) {
            return {
              ...col,
              columns: col.columns.map((subCol) => ({
                ...subCol,
                visible: subCol === column ? !subCol.visible : subCol.visible,
              })),
            };
          }
          return col;
        });
      }

      this.columnsList = updatedColumns;
      this.tabulatorInstance.getTable().setColumns(updatedColumns);
    },
    handleGroupButtonClick(event, groupValue, action) {
      console.log(`Action: ${action} for group: ${groupValue}`);
      event.stopPropagation();

      const group = this.tabulatorInstance
        .getTable()
        .getGroups()
        .find((g) => g.getKey() === groupValue);
      if (!group) return;

      const rows = group.getRows();

      switch (action) {
        case "selectAll":
          rows.forEach((row) => {
            row.getData().selected = true;
            row.update({});
            const rowElement = row.getElement();
            const checkbox = rowElement.querySelector('input[type="checkbox"]');
            if (checkbox) {
              checkbox.checked = true;
            }
          });
          this.tabulatorInstance.showAllGroups();
          break;

        case "deselectAll":
          rows.forEach((row) => {
            row.getData().selected = false;
            row.update({});
            const rowElement = row.getElement();
            const checkbox = rowElement.querySelector('input[type="checkbox"]');
            if (checkbox) {
              checkbox.checked = false;
            }
          });
          this.tabulatorInstance.showAllGroups();
          break;

        case "sampleSubmitted":
          break;

        case "qualityPassed":
          rows.forEach((row) => {
            if (row.getData().selected) {
              console.log(`Marked ${row.getData().name} as Passed`);
              row.update({ qualityCheck: "Passed" });
            }
          });
          break;

        case "qualityCompromised":
          rows.forEach((row) => {
            if (row.getData().selected) {
              console.log(`Marked ${row.getData().name} as Compromised`);
              row.update({ qualityCheck: "Compromised" });
            }
          });
          break;

        case "qualityFailed":
          rows.forEach((row) => {
            if (row.getData().selected) {
              console.log(`Marked ${row.getData().name} as Failed`);
              row.update({ qualityCheck: "Failed" });
            }
          });
          break;
      }

    },
    setFilters() {
      let filteredData = this.librariesSamplesList.filter((row) => {
        if (!this.filters.showLibraries && row.type === "L") return false;
        if (!this.filters.showSamples && row.type === "S") return false;
        return true;
      });

      this.filteredLibrariesSamples = filteredData;
      this.tabulatorInstance.getTable().setData(filteredData).then(() => {
        this.tabulatorInstance.showAllGroups();
      });
    },
    onSearch() {
      let lowercasedQuery = this.searchQuery.toLowerCase();
      let filteredData = [];

      if (lowercasedQuery.trim() === "") {
        filteredData = [...this.librariesSamplesList];
        this.tabulatorInstance.getTable().setData(filteredData).then(() => {
          this.tabulatorInstance.showAllGroups();
        });
        this.filteredLibrariesSamples = filteredData;
      } else {
        filteredData = [...this.librariesSamplesList].filter((row) => {
          return (
            (row.request_name && row.request_name.toLowerCase().includes(lowercasedQuery)) ||
            (row.name && row.name.toLowerCase().includes(lowercasedQuery)) ||
            (row.barcode &&
              row.barcode.toLowerCase().includes(lowercasedQuery)) ||
            (row.nucleic_acid_type_name &&
              row.nucleic_acid_type_name
                .toLowerCase()
                .includes(lowercasedQuery)) ||
            (row.library_protocol_name &&
              row.library_protocol_name
                .toLowerCase()
                .includes(lowercasedQuery)) ||
            (row.comments &&
              row.comments.toLowerCase().includes(lowercasedQuery))
          );
        });
        this.tabulatorInstance.getTable().setData(filteredData).then(() => {
          this.tabulatorInstance.showAllGroups();
        });
        this.filteredLibrariesSamples = filteredData;
      }
      this.$nextTick(() => {
        this.$refs.searchInput.focus();
      });
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

        await axiosRef.post(
          `${urlStringStart}/api/incoming_libraries/edit/`,
          JSON.stringify(payload)
        );
        showNotification("Record updated successfully.", "success");
      } catch (error) {
        console.log(error);
        handleError(error);
      }
    },
    exportToExcel() {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0");
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const year = today.getFullYear();
      const formattedDate = `${day}_${month}_${year}`;
      const filename = `Incoming_Libraries_&_Samples_${formattedDate}.xlsx`;

      this.tabulatorInstance.showAllGroups();
      this.tabulatorInstance.getTable().download("xlsx", filename, {
        sheetName: "Incoming Libraries & Samples"
      });

      showNotification("Data Exported Successfully.", "success");
    }
  }
};
</script>

<style>
.parent-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
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
  border: 2px solid #ccc;
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
  border: 2px solid #ddd;
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
  cursor: pointer;
  display: inline-block;
  position: relative;
  border: 2px solid #333;
  background-color: #33333310;
  appearance: none;
  border-radius: 4px;
}

input[type="checkbox"]:checked {
  background-color: #45bbff;
}

input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 4px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 3px 3px 0;
  transform: rotate(45deg);
  box-sizing: border-box;
}

.group-action-buttons-container {
  display: none;
  margin: 0 10px;
  margin-left: 15px;
  padding: 0 10px;
  border-left: 1px solid grey;
}

.tabulator-row:hover .group-action-buttons-container {
  display: flex;
}

.group-action-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 0 5px;
  height: 24px;
  width: 24px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 8px solid rgba(0, 0, 0, 0.1);
  border-top: 8px solid #006c66;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.loading-overlay p {
  margin-top: 10px;
  margin-left: 10px;
  font-size: 15px;
  color: #555;
}
</style>
