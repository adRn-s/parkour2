/**
 * List compiled by mystix on the extjs.com forums.
 * Thank you Mystix!
 *
 * English (UK) Translations
 * updated to 2.2 by Condor (8 Aug 2008)
 * updated by Dawesi (7 Dec 2012)
 */
Ext.onReady(function () {
  if (Ext.Date) {
    Ext.Date.defaultDateFormat = "d/m/Y";
    Ext.Date.monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];

    Ext.Date.getShortMonthName = function (month) {
      return Ext.Date.monthNames[month].substring(0, 3);
    };

    Ext.Date.monthNumbers = {
      January: 0,
      Jan: 0,
      February: 1,
      Feb: 1,
      March: 2,
      Mar: 2,
      April: 3,
      Apr: 3,
      May: 4,
      June: 5,
      Jun: 5,
      July: 6,
      Jul: 6,
      August: 7,
      Aug: 7,
      September: 8,
      Sep: 8,
      October: 9,
      Oct: 9,
      November: 10,
      Nov: 10,
      December: 11,
      Dec: 11
    };

    Ext.Date.getMonthNumber = function (name) {
      return Ext.Date.monthNumbers[
        name.substring(0, 1).toUpperCase() + name.substring(1, 3).toLowerCase()
      ];
    };

    Ext.Date.dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ];

    Ext.Date.getShortDayName = function (day) {
      return Ext.Date.dayNames[day].substring(0, 3);
    };

    Ext.Date.parseCodes.S.s = "(?:st|nd|rd|th)";

    Ext.Date.firstDayOfWeek = 0;
    Ext.Date.weekendDays = [6, 0];
  }

  if (Ext.util && Ext.util.Format) {
    Ext.apply(Ext.util.Format, {
      thousandSeparator: ",",
      decimalSeparator: ".",
      currencySign: "£",
      // UK Pound
      dateFormat: "d/m/Y"
    });
  }
});

Ext.define("Ext.locale.en_GB.data.validator.Bound", {
  override: "Ext.data.validator.Bound",
  emptyMessage: "Must be present"
});

Ext.define("Ext.locale.en_GB.data.validator.Email", {
  override: "Ext.data.validator.Email",
  message: "Is not a valid email address"
});

Ext.define("Ext.locale.en_GB.data.validator.Exclusion", {
  override: "Ext.data.validator.Exclusion",
  message: "Is a value that has been excluded"
});

Ext.define("Ext.locale.en_GB.data.validator.Format", {
  override: "Ext.data.validator.Format",
  message: "Is in the wrong format"
});

Ext.define("Ext.locale.en_GB.data.validator.Inclusion", {
  override: "Ext.data.validator.Inclusion",
  message: "Is not in the list of acceptable values"
});

Ext.define("Ext.locale.en_GB.data.validator.Length", {
  override: "Ext.data.validator.Length",
  minOnlyMessage: "Length must be at least {0}",
  maxOnlyMessage: "Length must be no more than {0}",
  bothMessage: "Length must be between {0} and {1}"
});

Ext.define("Ext.locale.en_GB.data.validator.Presence", {
  override: "Ext.data.validator.Presence",
  message: "Must be present"
});

Ext.define("Ext.locale.en_GB.data.validator.Range", {
  override: "Ext.data.validator.Range",
  minOnlyMessage: "Must be must be at least {0}",
  maxOnlyMessage: "Must be no more than than {0}",
  bothMessage: "Must be between {0} and {1}",
  nanMessage: "Must be numeric"
});

Ext.define("Ext.locale.en_GB.view.View", {
  override: "Ext.view.View",
  emptyText: ""
});

Ext.define("Ext.locale.en_GB.grid.plugin.DragDrop", {
  override: "Ext.grid.plugin.DragDrop",
  dragText: "{0} selected row{1}"
});

// changing the msg text below will affect the LoadMask
Ext.define("Ext.locale.en_GB.view.AbstractView", {
  override: "Ext.view.AbstractView",
  loadingText: "Loading..."
});

Ext.define("Ext.locale.en_GB.picker.Date", {
  override: "Ext.picker.Date",
  todayText: "Today",
  minText: "This date is before the minimum date",
  maxText: "This date is after the maximum date",
  disabledDaysText: "",
  disabledDatesText: "",
  nextText: "Next Month (Control+Right)",
  prevText: "Previous Month (Control+Left)",
  monthYearText: "Choose a month (Control+Up/Down to move years)",
  todayTip: "{0} (Spacebar)",
  format: "d/m/Y",
  startDay: 0
});

