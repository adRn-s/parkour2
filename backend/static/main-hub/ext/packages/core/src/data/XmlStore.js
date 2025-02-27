/**
 * <p>Small helper class to make creating {@link Ext.data.Store}s from XML data easier.
 * A XmlStore will be automatically configured with a {@link Ext.data.reader.Xml}.</p>
 * <p>A store configuration would be something like:<pre><code>
var store = new Ext.data.XmlStore({
    // store configs
    storeId: 'myStore',
    url: 'sheldon.xml', // automatically configures a HttpProxy
    // reader configs
    record: 'Item', // records will have an "Item" tag
    idPath: 'ASIN',
    totalRecords: '@TotalResults'
    fields: [
        // set up the fields mapping into the xml doc
        // The first needs mapping, the others are very basic
        {name: 'Author', mapping: 'ItemAttributes > Author'},
        'Title', 'Manufacturer', 'ProductGroup'
    ]
});
 * </code></pre></p>
 * <p>This store is configured to consume a returned object of the form:<pre><code>
&#60?xml version="1.0" encoding="UTF-8"?>
&#60ItemSearchResponse xmlns="http://webservices.amazon.com/AWSECommerceService/2009-05-15">
    &#60Items>
        &#60Request>
            &#60IsValid>True&#60/IsValid>
            &#60ItemSearchRequest>
                &#60Author>Sidney Sheldon&#60/Author>
                &#60SearchIndex>Books&#60/SearchIndex>
            &#60/ItemSearchRequest>
        &#60/Request>
        &#60TotalResults>203&#60/TotalResults>
        &#60TotalPages>21&#60/TotalPages>
        &#60Item>
            &#60ASIN>0446355453&#60/ASIN>
            &#60DetailPageURL>
                http://www.amazon.com/
            &#60/DetailPageURL>
            &#60ItemAttributes>
                &#60Author>Sidney Sheldon&#60/Author>
                &#60Manufacturer>Warner Books&#60/Manufacturer>
                &#60ProductGroup>Book&#60/ProductGroup>
                &#60Title>Master of the Game&#60/Title>
            &#60/ItemAttributes>
        &#60/Item>
    &#60/Items>
&#60/ItemSearchResponse>
 * </code></pre>
 * An object literal of this form could also be used as the {@link #cfg-data} config option.</p>
 * <p><b>Note:</b> This class accepts all of the configuration options of
 * <b>{@link Ext.data.reader.Xml XmlReader}</b>.</p>
 */
Ext.define("Ext.data.XmlStore", {
  extend: "Ext.data.Store",
  alias: "store.xml",

  requires: [
    "Ext.data.proxy.Ajax",
    "Ext.data.reader.Xml",
    "Ext.data.writer.Xml"
  ],

  constructor: function (config) {
    config = Ext.apply(
      {
        proxy: {
          type: "ajax",
          reader: "xml",
          writer: "xml"
        }
      },
      config
    );

    this.callParent([config]);
  }
});
