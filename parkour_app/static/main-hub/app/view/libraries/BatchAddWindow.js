Ext.define('MainHub.view.libraries.BatchAddWindow', {
  extend: 'Ext.window.Window',
  requires: [
    'MainHub.model.libraries.BatchAdd.Library',
    'MainHub.model.libraries.BatchAdd.Sample',
    'MainHub.view.libraries.BatchAddWindowController'
  ],
  controller: 'libraries-batchaddwindow',

  title: 'Add Libraries/Samples',
  height: 225,
  width: 400,

  modal: true,
  resizable: false,
  maximizable: true,
  autoShow: true,
  layout: 'fit',

  items: [{
    xtype: 'panel',
    border: 0,
    layout: 'card',
    items: [{
      xtype: 'container',
      layout: {
        type: 'vbox',
        align: 'center',
        pack: 'center'
      },
      defaults: {
        border: 0
      },
      items: [
        {
          xtype: 'container',
          layout: 'hbox',
          defaultType: 'button',
          defaults: {
            margin: 10,
            width: 100,
            height: 40
          },
          items: [
            {
              itemId: 'library-card-button',
              text: 'Library'
            },
            {
              itemId: 'sample-card-button',
              text: 'Sample'
            }
          ]
        },
        {
          html: '<p style="text-align:center">' +
                  'Choose <strong>Library</strong> if libraries have been prepared by the user and are ready for sequencing.<br><br>' +
                  'Choose <strong>Sample</strong> if libraries are to be prepared by the facility.' +
                '</p>',
          width: 350
        }
      ]
    },
    {
      xtype: 'grid',
      selModel: {
        type: 'spreadsheet',
        // rowNumbererHeaderWidth: 40,
        rowSelect: false
      },
      id: 'batch-add-grid',
      itemId: 'batch-add-grid',
      sortableColumns: false,
      enableColumnMove: true,
      enableColumnHide: false,
      // multiSelect: true,
      border: 0,
      viewConfig: {
        markDirty: false,
        stripeRows: false,
        getRowClass: function (record) {
          return (record.get('invalid')) ? 'invalid' : '';
        }
      },
      plugins: [
        {
          ptype: 'rowediting',
          clicksToEdit: 1
        },
        {
          ptype: 'clipboard'
        }
      ]
    }]
  }],

  dockedItems: [
    {
      xtype: 'toolbar',
      dock: 'top',
      itemId: 'create-empty-records',
      items: [
        {
          xtype: 'numberfield',
          itemId: 'num-empty-records',
          fieldLabel: 'Create empty records',
          padding: '0 10px 0 0',
          labelWidth: 145,
          width: 230,
          minValue: 1
        },
        {
          xtype: 'button',
          itemId: 'create-empty-records-button',
          text: 'Create'
        },
        {
          xtype: 'container',
          margin: '0 0 0 30px',
          html: '<span id="edit-hint"><strong>Hint:</strong> To edit multiple cells at once (Excel-like), ' +
            'select a cell, press Esc, paste data (CTRL + V)</span>'
        },
        // {
        //       text: 'Download RELACS Pellets Abs form',
        //       margin: '0 0 0 30px',
        //       itemId: 'download-sample-form',
        //       downloadUrl: 'api/requests/download_RELACS_Pellets_Abs_form',
        //       iconCls: 'fa fa-download fa-lg',

        // },
      ],
      hidden: true
    },
    {
      xtype: 'toolbar',
      dock: 'bottom',
      items: [
        {
          xtype: 'button',
          itemId: 'reorder-columns',
          iconCls: 'fa fa-random fa-lg',
          tooltip: '<strong>Reorder columns for easy data pasting. </strong>' +
          'Group columns together into which data can be pasted at once. ' +
          'Relevant column headers are highlighted with blue text. ' +
          'Select a cell, press Esc, paste data (CTRL + V).'
        },
        '->',
        {
          xtype: 'button',
          itemId: 'save-button',
          iconCls: 'fa fa-floppy-o fa-lg',
          text: 'Save'
        }
      ],
      hidden: true
    }
  ]
});