Ext.define("Ext.locale.en_GB.picker.Month", {
  override: "Ext.picker.Month",
  okText: "&#160;OK&#160;",
  cancelText: "Cancel"
});

Ext.define("Ext.locale.en_GB.toolbar.Paging", {
  override: "Ext.PagingToolbar",
  beforePageText: "Page",
  afterPageText: "of {0}",
  firstText: "First Page",
  prevText: "Previous Page",
  nextText: "Next Page",
  lastText: "Last Page",
  refreshText: "Refresh",
  displayMsg: "Displaying {0} - {1} of {2}",
  emptyMsg: "No data to display"
});

Ext.define("Ext.locale.en_GB.form.Basic", {
  override: "Ext.form.Basic",
  waitTitle: "Please Wait..."
});

Ext.define("Ext.locale.en_GB.form.field.Base", {
  override: "Ext.form.field.Base",
  invalidText: "The value in this field is invalid"
});

Ext.define("Ext.locale.en_GB.form.field.Text", {
  override: "Ext.form.field.Text",
  minLengthText: "The minimum length for this field is {0}",
  maxLengthText: "The maximum length for this field is {0}",
  blankText: "This field is required",
  regexText: "",
  emptyText: null
});

Ext.define("Ext.locale.en_GB.form.field.Number", {
  override: "Ext.form.field.Number",
  decimalPrecision: 2,
  minText: "The minimum value for this field is {0}",
  maxText: "The maximum value for this field is {0}",
  nanText: "{0} is not a valid number"
});

Ext.define("Ext.locale.en_GB.form.field.Date", {
  override: "Ext.form.field.Date",
  disabledDaysText: "Disabled",
  disabledDatesText: "Disabled",
  minText: "The date in this field must be after {0}",
  maxText: "The date in this field must be before {0}",
  invalidText: "{0} is not a valid date - it must be in the format {1}",
  format: "d/m/y",
  altFormats: "d/m/Y|d/m/y|d-m-y|d-m-Y|d/m|d-m|dm|dmy|dmY|d|Y-m-d"
});

Ext.define(
  "Ext.locale.en_GB.form.field.ComboBox",
  {
    override: "Ext.form.field.ComboBox",
    valueNotFoundText: undefined
  },
  function () {
    Ext.apply(Ext.form.field.ComboBox.prototype.defaultListConfig, {
      loadingText: "Loading..."
    });
  }
);

Ext.define("Ext.locale.en_GB.form.field.VTypes", {
  override: "Ext.form.field.VTypes",
  emailText:
    'This field should be an e-mail address in the format "user@example.com"',
  urlText:
    'This field should be a URL in the format "http:/' + '/www.example.com"',
  alphaText: "This field should only contain letters and _",
  alphanumText: "This field should only contain letters, numbers and _"
});

