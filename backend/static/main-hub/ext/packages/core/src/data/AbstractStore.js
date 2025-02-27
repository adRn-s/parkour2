/**
 * AbstractStore is a superclass of {@link Ext.data.ProxyStore} and {@link Ext.data.ChainedStore}. It's never used directly,
 * but offers a set of methods used by both of those subclasses.
 *
 * We've left it here in the docs for reference purposes, but unless you need to make a whole new type of Store, what
 * you're probably looking for is {@link Ext.data.Store}.
 */
Ext.define("Ext.data.AbstractStore", {
  mixins: ["Ext.mixin.Observable", "Ext.mixin.Factoryable"],

  requires: [
    "Ext.util.Collection",
    "Ext.data.schema.Schema",
    "Ext.util.Filter"
  ],

  factoryConfig: {
    defaultType: "store",
    type: "store"
  },

  $configPrefixed: false,
  $configStrict: false,

  config: {
    /**
     * @cfg {Object[]/Function[]} filters
     * Array of {@link Ext.util.Filter Filters} for this store. Can also be passed array of
     * functions which will be used as the {@link Ext.util.Filter#filterFn filterFn} config
     * for filters:
     *
     *     filters: [
     *         function(item) {
     *             return item.weight > 0;
     *         }
     *     ]
     *
     * To filter after the grid is loaded use the {@link Ext.data.Store#filterBy filterBy} function.
     */
    filters: null,

    /**
     * @cfg {Boolean} [autoDestroy]
     * When a Store is used by only one {@link Ext.view.View DataView}, and should only exist for the lifetime of that view, then
     * configure the autoDestroy flag as `true`. This causes the destruction of the view to trigger the destruction of its Store.
     */
    autoDestroy: undefined,

    /**
     * @cfg {String} storeId
     * Unique identifier for this store. If present, this Store will be registered with the {@link Ext.data.StoreManager},
     * making it easy to reuse elsewhere.
     *
     * Note that when a store is instantiated by a Controller, the storeId will default
     * to the name of the store if not specified in the class.
     */
    storeId: null,

    /**
     * @cfg {Boolean} [statefulFilters=false]
     * Configure as `true` to have the filters saved when a client {@link Ext.grid.Panel grid} saves its state.
     */
    statefulFilters: false,

    /**
     * @cfg {Ext.util.Sorter[]/Object[]} sorters
     * The initial set of {@link Ext.util.Sorter Sorters}
     */
    sorters: null,

    /**
     * @cfg {Boolean} [remoteSort=false]
     * `true` if the sorting should be performed on the server side, false if it is local only.
     */
    remoteSort: {
      lazy: true,
      $value: false
    },

    /**
     * @cfg {Boolean} [remoteFilter=false]
     * `true` to defer any filtering operation to the server. If `false`, filtering is done locally on the client.
     */
    remoteFilter: {
      lazy: true,
      $value: false
    },

    /**
     * @cfg {String} groupField
     * The field by which to group data in the store. Internally, grouping is very similar to sorting - the
     * groupField and {@link #groupDir} are injected as the first sorter (see {@link #method-sort}). Stores support a single
     * level of grouping, and groups can be fetched via the {@link #getGroups} method.
     */
    groupField: undefined,

    /**
     * @cfg {String} groupDir
     * The direction in which sorting should be applied when grouping. Supported values are "ASC" and "DESC".
     */
    groupDir: "ASC",

    /**
     * @cfg {Object/Ext.util.Grouper} grouper
     * The grouper by which to group the data store. May also be specified by the {@link #groupField} config, however
     * they should not be used together.
     */
    grouper: null,

    /**
     * @cfg {Number} pageSize
     * The number of records considered to form a 'page'. This is used to power the built-in
     * paging using the nextPage and previousPage functions when the grid is paged using a
     * {@link Ext.toolbar.Paging PagingToolbar} Defaults to 25.
     *
     * To disable paging, set the pageSize to `0`.
     */
    pageSize: 25,

    /**
     * @cfg {Boolean} [autoSort=true] `true` to maintain sorted order when records
     * are added regardless of requested insertion point, or when an item mutation
     * results in a new sort position.
     *
     * This does not affect a ChainedStore's reaction to mutations of the source
     * Store. If sorters are present when the source Store is mutated, this ChainedStore's
     * sort order will always be maintained.
     * @private
     */
    autoSort: null
  },

  /**
   * @property {Number} currentPage
   * The page that the Store has most recently loaded (see {@link Ext.data.Store#loadPage loadPage})
   */
  currentPage: 1,

  /**
   * @property {Boolean} loading
   * `true` if the Store is currently loading via its Proxy.
   * @private
   */
  loading: false,

  /**
   * @property {Boolean} isStore
   * `true` in this class to identify an object as an instantiated Store, or subclass thereof.
   */
  isStore: true,

  /**
   * @property {Number} updating
   * A counter that is increased by `beginUpdate` and decreased by `endUpdate`. When
   * this transitions from 0 to 1 the `{@link #event-beginupdate beginupdate}` event is
   * fired. When it transitions back from 1 to 0 the `{@link #event-endupdate endupdate}`
   * event is fired.
   * @readonly
   * @since 5.0.0
   */
  updating: 0,

  //documented above
  constructor: function (config) {
    var me = this,
      storeId;

    /**
     * @event add
     * Fired when a Model instance has been added to this Store.
     *
     * @param {Ext.data.Store} store The store.
     * @param {Ext.data.Model[]} records The records that were added.
     * @param {Number} index The index at which the records were inserted.
     * @since 1.1.0
     */

    /**
     * @event remove
     * Fired when one or more records have been removed from this Store.
     *
     * **The signature for this event has changed in 5.0: **
     *
     * @param {Ext.data.Store} store The Store object
     * @param {Ext.data.Model[]} records The records that were removed. In previous
     * releases this was a single record, not an array.
     * @param {Number} index The index at which the records were removed.
     * @param {Boolean} isMove `true` if the child node is being removed so it can be
     * moved to another position in this Store.
     * @since 5.0.0
     */

    /**
     * @event update
     * Fires when a Model instance has been updated.
     * @param {Ext.data.Store} this
     * @param {Ext.data.Model} record The Model instance that was updated
     * @param {String} operation The update operation being performed. Value may be one of:
     *
     *     Ext.data.Model.EDIT
     *     Ext.data.Model.REJECT
     *     Ext.data.Model.COMMIT
     * @param {String[]} modifiedFieldNames Array of field names changed during edit.
     * @param {Object} details An object describing the change. See the
     * {@link Ext.util.Collection#event-itemchange itemchange event} of the store's backing collection
     * @since 1.1.0
     */

    /**
     * @event clear
     * Fired after the {@link Ext.data.Store#removeAll removeAll} method is called.
     * @param {Ext.data.Store} this
     * @since 1.1.0
     */

    /**
     * @event datachanged
     * Fires whenever records are added to or removed from the Store.
     *
     * To hook into modifications of records in this Store use the {@link #update} event.
     * @param {Ext.data.Store} this The data store
     * @since 1.1.0
     */

    /**
     * @event refresh
     * Fires when the data cache has changed in a bulk manner (e.g., it has been sorted, filtered, etc.) and a
     * widget that is using this Store as a Record cache should refresh its view.
     * @param {Ext.data.Store} this The data store
     */

    /**
     * @event beginupdate
     * Fires when the {@link #beginUpdate} method is called. Automatic synchronization as configured
     * by the {@link Ext.data.ProxyStore#autoSync autoSync} flag is deferred until the {@link #endUpdate} method is called, so multiple
     * mutations can be coalesced into one synchronization operation.
     */

    /**
     * @event endupdate
     * Fires when the {@link #endUpdate} method is called. Automatic synchronization as configured
     * by the {@link Ext.data.ProxyStore#autoSync autoSync} flag is deferred until the {@link #endUpdate} method is called, so multiple
     * mutations can be coalesced into one synchronization operation.
     */

    /**
     * @event beforesort
     * Fires before a store is sorted.
     *
     * For {@link #remoteSort remotely sorted} stores, this will be just before the load operation triggered by changing the
     * store's sorters.
     *
     * For locally sorted stores, this will be just before the data items in the store's backing collection are sorted.
     * @param {Ext.data.Store} store The store being sorted
     * @param {Ext.util.Sorter[]} sorters Array of sorters applied to the store
     */

    /**
     * @event sort
     * Fires after a store is sorted.
     *
     * For {@link #remoteSort remotely sorted} stores, this will be upon the success of a load operation triggered by
     * changing the store's sorters.
     *
     * For locally sorted stores, this will be just after the data items in the store's backing collection are sorted.
     * @param {Ext.data.Store} store The store being sorted
     */
    me.isInitializing = true;
    me.mixins.observable.constructor.call(me, config);
    me.isInitializing = false;

    storeId = me.getStoreId();
    if (!storeId && config && config.id) {
      me.setStoreId((storeId = config.id));
    }

    if (storeId) {
      Ext.data.StoreManager.register(me);
    }
  },

  /**
   * Gets the number of records in store.
   *
   * If using paging, this may not be the total size of the dataset. If the data object
   * used by the Reader contains the dataset size, then the {@link Ext.data.ProxyStore#getTotalCount} function returns
   * the dataset size.  **Note**: see the Important note in {@link Ext.data.ProxyStore#method-load}.
   *
   * When store is filtered, it's the number of records matching the filter.
   *
   * @return {Number} The number of Records in the Store.
   */
  getCount: function () {
    var data = this.getData();

    // We may be destroyed, in which case "data" will be null... best to just
    // report 0 items vs throw an exception

    return data ? data.getCount() : 0;
  },

  /**
   * Determines if the passed range is available in the page cache.
   * @private
   * @param {Number} start The start index
   * @param {Number} end The end index in the range
   */
  rangeCached: function (start, end) {
    return this.getData().getCount() >= Math.max(start, end);
  },

  /**
   * Checks if a record is in the current active data set.
   * @param {Ext.data.Model} record The record
   * @return {Boolean} `true` if the record is in the current active data set.
   * @method contains
   */

  /**
   * Finds the index of the first matching Record in this store by a specific field value.
   *
   * When store is filtered, finds records only within filter.
   *
   * **IMPORTANT
   *
   * If this store is {@link Ext.data.BufferedStore Buffered}, this can ONLY find records which happen to be cached in the page cache.
   * This will be parts of the dataset around the currently visible zone, or recently visited zones if the pages
   * have not yet been purged from the cache.**
   *
   * @param {String} property The name of the Record field to test.
   * @param {String/RegExp} value Either a string that the field value
   * should begin with, or a RegExp to test against the field.
   * @param {Number} [startIndex=0] The index to start searching at
   * @param {Boolean} [anyMatch=false] True to match any part of the string, not just the
   * beginning.
   * @param {Boolean} [caseSensitive=false] True for case sensitive comparison
   * @param {Boolean} [exactMatch=false] True to force exact match (^ and $ characters
   * added to the regex). Ignored if `anyMatch` is `true`.
   * @return {Number} The matched index or -1
   */
  find: function (
    property,
    value,
    startIndex,
    anyMatch,
    caseSensitive,
    exactMatch
  ) {
    //             exactMatch
    //  anyMatch    F       T
    //      F       ^abc    ^abc$
    //      T       abc     abc
    //
    var startsWith = !anyMatch,
      endsWith = !!(startsWith && exactMatch);

    return this.getData().findIndex(
      property,
      value,
      startIndex,
      startsWith,
      endsWith,
      !caseSensitive
    );
  },

  /**
   * Finds the first matching Record in this store by a specific field value.
   *
   * When store is filtered, finds records only within filter.
   *
   * **IMPORTANT
   *
   * If this store is {@link Ext.data.BufferedStore Buffered}, this can ONLY find records which happen to be cached in the page cache.
   * This will be parts of the dataset around the currently visible zone, or recently visited zones if the pages
   * have not yet been purged from the cache.**
   *
   * @param {String} fieldName The name of the Record field to test.
   * @param {String/RegExp} value Either a string that the field value
   * should begin with, or a RegExp to test against the field.
   * @param {Number} [startIndex=0] The index to start searching at
   * @param {Boolean} [anyMatch=false] True to match any part of the string, not just the
   * beginning.
   * @param {Boolean} [caseSensitive=false] True for case sensitive comparison
   * @param {Boolean} [exactMatch=false] True to force exact match (^ and $ characters
   * added to the regex). Ignored if `anyMatch` is `true`.
   * @return {Ext.data.Model} The matched record or null
   */
  findRecord: function () {
    var me = this,
      index = me.find.apply(me, arguments);
    return index !== -1 ? me.getAt(index) : null;
  },

  /**
   * Finds the index of the first matching Record in this store by a specific field value.
   *
   * When store is filtered, finds records only within filter.
   *
   * **IMPORTANT
   *
   * If this store is {@link Ext.data.BufferedStore Buffered}, this can ONLY find records which happen to be cached in the page cache.
   * This will be parts of the dataset around the currently visible zone, or recently visited zones if the pages
   * have not yet been purged from the cache.**
   *
   * @param {String} fieldName The name of the Record field to test.
   * @param {Object} value The value to match the field against.
   * @param {Number} [startIndex=0] The index to start searching at
   * @return {Number} The matched index or -1
   */
  findExact: function (fieldName, value, startIndex) {
    return this.getData().findIndexBy(
      function (rec) {
        return rec.isEqual(rec.get(fieldName), value);
      },
      this,
      startIndex
    );
  },

  /**
   * Find the index of the first matching Record in this Store by a function.
   * If the function returns `true` it is considered a match.
   *
   * When store is filtered, finds records only within filter.
   *
   * **IMPORTANT
   *
   * If this store is {@link Ext.data.BufferedStore Buffered}, this can ONLY find records which happen to be cached in the page cache.
   * This will be parts of the dataset around the currently visible zone, or recently visited zones if the pages
   * have not yet been purged from the cache.**
   *
   * @param {Function} fn The function to be called. It will be passed the following parameters:
   *  @param {Ext.data.Model} fn.record The record to test for filtering. Access field values
   *  using {@link Ext.data.Model#get}.
   *  @param {Object} fn.id The ID of the Record passed.
   * @param {Object} [scope] The scope (this reference) in which the function is executed.
   * Defaults to this Store.
   * @param {Number} [startIndex=0] The index to start searching at
   * @return {Number} The matched index or -1
   */
  findBy: function (fn, scope, start) {
    return this.getData().findIndexBy(fn, scope, start);
  },

  /**
   * Get the Record at the specified index.
   *
   * The index is effected by filtering.
   *
   * @param {Number} index The index of the Record to find.
   * @return {Ext.data.Model} The Record at the passed index. Returns null if not found.
   */
  getAt: function (index) {
    return this.getData().getAt(index) || null;
  },

  /**
   * Gathers a range of Records between specified indices.
   *
   * This method is affected by filtering.
   *
   * @param {Number} start The starting index. Defaults to zero.
   * @param {Number} end The ending index. Defaults to the last record. The end index **is included**.
   * @return {Ext.data.Model[]} An array of records.
   */
  getRange: function (
    start,
    end,
    /* private - use by BufferedRenderer. It may be using a BufferedStore */ options
  ) {
    // Collection's getRange is exclusive. Do NOT mutate the value: it is passed to the callback.
    var result = this.getData().getRange(
      start,
      Ext.isNumber(end) ? end + 1 : end
    );

    // BufferedRenderer requests a range with a callback to process that range.
    // Because it may be dealing with a buffered store and the range may not be available synchronously.
    if (options && options.callback) {
      options.callback.call(options.scope || this, result, start, end, options);
    }
    return result;
  },

  /**
   * Gets the filters for this store.
   * @return {Ext.util.FilterCollection} The filters
   */
  getFilters: function (/* private */ autoCreate) {
    var result = this.callParent();
    if (!result && autoCreate !== false) {
      this.setFilters([]);
      result = this.callParent();
    }
    return result;
  },

  applyFilters: function (filters, filtersCollection) {
    var created;
    if (!filtersCollection) {
      filtersCollection = this.createFiltersCollection();
      created = true;
    }

    filtersCollection.add(filters);

    if (created) {
      this.onRemoteFilterSet(filtersCollection, this.getRemoteFilter());
    }

    return filtersCollection;
  },

  /**
   * Gets the sorters for this store.
   * @return {Ext.util.SorterCollection} The sorters
   */
  getSorters: function (/* private */ autoCreate) {
    var result = this.callParent();
    if (!result && autoCreate !== false) {
      // If not preventing creation, force it here
      this.setSorters([]);
      result = this.callParent();
    }
    return result;
  },

  applySorters: function (sorters, sortersCollection) {
    var created;
    if (!sortersCollection) {
      sortersCollection = this.createSortersCollection();
      created = true;
    }

    sortersCollection.add(sorters);

    if (created) {
      this.onRemoteSortSet(sortersCollection, this.getRemoteSort());
    }

    return sortersCollection;
  },

  /**
   * Filters the data in the Store by one or more fields. Example usage:
   *
   *     //filter with a single field
   *     myStore.filter('firstName', 'Don');
   *
   *     //filtering with multiple filters
   *     myStore.filter([
   *         {
   *             property : 'firstName',
   *             value    : 'Don'
   *         },
   *         {
   *             property : 'lastName',
   *             value    : 'Griffin'
   *         }
   *     ]);
   *
   * Internally, Store converts the passed arguments into an array of {@link Ext.util.Filter} instances, and delegates
   * the actual filtering to its internal {@link Ext.util.MixedCollection}.
   *
   * @param {String/Ext.util.Filter[]} [filters] Either a string name of one of the fields in this Store's configured
   * {@link Ext.data.Model Model}, or an array of filter configurations.
   * @param {String} [value] The property value by which to filter. Only applicable if `filters` is a string.
   */
  filter: function (filters, value, supressEvent) {
    if (Ext.isString(filters)) {
      filters = {
        property: filters,
        value: value
      };
    }
    this.suppressNextFilter = !!supressEvent;
    this.getFilters().add(filters);
    this.suppressNextFilter = false;
  },

  /**
   * Removes an individual Filter from the current {@link #cfg-filters filter set} using the passed Filter/Filter id and
   * by default, applies the updated filter set to the Store's unfiltered dataset.
   *
   * @param {String/Ext.util.Filter} toRemove The id of a Filter to remove from the filter set, or a Filter instance to remove.
   * @param {Boolean} [suppressEvent] If `true` the filter is cleared silently.
   */
  removeFilter: function (filter, suppressEvent) {
    var me = this,
      filters = me.getFilters();

    me.suppressNextFilter = !!suppressEvent;
    if (filter instanceof Ext.util.Filter) {
      filters.remove(filter);
    } else {
      filters.removeByKey(filter);
    }
    me.suppressNextFilter = false;
  },

  updateAutoSort: function (autoSort) {
    // Keep collection synced with our autoSort setting
    this.getData().setAutoSort(autoSort);
  },

  updateRemoteSort: function (remoteSort) {
    // Don't call the getter here, we don't want to force sorters to be created here.
    // Also, applySorters calls getRemoteSort, which may trigger the initGetter.
    this.onRemoteSortSet(this.getSorters(false), remoteSort);
  },

  updateRemoteFilter: function (remoteFilter) {
    this.onRemoteFilterSet(this.getFilters(false), remoteFilter);
  },

  /**
   * Adds a new Filter to this Store's {@link #cfg-filters filter set} and
   * by default, applies the updated filter set to the Store's unfiltered dataset.
   * @param {Object[]/Ext.util.Filter[]} filters The set of filters to add to the current {@link #cfg-filters filter set}.
   * @param {Boolean} [suppressEvent] If `true` the filter is cleared silently.
   */
  addFilter: function (filters, suppressEvent) {
    this.suppressNextFilter = !!suppressEvent;
    this.getFilters().add(filters);
    this.suppressNextFilter = false;
  },

  /**
   * Filters by a function. The specified function will be called for each
   * Record in this Store. If the function returns `true` the Record is included,
   * otherwise it is filtered out.
   *
   * When store is filtered, most of the methods for accessing store data will be working only
   * within the set of filtered records. The notable exception is {@link #getById}.
   *
   * @param {Function} fn The function to be called. It will be passed the following parameters:
   *  @param {Ext.data.Model} fn.record The record to test for filtering. Access field values
   *  using {@link Ext.data.Model#get}.
   * @param {Object} [scope] The scope (this reference) in which the function is executed.
   * Defaults to this Store.
   */
  filterBy: function (fn, scope) {
    this.getFilters().add({
      filterFn: fn,
      scope: scope || this
    });
  },

  /**
   * Reverts to a view of the Record cache with no filtering applied.
   * @param {Boolean} [suppressEvent] If `true` the filter is cleared silently.
   *
   * For a locally filtered Store, this means that the filter collection is cleared without firing the
   * {@link #datachanged} event.
   *
   * For a remotely filtered Store, this means that the filter collection is cleared, but the store
   * is not reloaded from the server.
   */
  clearFilter: function (suppressEvent) {
    var me = this,
      filters = me.getFilters(false);

    if (!filters || filters.getCount() === 0) {
      return;
    }
    me.suppressNextFilter = !!suppressEvent;
    filters.removeAll();
    me.suppressNextFilter = false;
  },

  /**
   * Tests whether the store currently has any active filters.
   * @return {Boolean} `true` if the store is filtered.
   */
  isFiltered: function () {
    return this.getFilters().getCount() > 0;
  },

  /**
   * Tests whether the store currently has any active sorters.
   * @return {Boolean} `true` if the store is sorted.
   */
  isSorted: function () {
    var sorters = this.getSorters(false);
    return !!(sorters && sorters.length > 0) || this.isGrouped();
  },

  addFieldTransform: function (sorter) {
    // Transform already specified, leave it
    if (sorter.getTransform()) {
      return;
    }

    var fieldName = sorter.getProperty(),
      Model = this.getModel(),
      field,
      sortType;

    if (Model) {
      field = Model.getField(fieldName);
      sortType = field ? field.getSortType() : null;
    }

    if (sortType && sortType !== Ext.identityFn) {
      sorter.setTransform(sortType);
    }
  },

  /**
   * This method may be called to indicate the start of multiple changes to the store.
   *
   * Automatic synchronization as configured by the {@link Ext.data.ProxyStore#autoSync autoSync} flag is deferred
   * until the {@link #endUpdate} method is called, so multiple mutations can be coalesced
   * into one synchronization operation.
   *
   * Internally this method increments a counter that is decremented by `endUpdate`. It
   * is important, therefore, that if you call `beginUpdate` directly you match that
   * call with a call to `endUpdate` or you will prevent the collection from updating
   * properly.
   *
   * For example:
   *
   *      var store = Ext.StoreManager.lookup({
   *          //...
   *          autoSync: true
   *      });
   *
   *      store.beginUpdate();
   *
   *      record.set('fieldName', 'newValue');
   *
   *      store.add(item);
   *      // ...
   *
   *      store.insert(index, otherItem);
   *      //...
   *
   *      // Interested parties will listen for the endupdate event
   *      store.endUpdate();
   *
   * @since 5.0.0
   */
  beginUpdate: function () {
    if (!this.updating++) {
      // jshint ignore:line
      this.fireEvent("beginupdate");
    }
  },

  /**
   * This method is called after modifications are complete on a store. For details
   * see `{@link #beginUpdate}`.
   * @since 5.0.0
   */
  endUpdate: function () {
    if (this.updating && !--this.updating) {
      this.fireEvent("endupdate");
      this.onEndUpdate();
    }
  },

  /**
   * @private
   * Returns the grouping, sorting and filtered state of this Store.
   */
  getState: function () {
    var me = this,
      sorters = [],
      filters = me.getFilters(),
      grouper = me.getGrouper(),
      filterState,
      hasState,
      result;

    // Create sorters config array.
    me.getSorters().each(function (s) {
      sorters[sorters.length] = s.getState();
      hasState = true;
    });

    // Because we do not provide a filter changing mechanism, only statify the filters if they opt in.
    // Otherwise filters would get "stuck".
    if (me.statefulFilters && me.saveStatefulFilters) {
      // If saveStatefulFilters is turned on then we know that the filter collection has changed since
      // page load. Initiate the filterState as an empty stack, which is meaningful in itself. If there
      // are any filter in the collection, persist them.
      hasState = true;
      filterState = [];
      filters.each(function (f) {
        filterState[filterState.length] = f.getState();
      });
    }

    if (grouper) {
      hasState = true;
    }

    // If there is any state to save, return it as an object
    if (hasState) {
      result = {};
      if (sorters.length) {
        result.sorters = sorters;
      }
      if (filterState) {
        result.filters = filterState;
      }
      if (grouper) {
        result.grouper = grouper.getState();
      }
    }
    return result;
  },

  /**
   * @private
   * Restores state to the passed state
   */
  applyState: function (state) {
    var me = this,
      stateSorters = state.sorters,
      stateFilters = state.filters,
      stateGrouper = state.grouper;

    if (stateSorters) {
      me.getSorters().replaceAll(stateSorters);
    }

    if (stateFilters) {
      // We found persisted filters so let's save stateful filters from this point forward.
      me.saveStatefulFilters = true;
      me.getFilters().replaceAll(stateFilters);
    }

    if (stateGrouper) {
      me.setGrouper(stateGrouper);
    }
  },

  /**
   * Get the Record with the specified id.
   *
   * This method is not affected by filtering, lookup will be performed from all records
   * inside the store, filtered or not.
   *
   * @param {Mixed} id The id of the Record to find.
   * @return {Ext.data.Model} The Record with the passed id. Returns null if not found.
   * @method getById
   */

  /**
   * Returns true if the store has a pending load task.
   * @return {Boolean} `true` if the store has a pending load task.
   * @private
   * @method
   */
  hasPendingLoad: Ext.emptyFn,

  /**
   * Returns `true` if the Store has been loaded.
   * @return {Boolean} `true` if the Store has been loaded.
   * @method
   */
  isLoaded: Ext.emptyFn,

  /**
   * Returns `true` if the Store is currently performing a load operation.
   * @return {Boolean} `true` if the Store is currently loading.
   * @method
   */
  isLoading: Ext.emptyFn,

  destroy: function () {
    var me = this;

    if (me.hasListeners.beforedestroy) {
      me.fireEvent("beforedestroy", me);
    }

    me.destroying = true;

    if (me.getStoreId()) {
      Ext.data.StoreManager.unregister(me);
    }

    me.doDestroy();

    if (me.hasListeners.destroy) {
      me.fireEvent("destroy", me);
    }

    me.destroying = false;

    // This will finish the sequence and null object references
    me.callParent();
  },

  /**
   * Perform the Store destroying sequence. Override this method to add destruction
   * behaviors to your custom Stores.
   *
   */
  doDestroy: Ext.emptyFn,

  /**
   * Sorts the data in the Store by one or more of its properties. Example usage:
   *
   *     //sort by a single field
   *     myStore.sort('myField', 'DESC');
   *
   *     //sorting by multiple fields
   *     myStore.sort([
   *         {
   *             property : 'age',
   *             direction: 'ASC'
   *         },
   *         {
   *             property : 'name',
   *             direction: 'DESC'
   *         }
   *     ]);
   *
   * Internally, Store converts the passed arguments into an array of {@link Ext.util.Sorter} instances, and delegates
   * the actual sorting to its internal {@link Ext.util.MixedCollection}.
   *
   * When passing a single string argument to sort, Store maintains a ASC/DESC toggler per field, so this code:
   *
   *     store.sort('myField');
   *     store.sort('myField');
   *
   * Is equivalent to this code, because Store handles the toggling automatically:
   *
   *     store.sort('myField', 'ASC');
   *     store.sort('myField', 'DESC');
   *
   * @param {String/Ext.util.Sorter[]} [sorters] Either a string name of one of the fields in this Store's configured
   * {@link Ext.data.Model Model}, or an array of sorter configurations.
   * @param {String} [direction="ASC"] The overall direction to sort the data by.
   * @return {Ext.util.Sorter[]}
   */
  sort: function (field, direction, mode) {
    var me = this;

    if (arguments.length === 0) {
      if (me.getRemoteSort()) {
        me.load();
      } else {
        me.forceLocalSort();
      }
    } else {
      me.getSorters().addSort(field, direction, mode);
    }
  },

  // This is attached to the data Collection's beforesort event only if not remoteSort
  // If remoteSort, the event is fired before the reload call in Ext.data.ProxyStore#load.
  onBeforeCollectionSort: function (store, sorters) {
    if (sorters) {
      this.fireEvent("beforesort", this, sorters.getRange());
    }
  },

  onSorterEndUpdate: function () {
    var me = this,
      sorters;

    // If we're in the middle of grouping, it will take care of loading.
    // If the collection is not instantiated yet, it's because we are constructing.
    sorters = me.getSorters(false);
    if (me.settingGroups || !sorters) {
      return;
    }

    sorters = sorters.getRange();

    // Only load or sort if there are sorters
    if (sorters.length) {
      if (me.getRemoteSort()) {
        me.load({
          callback: function () {
            me.fireEvent("sort", me, sorters);
          }
        });
      } else {
        me.fireEvent("datachanged", me);
        me.fireEvent("refresh", me);
        me.fireEvent("sort", me, sorters);
      }
    } else {
      // Sort event must fire when sorters collection is updated to empty.
      me.fireEvent("sort", me, sorters);
    }
  },

  onFilterEndUpdate: function () {
    var me = this,
      suppressNext = me.suppressNextFilter,
      filters = me.getFilters(false);

    // If the collection is not instantiated yet, it's because we are constructing.
    if (!filters) {
      return;
    }

    if (me.getRemoteFilter()) {
      //<debug>
      me.getFilters().each(function (filter) {
        if (filter.getInitialConfig().filterFn) {
          Ext.raise(
            "Unable to use a filtering function in conjunction with remote filtering."
          );
        }
      });
      //</debug>
      me.currentPage = 1;
      if (!suppressNext) {
        me.load();
      }
    } else if (!suppressNext) {
      me.fireEvent("datachanged", me);
      me.fireEvent("refresh", me);
    }

    if (me.trackStateChanges) {
      // We just mutated the filter collection so let's save stateful filters from this point forward.
      me.saveStatefulFilters = true;
    }

    // This is not affected by suppressEvent.
    me.fireEvent("filterchange", me, me.getFilters().getRange());
  },

  updateGroupField: function (field) {
    if (field) {
      this.setGrouper({
        property: field,
        direction: this.getGroupDir()
      });
    } else {
      this.setGrouper(null);
    }
  },

  /**
   * @method setFilters
   */

  /**
   * @method setSorters
   */

  getGrouper: function () {
    return this.getData().getGrouper();
  },

  /**
   * Groups data inside the store.
   * @param {String/Object} grouper Either a string name of one of the fields in this Store's
   * configured {@link Ext.data.Model Model}, or an object, or a {@link Ext.util.Grouper grouper} configuration object.
   * @param {String} [direction] The overall direction to group the data by. Defaults to the value of {@link #groupDir}.
   */
  group: function (grouper, direction) {
    var me = this,
      sorters = me.getSorters(false),
      change = grouper || (sorters && sorters.length);

    if (grouper && typeof grouper === "string") {
      grouper = {
        property: grouper,
        direction: direction || me.getGroupDir()
      };
    }

    me.settingGroups = true;
    me.getData().setGrouper(grouper);
    delete me.settingGroups;

    if (change) {
      if (me.getRemoteSort()) {
        me.load({
          scope: me,
          callback: me.fireGroupChange
        });
      } else {
        me.fireEvent("datachanged", me);
        me.fireEvent("refresh", me);
        me.fireGroupChange();
      }
    }
    // groupchange event must fire when group is cleared.
    // The Grouping feature forces a view refresh when changed to a null grouper
    else {
      me.fireGroupChange();
    }
  },

  fireGroupChange: function () {
    if (!this.destroyed) {
      this.fireEvent("groupchange", this, this.getGrouper());
    }
  },

  /**
   * Clear the store grouping
   */
  clearGrouping: function () {
    this.group(null);
  },

  getGroupField: function () {
    var grouper = this.getGrouper(),
      group = "";

    if (grouper) {
      group = grouper.getProperty();
    }
    return group;
  },

  /**
   * Tests whether the store currently has an active grouper.
   * @return {Boolean} `true` if the store is grouped.
   */
  isGrouped: function () {
    return !!this.getGrouper();
  },

  applyGrouper: function (grouper) {
    this.group(grouper);
    return this.getData().getGrouper();
  },

  /**
   * Returns a collection of readonly sub-collections of your store's records
   * with grouping applied. These sub-collections are maintained internally by
   * the collection.
   *
   * See {@link #groupField}, {@link #groupDir}. Example for a store
   * containing records with a color field:
   *
   *     var myStore = Ext.create('Ext.data.Store', {
   *         groupField: 'color',
   *         groupDir  : 'DESC'
   *     });
   *
   *     myStore.getGroups();
   *
   * The above should result in the following format:
   *
   *     [
   *         {
   *             name: 'yellow',
   *             children: [
   *                 // all records where the color field is 'yellow'
   *             ]
   *         },
   *         {
   *             name: 'red',
   *             children: [
   *                 // all records where the color field is 'red'
   *             ]
   *         }
   *     ]
   *
   * Group contents are affected by filtering.
   *
   * @return {Ext.util.Collection} The grouped data
   */
  getGroups: function () {
    return this.getData().getGroups();
  },

  onEndUpdate: Ext.emptyFn,

  privates: {
    loadsSynchronously: Ext.privateFn,

    onRemoteFilterSet: function (filters, remoteFilter) {
      if (filters) {
        filters[remoteFilter ? "on" : "un"](
          "endupdate",
          this.onFilterEndUpdate,
          this
        );
      }
    },

    // If remoteSort is set, we react to the endUpdate of the sorters Collection by reloading.
    // If remoteSort is set, we do not need to listen for the data Collection's beforesort event.
    //
    // If local sorting, we do not need to react to the endUpdate of the sorters Collection.
    // If local sorting, we listen for the data Collection's beforesort event to fire our beforesort event.
    onRemoteSortSet: function (sorters, remoteSort) {
      var me = this;

      if (sorters) {
        sorters[remoteSort ? "on" : "un"](
          "endupdate",
          me.onSorterEndUpdate,
          me
        );
        me.getData()[remoteSort ? "un" : "on"](
          "beforesort",
          me.onBeforeCollectionSort,
          me
        );
      }
    }
  },

  deprecated: {
    5: {
      methods: {
        destroyStore: function () {
          this.destroy();
        }
      }
    }
  }
});