Ext.define(
  "Ext.locale.en_GB.form.field.HtmlEditor",
  {
    override: "Ext.form.field.HtmlEditor",
    createLinkText: "Please enter the URL for the link:"
  },
  function () {
    Ext.apply(Ext.form.field.HtmlEditor.prototype, {
      buttonTips: {
        bold: {
          title: "Bold (Ctrl+B)",
          text: "Make the selected text bold.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        italic: {
          title: "Italic (Ctrl+I)",
          text: "Make the selected text italic.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        underline: {
          title: "Underline (Ctrl+U)",
          text: "Underline the selected text.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        increasefontsize: {
          title: "Grow Text",
          text: "Increase the font size.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        decreasefontsize: {
          title: "Shrink Text",
          text: "Decrease the font size.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        backcolor: {
          title: "Text Highlight Colour",
          text: "Change the background colour of the selected text.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        forecolor: {
          title: "Font Colour",
          text: "Change the colour of the selected text.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        justifyleft: {
          title: "Align Text Left",
          text: "Align text to the left.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        justifycenter: {
          title: "Centre Text",
          text: "Centre text in the editor.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        justifyright: {
          title: "Align Text Right",
          text: "Align text to the right.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        insertunorderedlist: {
          title: "Bullet List",
          text: "Start a bulleted list.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        insertorderedlist: {
          title: "Numbered List",
          text: "Start a numbered list.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        createlink: {
          title: "Hyperlink",
          text: "Make the selected text a hyperlink.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        },
        sourceedit: {
          title: "Source Edit",
          text: "Switch to source editing mode.",
          cls: Ext.baseCSSPrefix + "html-editor-tip"
        }
      }
    });
  }
);

Ext.define("Ext.locale.en_GB.grid.header.Container", {
  override: "Ext.grid.header.Container",
  sortAscText: "Sort Ascending",
  sortDescText: "Sort Descending",
  columnsText: "Columns"
});

Ext.define("Ext.locale.en_GB.grid.DateColumn", {
  override: "Ext.grid.DateColumn",
  format: "d/m/Y"
});

Ext.define("Ext.locale.en_GB.grid.GroupingFeature", {
  override: "Ext.grid.feature.Grouping",
  emptyGroupText: "(None)",
  groupByText: "Group by this field",
  showGroupsText: "Show in Groups"
});

Ext.define("Ext.locale.en_GB.grid.PropertyColumnModel", {
  override: "Ext.grid.PropertyColumnModel",
  nameText: "Name",
  valueText: "Value",
  dateFormat: "j/m/Y",
  trueText: "true",
  falseText: "false"
});

Ext.define("Ext.locale.en_GB.form.field.Time", {
  override: "Ext.form.field.Time",
  minText: "The time in this field must be equal to or after {0}",
  maxText: "The time in this field must be equal to or before {0}",
  invalidText: "{0} is not a valid time",
  format: "g:i A",
  altFormats:
    "g:ia|g:iA|g:i a|g:i A|h:i|g:i|H:i|ga|ha|gA|h a|g a|g A|gi|hi|gia|hia|g|H"
});

Ext.define("Ext.locale.en_GB.form.field.File", {
  override: "Ext.form.field.File",
  buttonText: "Browse..."
});

Ext.define("Ext.locale.en_GB.form.CheckboxGroup", {
  override: "Ext.form.CheckboxGroup",
  blankText: "You must select at least one item in this group"
});

Ext.define("Ext.locale.en_GB.form.RadioGroup", {
  override: "Ext.form.RadioGroup",
  blankText: "You must select one item in this group"
});

Ext.define("Ext.locale.en_GB.window.MessageBox", {
  override: "Ext.window.MessageBox",
  buttonText: {
    ok: "OK",
    cancel: "Cancel",
    yes: "Yes",
    no: "No"
  }
});

Ext.define("Ext.locale.en_GB.grid.filters.Filters", {
  override: "Ext.grid.filters.Filters",
  menuFilterText: "Filters"
});

Ext.define("Ext.locale.en_GB.grid.filters.filter.Boolean", {
  override: "Ext.grid.filters.filter.Boolean",
  yesText: "Yes",
  noText: "No"
});

Ext.define("Ext.locale.en_GB.grid.filters.filter.Date", {
  override: "Ext.grid.filters.filter.Date",
  fields: {
    lt: { text: "Before" },
    gt: { text: "After" },
    eq: { text: "On" }
  },
  // Defaults to Ext.Date.defaultFormat
  dateFormat: null
});

Ext.define("Ext.locale.en_GB.grid.filters.filter.List", {
  override: "Ext.grid.filters.filter.List",
  loadingText: "Loading..."
});

Ext.define("Ext.locale.en_GB.grid.filters.filter.Number", {
  override: "Ext.grid.filters.filter.Number",
  emptyText: "Enter Number..."
});

Ext.define("Ext.locale.en_GB.grid.filters.filter.String", {
  override: "Ext.grid.filters.filter.String",
  emptyText: "Enter Filter Text..."
});

Ext.define("Ext.locale.en_GB.view.MultiSelectorSearch", {
  override: "Ext.view.MultiSelectorSearch",
  searchText: "Search..."
});

Ext.define("Ext.locale.en_GB.view.MultiSelector", {
  override: "Ext.view.MultiSelector",
  emptyText: "Nothing selected",
  removeRowTip: "Remove this item",
  addToolText: "Search for items to add"
});

// This is needed until we can refactor all of the locales into individual files
Ext.define("Ext.locale.en_GB.Component", {
  override: "Ext.Component"
});
