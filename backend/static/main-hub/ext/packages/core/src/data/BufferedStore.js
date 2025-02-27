/**
 * A BufferedStore maintains a sparsely populated map of pages corresponding to an extremely large server-side dataset.
 *
 * Use a BufferedStore when the dataset size is so large that the database and network latency, and client memory requirements
 * preclude caching the entire dataset in a regular {@link Ext.data.Store Store}.
 *
 * When using a BufferedStore *not all of the dataset is present in the client*. Only pages which have been
 * requested by the UI (usually a {@link Ext.grid.Panel GridPanel}) and surrounding pages will be present. Retention
 * of viewed pages in the BufferedStore after they have been scrolled out of view is configurable. See {@link #leadingBufferZone},
 * {@link #trailingBufferZone} and {@link #purgePageCount}.
 *
 * To use a BufferedStore, initiate the loading process by loading the first page. The number of rows rendered are
 * determined automatically, and the range of pages needed to keep the cache primed for scrolling is
 * requested and cached.
 * Example:
 *
 *     myBufferedStore.loadPage(1); // Load page 1
 *
 * A {@link Ext.grid.plugin.BufferedRenderer BufferedRenderer} is instantiated which will monitor the scrolling in the grid, and
 * refresh the view's rows from the page cache as needed. It will also pull new data into the page
 * cache when scrolling of the view draws upon data near either end of the prefetched data.
 *
 * The margins which trigger view refreshing from the prefetched data are {@link Ext.grid.plugin.BufferedRenderer#numFromEdge},
 * {@link Ext.grid.plugin.BufferedRenderer#leadingBufferZone} and {@link Ext.grid.plugin.BufferedRenderer#trailingBufferZone}.
 *
 * The margins which trigger loading more data into the page cache are, {@link #leadingBufferZone} and
 * {@link #trailingBufferZone}.
 *
 * By default, only 5 pages of data (in addition to the pages which over the visible region) are cached in the page cache,
 * with old pages being evicted from the cache as the view moves down through the dataset. This is controlled by the
 * {@link #purgePageCount} setting.
 *
 * Setting this value to zero means that no pages are *ever* scrolled out of the page cache, and
 * that eventually the whole dataset may become present in the page cache. This is sometimes desirable
 * as long as datasets do not reach astronomical proportions.
 *
 * Selection state may be maintained across page boundaries by configuring the SelectionModel not to discard
 * records from its collection when those Records cycle out of the Store's primary collection. This is done
 * by configuring the SelectionModel like this:
 *
 *     selModel: {
 *         pruneRemoved: false
 *     }
 *
 */
Ext.define("Ext.data.BufferedStore", {
  extend: "Ext.data.ProxyStore",

  alias: "store.buffered",

  requires: [
    "Ext.data.PageMap",
    "Ext.util.Filter",
    "Ext.util.Sorter",
    "Ext.util.Grouper"
  ],

  uses: [
    "Ext.util.SorterCollection",
    "Ext.util.FilterCollection",
    "Ext.util.GroupCollection"
  ],

  /**
   * @property {Boolean} isBufferedStore
   * `true` in this class to identify an object as an instantiated BufferedStore, or subclass thereof.
   */
  isBufferedStore: true,

  // For backward compatibility with user code.
  buffered: true,

  config: {
    data: 0,
    pageSize: 25,
    remoteSort: true,
    remoteFilter: true,
    sortOnLoad: false,
    /**
     * @cfg {Number} purgePageCount
     *
     * The number of pages *in addition to twice the required buffered range* to keep in the prefetch cache before purging least recently used records.
     *
     * For example, if the height of the view area and the configured {@link #trailingBufferZone} and {@link #leadingBufferZone} require that there
     * are three pages in the cache, then a `purgePageCount` of 5 ensures that up to 11 pages can be in the page cache any any one time. This is enough
     * to allow the user to scroll rapidly between different areas of the dataset without evicting pages which are still needed.
     *
     * A value of 0 indicates to never purge the prefetched data.
     */
    purgePageCount: 5,

    /**
     * @cfg {Number} trailingBufferZone
     * The number of extra records to keep cached on the trailing side of scrolling buffer
     * as scrolling proceeds. A larger number means fewer replenishments from the server.
     */
    trailingBufferZone: 25,

    /**
     * @cfg {Number} leadingBufferZone
     * The number of extra rows to keep cached on the leading side of scrolling buffer
     * as scrolling proceeds. A larger number means fewer replenishments from the server.
     */
    leadingBufferZone: 200,

    /**
     * @cfg {Number} defaultViewSize The default view size to use until the {@link #viewSize} has been configured.
     * @private
     */
    defaultViewSize: 100,

    /**
     * @cfg {Number} viewSize The view size needed to fill the current view. Defaults to the {@link #defaultViewSize}.
     * This will typically be set by the underlying view.
     * @private
     */
    viewSize: 0,

    /**
     * @inheritdoc
     */
    trackRemoved: false
  },

  /**
   * We are using applyData so that we can return nothing and prevent the `this.data`
   * property to be overridden.
   * @param {Array/Object} data
   */
  applyData: function (data) {
    var dataCollection = this.data || (this.data = this.createDataCollection());

    //<debug>
    if (data && data !== true) {
      Ext.raise(
        "Cannot load a buffered store with local data - the store is a map of remote data"
      );
    }
    //</debug>

    return dataCollection;
  },

  applyProxy: function (proxy) {
    proxy = this.callParent([proxy]);

    // This store asks for pages.
    // If used with a MemoryProxy, it must work
    if (proxy && proxy.setEnablePaging) {
      proxy.setEnablePaging(true);
    }
    return proxy;
  },

  applyAutoSort: function () {
    // Return undefined so that applier does not run.
    // BufferedStore/PageMap cannot sort.
  },

  createFiltersCollection: function () {
    return new Ext.util.FilterCollection();
  },

  createSortersCollection: function () {
    return new Ext.util.SorterCollection();
  },

  //<debug>
  updateRemoteFilter: function (remoteFilter, oldRemoteFilter) {
    if (remoteFilter === false) {
      Ext.raise("Buffered stores are always remotely filtered.");
    }
    this.callParent([remoteFilter, oldRemoteFilter]);
  },

  updateRemoteSort: function (remoteSort, oldRemoteSort) {
    if (remoteSort === false) {
      Ext.raise("Buffered stores are always remotely sorted.");
    }
    this.callParent([remoteSort, oldRemoteSort]);
  },

  updateTrackRemoved: function (value) {
    if (value !== false) {
      Ext.raise("Cannot use trackRemoved with a buffered store.");
    }
    this.callParent(arguments);
  },
  //</debug>

  updateGroupField: function (field) {
    this.group(field);
  },

  getGrouper: function () {
    return this.grouper;
  },

  isGrouped: function () {
    return !!this.grouper;
  },

  createDataCollection: function () {
    var me = this,
      result = new Ext.data.PageMap({
        store: me,
        rootProperty: "data",
        pageSize: me.getPageSize(),
        maxSize: me.getPurgePageCount(),
        listeners: {
          // Whenever PageMap gets cleared, it means we re no longer interested in
          // any outstanding page prefetches, so cancel tham all
          clear: me.onPageMapClear,
          scope: me
        }
      });

    // Allow view to veto prune if the old page is still in use by the view
    me.relayEvents(result, ["beforepageremove", "pageadd", "pageremove"]);
    me.pageRequests = {};
    return result;
  },

  //<debug>
  add: function () {
    Ext.raise(
      "add method may not be called on a buffered store - the store is a map of remote data"
    );
  },

  insert: function () {
    Ext.raise(
      "insert method may not be called on a buffered store - the store is a map of remote data"
    );
  },
  //</debug>

  removeAll: function (silent) {
    var me = this,
      data = me.getData();

    if (data) {
      if (silent) {
        me.suspendEvent("clear");
      }
      data.clear();
      if (silent) {
        me.resumeEvent("clear");
      }
    }
  },

  flushLoad: function () {
    var me = this,
      options = me.pendingLoadOptions;

    // If it gets called programatically, the listener will need cancelling
    me.clearLoadTask();
    if (!options) {
      return;
    }

    // Buffered stores, a load operation means kick off a clean load from page 1
    me.getData().clear();
    options.page = 1;
    options.start = 0;
    options.limit = me.getViewSize() || me.getDefaultViewSize();

    // If we're prefetching, the arguments on the callback for getting the range is different
    // So we indicate that we need to fire a special "load" style callback
    options.loadCallback = options.callback;

    // options might be chained, with callback on a prototype; delete won't clear it.
    options.callback = null;
    return me.loadToPrefetch(options);
  },

  reload: function (options) {
    var me = this,
      data = me.getData(),
      // If we don't have a known totalCount, use a huge value
      lastTotal = Number.MAX_VALUE,
      startIdx,
      endIdx,
      startPage,
      endPage,
      i,
      waitForReload,
      bufferZone,
      records;

    if (!options) {
      options = {};
    }

    // Prevent re-entering the load process if we are already in a wait state for a batch of pages.
    if (me.loading || me.fireEvent("beforeload", me, options) === false) {
      return;
    }

    waitForReload = function () {
      var newCount = me.totalCount,
        oldRequestSize = endIdx - startIdx;

      // If the dataset has now shrunk leaving the calculated request zone unavailable,
      // re-evaluate the request zone. Start as close to the end as possible.
      if (endIdx >= newCount) {
        endIdx = newCount - 1;
        startIdx = Math.max(endIdx - oldRequestSize, 0);
      }
      if (me.rangeCached(startIdx, endIdx, false)) {
        me.loadCount = (me.loadCount || 0) + 1;
        me.loading = false;
        data.un("pageadd", waitForReload);
        records = data.getRange(startIdx, endIdx);
        me.fireEvent("load", me, records, true);
        me.fireEvent("refresh", me);
      }
    };
    bufferZone = Math.ceil(
      (me.getLeadingBufferZone() + me.getTrailingBufferZone()) / 2
    );

    // Decide what reload means.
    // If the View was configured preserveScrollOnReload, then it will
    // inject that setting here. This means that reload means
    // load the last requested range.
    if (me.lastRequestStart && me.preserveScrollOnReload) {
      startIdx = me.lastRequestStart;
      endIdx = me.lastRequestEnd;
      lastTotal = me.getTotalCount();
    }
    // Otherwise, reload means start from page 1
    else {
      startIdx = options.start || 0;
      endIdx = startIdx + (options.count || me.getPageSize()) - 1;
    }

    // Clear page cache
    data.clear(true);

    // So that prefetchPage does not consider the store to be fully loaded if the local count is equal to the total count
    delete me.totalCount;

    // Calculate a page range which encompasses the Store's loaded range plus both buffer zones
    startIdx = Math.max(startIdx - bufferZone, 0);
    endIdx = Math.min(endIdx + bufferZone, lastTotal);

    // We must wait for a slightly wider range to be cached.
    // This is to allow grouping features to peek at the two surrounding records
    // when rendering a *range* of records to see whether the start of the range
    // really is a group start and the end of the range really is a group end.
    startIdx = startIdx === 0 ? 0 : startIdx - 1;
    endIdx = endIdx === lastTotal ? endIdx : endIdx + 1;

    startPage = me.getPageFromRecordIndex(startIdx);
    endPage = me.getPageFromRecordIndex(endIdx);

    me.loading = true;
    options.waitForReload = waitForReload;

    // Wait for the requested range to become available in the page map
    // Load the range as soon as the whole range is available
    data.on("pageadd", waitForReload);

    // Recache the page range which encapsulates our visible records
    for (i = startPage; i <= endPage; i++) {
      me.prefetchPage(i, options);
    }
  },

  filter: function () {
    //<debug>
    if (!this.getRemoteFilter()) {
      Ext.raise(
        "Local filtering may not be used on a buffered store - the store is a map of remote data"
      );
    }
    //</debug>

    // Remote filtering forces a load. load clears the store's contents.
    this.callParent(arguments);
  },

  filterBy: function (fn, scope) {
    //<debug>
    Ext.raise(
      "Local filtering may not be used on a buffered store - the store is a map of remote data"
    );
    //</debug>
  },

  loadData: function (data, append) {
    //<debug>
    Ext.raise(
      "LoadData may not be used on a buffered store - the store is a map of remote data"
    );
    //</debug>
  },

  loadPage: function (page, options) {
    var me = this;
    options = options || {};

    options.page = me.currentPage = page;
    options.start = (page - 1) * me.getPageSize();
    options.limit = me.getViewSize() || me.getDefaultViewSize();
    options.loadCallback = options.callback;

    // options might be chained, with callback on a prototype; delete won't clear it.
    options.callback = null;
    return me.loadToPrefetch(options);
  },

  clearData: function (isLoad) {
    var me = this,
      data = me.getData();

    if (data) {
      data.clear();
    }
  },

  /**
   * @private
   * A BufferedStore always reports that it contains the full dataset.
   * The number of records that happen to be cached at any one time is never useful.
   */
  getCount: function () {
    return this.totalCount || 0;
  },

  getRange: function (start, end, options) {
    var me = this,
      maxIndex = me.totalCount - 1,
      lastRequestStart = me.lastRequestStart,
      result = [],
      data = me.getData(),
      pageAddHandler,
      requiredStart,
      requiredEnd,
      requiredStartPage,
      requiredEndPage;

    options = Ext.apply(
      {
        prefetchStart: start,
        prefetchEnd: end
      },
      options
    );

    // Sanity check end point to be within dataset range
    end = end >= me.totalCount ? maxIndex : end;

    // If this is being called in the default manner, to fetch data
    // for rendering, then we must wait for a slightly wider range to be cached.
    // This is to allow grouping features to peek at the two surrounding records
    // when rendering a *range* of records to see whether the start of the range
    // really is a group start and the end of the range really is a group end.
    if (options.forRender !== false) {
      requiredStart = start === 0 ? 0 : start - 1;
      requiredEnd = end === maxIndex ? end : end + 1;
    } else {
      requiredStart = start;
      requiredEnd = end;
    }

    // Keep track of range we are being asked for so we can track direction of movement through the dataset
    me.lastRequestStart = start;
    me.lastRequestEnd = end;

    // If data request can be satisfied from the page cache
    if (me.rangeCached(start, end, options.forRender)) {
      me.onRangeAvailable(options);
      result = data.getRange(start, end + 1);
    }
    // At least some of the requested range needs loading from server
    else {
      // Private event used by the LoadMask class to perform masking when the range required for rendering is not found in the cache
      me.fireEvent("cachemiss", me, start, end);

      requiredStartPage = me.getPageFromRecordIndex(requiredStart);
      requiredEndPage = me.getPageFromRecordIndex(requiredEnd);

      // Add a pageadd listener, and as soon as the requested range is loaded, call onRangeAvailable to call the callback.
      pageAddHandler = function (pageMap, page, records) {
        if (
          page >= requiredStartPage &&
          page <= requiredEndPage &&
          me.rangeCached(start, end)
        ) {
          // Private event used by the LoadMask class to unmask when the range required for rendering has been loaded into the cache
          me.fireEvent("cachefilled", me, start, end);
          data.un("pageadd", pageAddHandler);
          me.onRangeAvailable(options);
        }
      };
      data.on("pageadd", pageAddHandler);

      // Prioritize the request for the *exact range that the UI is asking for*.
      // When a page request is in flight, it will not be requested again by checking the me.pageRequests hash,
      // so the request after this will only request the *remaining* unrequested pages .
      me.prefetchRange(start, end);
    }
    // Load the pages around the requested range required by the leadingBufferZone and trailingBufferZone.
    me.primeCache(start, end, start < lastRequestStart ? -1 : 1);

    return result;
  },

  /**
   * Get the Record with the specified id.
   *
   * This method is not affected by filtering, lookup will be performed from all records
   * inside the store, filtered or not.
   *
   * @param {Mixed} id The id of the Record to find.
   * @return {Ext.data.Model} The Record with the passed id. Returns null if not found.
   */
  getById: function (id) {
    var result = this.data.findBy(function (record) {
      return record.getId() === id;
    });
    return result;
  },

  /**
   * @inheritdoc
   */
  getAt: function (index) {
    var data = this.getData();

    if (data.hasRange(index, index)) {
      return data.getAt(index);
    }
  },

  /**
   * @private
   * Get the Record with the specified internalId.
   *
   * This method is not effected by filtering, lookup will be performed from all records
   * inside the store, filtered or not.
   *
   * @param {Mixed} internalId The id of the Record to find.
   * @return {Ext.data.Model} The Record with the passed internalId. Returns null if not found.
   */
  getByInternalId: function (internalId) {
    return this.data.getByInternalId(internalId);
  },

  // Inherit docs
  contains: function (record) {
    return this.indexOf(record) > -1;
  },

  /**
   * Get the index of the record within the store.
   *
   * When store is filtered, records outside of filter will not be found.
   *
   * @param {Ext.data.Model} record The Ext.data.Model object to find.
   * @return {Number} The index of the passed Record. Returns -1 if not found.
   */
  indexOf: function (record) {
    return this.getData().indexOf(record);
  },

  /**
   * Get the index within the store of the Record with the passed id.
   *
   * Like #indexOf, this method is effected by filtering.
   *
   * @param {String} id The id of the Record to find.
   * @return {Number} The index of the Record. Returns -1 if not found.
   */
  indexOfId: function (id) {
    return this.indexOf(this.getById(id));
  },

  group: function (grouper, direction) {
    var me = this,
      oldGrouper;

    if (grouper && typeof grouper === "string") {
      oldGrouper = me.grouper;

      if (oldGrouper && direction !== undefined) {
        oldGrouper.setDirection(direction);
      } else {
        me.grouper = new Ext.util.Grouper({
          property: grouper,
          direction: direction || "ASC",
          root: "data"
        });
      }
    } else {
      me.grouper = grouper
        ? me.getSorters().decodeSorter(grouper, "Ext.util.Grouper")
        : null;
    }

    me.getData().clear();
    me.loadPage(1, {
      callback: function () {
        me.fireEvent("groupchange", me, me.getGrouper());
      }
    });
  },

  /**
   * Determines the page from a record index
   * @param {Number} index The record index
   * @return {Number} The page the record belongs to
   */
  getPageFromRecordIndex: function (index) {
    return Math.floor(index / this.getPageSize()) + 1;
  },

  calculatePageCacheSize: function (rangeSizeRequested) {
    var me = this,
      purgePageCount = me.getPurgePageCount();

    // Calculate the number of pages that the cache will keep before purging  as follows:
    // TWO full rendering zones (in case of rapid teleporting by dragging the scroller) plus configured purgePageCount.
    // Ensure we never reduce the count. It always uses the largest requested block as the basis for the calculated size.
    return purgePageCount
      ? Math.max(
          me.getData().getMaxSize() || 0,
          Math.ceil(
            (rangeSizeRequested +
              me.getTrailingBufferZone() +
              me.getLeadingBufferZone()) /
              me.getPageSize()
          ) *
            2 +
            purgePageCount
        )
      : 0;
  },

  loadToPrefetch: function (options) {
    var me = this,
      prefetchOptions = options,
      i,
      records,
      dataSetSize,
      // Get the requested record index range in the dataset
      startIdx = options.start,
      endIdx = options.start + options.limit - 1,
      rangeSizeRequested = me.getViewSize() || options.limit,
      // The end index to load into the store's live record collection
      loadEndIdx = Math.min(endIdx, options.start + rangeSizeRequested - 1),
      // Calculate a page range which encompasses the requested range plus both buffer zones.
      // The endPage will be adjusted to be in the dataset size range as soon as the first data block returns.
      startPage = me.getPageFromRecordIndex(
        Math.max(startIdx - me.getTrailingBufferZone(), 0)
      ),
      endPage = me.getPageFromRecordIndex(endIdx + me.getLeadingBufferZone()),
      data = me.getData(),
      callbackFn = function () {
        // See comments in load() for why we need this.
        records = records || [];

        if (options.loadCallback) {
          options.loadCallback.call(
            options.scope || me,
            records,
            operation,
            true
          );
        }

        if (options.callback) {
          options.callback.call(
            options.scope || me,
            records,
            startIdx || 0,
            endIdx || 0,
            options
          );
        }
      },
      fireEventsFn = function () {
        me.loadCount = (me.loadCount || 0) + 1;
        me.fireEvent("datachanged", me);
        me.fireEvent("refresh", me);
        me.fireEvent("load", me, records, true);
      },
      // Wait for the viewable range to be available.
      waitForRequestedRange = function () {
        if (me.rangeCached(startIdx, loadEndIdx)) {
          me.loading = false;
          records = data.getRange(startIdx, loadEndIdx + 1);
          data.un("pageadd", waitForRequestedRange);

          // If there is a listener for guaranteedrange then fire that event
          if (me.hasListeners.guaranteedrange) {
            me.guaranteeRange(
              startIdx,
              loadEndIdx,
              options.callback,
              options.scope
            );
          }

          callbackFn();
          fireEventsFn();
        }
      },
      operation;

    //<debug>
    if (isNaN(me.pageSize) || !me.pageSize) {
      Ext.raise("Buffered store configured without a pageSize", me);
    }
    //</debug>

    // Ensure that the purgePageCount allows enough pages to be kept cached to cover the
    // requested range. If the pageSize is very small we might need a lot of pages.
    data.setMaxSize(me.calculatePageCacheSize(rangeSizeRequested));

    if (me.fireEvent("beforeload", me, options) !== false) {
      // So that prefetchPage does not consider the store to be fully loaded if the local count is equal to the total count
      delete me.totalCount;

      me.loading = true;

      // Any configured callback is handled in waitForRequestedRange above.
      // It should not be processed by onProxyPrefetch.
      if (options.callback) {
        prefetchOptions = Ext.apply({}, options);
        delete prefetchOptions.callback;
      }

      // Load the first page in the range, which will give us the initial total count.
      // Once it is loaded, go ahead and prefetch any subsequent pages, if necessary.
      // The prefetchPage has a check to prevent us loading more than the totalCount,
      // so we don't want to blindly load up <n> pages where it isn't required.
      me.on(
        "prefetch",
        function (store, records, successful, op) {
          // Capture operation here so it can be used in the loadCallback above
          operation = op;
          if (successful) {
            // If there is data in the dataset, we can go ahead and add the pageadd listener which waits for the visible range
            // and we can also issue the requests to fill the surrounding buffer zones.
            if ((dataSetSize = me.getTotalCount())) {
              // Wait for the requested range to become available in the page map
              data.on("pageadd", waitForRequestedRange);

              // As soon as we have the size of the dataset, ensure we are not waiting for more than can ever arrive,
              loadEndIdx = Math.min(loadEndIdx, dataSetSize - 1);

              // And make sure we never ask for pages beyond the end of the dataset.
              endPage = me.getPageFromRecordIndex(
                Math.min(
                  loadEndIdx + me.getLeadingBufferZone(),
                  dataSetSize - 1
                )
              );

              for (i = startPage + 1; i <= endPage; ++i) {
                me.prefetchPage(i, prefetchOptions);
              }
            } else {
              callbackFn();
              fireEventsFn();
            }
          }
          // Unsuccessful prefetch: fire a load event with success false.
          else {
            me.loading = false;
            callbackFn();
            me.fireEvent("load", me, records, false);
          }
        },
        null,
        { single: true }
      );

      me.prefetchPage(startPage, prefetchOptions);
    }
  },

  // Buffering
  /**
   * Prefetches data into the store using its configured {@link #proxy}.
   * @param {Object} options (Optional) config object, passed into the Ext.data.operation.Operation object before loading.
   * See {@link #method-load}
   */
  prefetch: function (options) {
    var me = this,
      pageSize = me.getPageSize(),
      data = me.getData(),
      operation,
      existingPageRequest;

    // Check pageSize has not been tampered with. That would break page caching
    if (pageSize) {
      if (me.lastPageSize && pageSize != me.lastPageSize) {
        Ext.raise("pageSize cannot be dynamically altered");
      }
      if (!data.getPageSize()) {
        data.setPageSize(pageSize);
      }
    }

    // Allow first prefetch call to imply the required page size.
    else {
      me.pageSize = data.setPageSize((pageSize = options.limit));
    }

    // So that we can check for tampering next time through
    me.lastPageSize = pageSize;

    // Always get whole pages.
    if (!options.page) {
      options.page = me.getPageFromRecordIndex(options.start);
      options.start = (options.page - 1) * pageSize;
      options.limit = Math.ceil(options.limit / pageSize) * pageSize;
    }

    // Currently not requesting this page, or the request was for the last
    // generation of the data cache (clearing it changes generations)
    // then request it...
    existingPageRequest = me.pageRequests[options.page];
    if (
      !existingPageRequest ||
      existingPageRequest.getOperation().pageMapGeneration !==
        data.pageMapGeneration
    ) {
      // Copy options into a new object so as not to mutate passed in objects
      options = Ext.apply(
        {
          action: "read",
          filters: me.getFilters().items,
          sorters: me.getSorters().items,
          grouper: me.getGrouper(),
          internalCallback: me.onProxyPrefetch,
          internalScope: me
        },
        options
      );

      operation = me.createOperation("read", options);

      // Generation # of the page map to which the requested records belong.
      // If page map is cleared while this request is in flight, the pageMapGeneration will increment and the payload will be rejected
      operation.pageMapGeneration = data.pageMapGeneration;

      if (me.fireEvent("beforeprefetch", me, operation) !== false) {
        me.pageRequests[options.page] = operation.execute();
        if (me.getProxy().isSynchronous) {
          delete me.pageRequests[options.page];
        }
      }
    }

    return me;
  },

  /**
   * @private
   * Cancels all pending prefetch requests.
   *
   * This is called when the page map is cleared.
   *
   * Any requests which still make it through will be for the previous pageMapGeneration
   * (pageMapGeneration is incremented upon clear), and so will be rejected upon arrival.
   */
  onPageMapClear: function () {
    var me = this,
      loadingFlag = me.wasLoading,
      reqs = me.pageRequests,
      data = me.getData(),
      page;

    // If any requests return, we no longer respond to them.
    data.clearListeners();

    // replace the listeners we need.
    data.on("clear", me.onPageMapClear, me);
    me.relayEvents(data, ["beforepageremove", "pageadd", "pageremove"]);

    // If the page cache gets cleared it's because a full reload is in progress.
    // Setting the loading flag prevents linked Views from displaying the empty text
    // during a load... we don't know whether ther dataset is empty or not.
    me.loading = true;
    me.totalCount = 0;

    // Abort all outstanding requests.
    // onProxyPrefetch will reject them as being for the previous data generation
    // anyway, if they do return.
    // because of the pageMapGeneration mismatch.
    for (page in reqs) {
      if (reqs.hasOwnProperty(page)) {
        reqs[page].getOperation().abort();
      }
    }

    // This will update any views.
    me.fireEvent("clear", me);

    // Restore loading flag. The beforeload event could still veto the process.
    // The flag does not get set for real until we pass the beforeload event.
    me.loading = loadingFlag;
  },

  /**
   * Prefetches a page of data.
   * @param {Number} page The page to prefetch
   * @param {Object} options (Optional) config object, passed into the Ext.data.operation.Operation object before loading.
   * See {@link #method-load}
   */
  prefetchPage: function (page, options) {
    var me = this,
      pageSize = me.getPageSize(),
      start = (page - 1) * pageSize,
      total = me.totalCount;

    // No more data to prefetch.
    if (total !== undefined && me.data.getCount() === total) {
      return;
    }

    // Copy options into a new object so as not to mutate passed in objects
    me.prefetch(
      Ext.applyIf(
        {
          page: page,
          start: start,
          limit: pageSize
        },
        options
      )
    );
  },

  /**
   * Called after the configured proxy completes a prefetch operation.
   * @private
   * @param {Ext.data.operation.Operation} operation The operation that completed
   */
  onProxyPrefetch: function (operation) {
    if (this.destroying || this.destroyed) {
      return;
    }

    var me = this,
      resultSet = operation.getResultSet(),
      records = operation.getRecords(),
      successful = operation.wasSuccessful(),
      page = operation.getPage(),
      waitForReload = operation.waitForReload,
      oldTotal = me.totalCount,
      requests = me.pageRequests,
      key,
      op;

    // Only cache the data if the operation was invoked for the current pageMapGeneration.
    // If the pageMapGeneration has changed since the request was fired off, it will have been cancelled.
    if (operation.pageMapGeneration === me.getData().pageMapGeneration) {
      if (resultSet) {
        me.totalCount = resultSet.getTotal();
        if (me.totalCount !== oldTotal) {
          me.fireEvent("totalcountchange", me.totalCount);
        }
      }

      // Remove the loaded page from the outstanding pages hash
      if (page !== undefined) {
        delete me.pageRequests[page];
      }

      // Prefetch is broadcast before the page is cached
      me.loading = false;
      me.fireEvent("prefetch", me, records, successful, operation);

      // Add the page into the page map.
      // pageadd event may trigger the onRangeAvailable
      if (successful) {
        if (me.totalCount === 0) {
          if (waitForReload) {
            for (key in requests) {
              op = requests[key].getOperation();
              // Created in the same batch, clear the waitForReload so this
              // won't be run again
              if (op.waitForReload === waitForReload) {
                delete op.waitForReload;
              }
            }
            me.getData().un("pageadd", waitForReload);
            me.fireEvent("load", me, [], true);
            me.fireEvent("refresh", me);
          }
        } else {
          me.cachePage(records, operation.getPage());
        }
      }

      //this is a callback that would have been passed to the 'read' function and is optional
      Ext.callback(operation.getCallback(), operation.getScope() || me, [
        records,
        operation,
        successful
      ]);
    }
  },

  /**
   * Caches the records in the prefetch and stripes them with their server-side
   * index.
   * @private
   * @param {Ext.data.Model[]} records The records to cache
   * @param {Ext.data.operation.Operation} page The associated operation
   */
  cachePage: function (records, page) {
    var me = this,
      len = records.length,
      i;

    if (!Ext.isDefined(me.totalCount)) {
      me.totalCount = records.length;
      me.fireEvent("totalcountchange", me.totalCount);
    }

    // Add the fetched page into the pageCache
    for (i = 0; i < len; i++) {
      records[i].join(me);
    }
    me.getData().addPage(page, records);
  },

  /**
   * Determines if the passed range is available in the page cache.
   * @private
   * @param {Number} start The start index
   * @param {Number} end The end index in the range
   * @param {Boolean} [forRender] (private) Passed by the BufferedRenderer to
   * indicate that it's going to need extra rows to peek at to determine
   * group start/end status for the rendered block.
   */
  rangeCached: function (start, end, forRender) {
    var requiredStart = start,
      requiredEnd = end;

    // If this is for getting data to render, we must wait for a slightly wider range to be cached.
    // This is to allow grouping features to peek at the two surrounding records
    // when rendering a *range* of records to see whether the start of the range
    // really is a group start and the end of the range really is a group end.
    if (forRender !== false) {
      (requiredStart = start === 0 ? 0 : start - 1),
        (requiredEnd = end === this.totalCount - 1 ? end : end + 1);
    }

    return this.getData().hasRange(requiredStart, requiredEnd);
  },

  /**
   * Determines if the passed page is available in the page cache.
   * @private
   * @param {Number} page The page to find in the page cache.
   */
  pageCached: function (page) {
    return this.getData().hasPage(page);
  },

  /**
   * Determines if a request for a page is currently running
   * @private
   * @param {Number} page The page to check for
   */
  pagePending: function (page) {
    return !!this.pageRequests[page];
  },

  /**
   * Determines if the passed range is available in the page cache.
   * @private
   * @deprecated 4.1.0 use {@link #rangeCached} instead
   * @param {Number} start The start index
   * @param {Number} end The end index in the range
   * @return {Boolean}
   */
  rangeSatisfied: function (start, end) {
    return this.rangeCached(start, end);
  },

  /**
   * Handles the availability of a requested range that was not previously available
   * @private
   */
  onRangeAvailable: function (options) {
    var me = this,
      totalCount = me.getTotalCount(),
      start = options.prefetchStart,
      end =
        options.prefetchEnd > totalCount - 1
          ? totalCount - 1
          : options.prefetchEnd,
      range;

    end = Math.max(0, end);

    //<debug>
    if (start > end) {
      Ext.log({
        level: "warn",
        msg:
          "Start (" +
          start +
          ") was greater than end (" +
          end +
          ") for the range of records requested (" +
          start +
          "-" +
          options.prefetchEnd +
          ")" +
          (this.storeId ? ' from store "' + this.storeId + '"' : "")
      });
    }
    //</debug>

    range = me.getData().getRange(start, end + 1);
    if (options.fireEvent !== false) {
      me.fireEvent("guaranteedrange", range, start, end, options);
    }
    if (options.callback) {
      options.callback.call(options.scope || me, range, start, end, options);
    }
  },

  /**
   * Guarantee a specific range, this will load the store with a range (that
   * must be the `pageSize` or smaller) and take care of any loading that may
   * be necessary.
   * @deprecated Use {@link #getRange}
   */
  guaranteeRange: function (start, end, callback, scope, options) {
    options = Ext.apply(
      {
        callback: callback,
        scope: scope
      },
      options
    );
    this.getRange(start, end + 1, options);
  },

  /**
   * Ensures that the specified range of rows is present in the cache.
   *
   * Converts the row range to a page range and then only load pages which are not already
   * present in the page cache.
   */
  prefetchRange: function (start, end) {
    var me = this,
      startPage,
      endPage,
      page,
      data = me.getData();

    if (!me.rangeCached(start, end)) {
      startPage = me.getPageFromRecordIndex(start);
      endPage = me.getPageFromRecordIndex(end);

      // Ensure that the page cache's max size is correct.
      // Our purgePageCount is the number of additional pages *outside of the required range* which
      // may be kept in the cache. A purgePageCount of zero means unlimited.
      data.setMaxSize(me.calculatePageCacheSize(end - start + 1));

      // We have the range, but ensure that we have a "buffer" of pages around it.
      for (page = startPage; page <= endPage; page++) {
        if (!me.pageCached(page)) {
          me.prefetchPage(page);
        }
      }
    }
  },

  primeCache: function (start, end, direction) {
    var me = this,
      leadingBufferZone = me.getLeadingBufferZone(),
      trailingBufferZone = me.getTrailingBufferZone(),
      pageSize = me.getPageSize(),
      totalCount = me.totalCount;

    // Scrolling up
    if (direction === -1) {
      start = Math.max(start - leadingBufferZone, 0);
      end = Math.min(end + trailingBufferZone, totalCount - 1);
    }
    // Scrolling down
    else if (direction === 1) {
      start = Math.max(
        Math.min(start - trailingBufferZone, totalCount - pageSize),
        0
      );
      end = Math.min(end + leadingBufferZone, totalCount - 1);
    }
    // Teleporting
    else {
      start = Math.min(
        Math.max(
          Math.floor(start - (leadingBufferZone + trailingBufferZone) / 2),
          0
        ),
        totalCount - me.pageSize
      );
      end = Math.min(
        Math.max(
          Math.ceil(end + (leadingBufferZone + trailingBufferZone) / 2),
          0
        ),
        totalCount - 1
      );
    }
    me.prefetchRange(start, end);
  },

  sort: function (field, direction, mode) {
    if (arguments.length === 0) {
      this.clearAndLoad();
    } else {
      this.getSorters().addSort(field, direction, mode);
    }
  },

  onSorterEndUpdate: function () {
    var me = this,
      sorters = me.getSorters().getRange();

    // Only load or sort if there are sorters
    if (sorters.length) {
      me.fireEvent("beforesort", me, sorters);
      me.clearAndLoad({
        callback: function () {
          me.fireEvent("sort", me, sorters);
        }
      });
    } else {
      // Sort event must fire when sorters collection is updated to empty.
      me.fireEvent("sort", me, sorters);
    }
  },

  clearAndLoad: function (options) {
    var me = this;

    me.clearing = true;
    me.getData().clear();
    me.clearing = false;

    me.loadPage(1, options);
  },

  privates: {
    isLast: function (record) {
      return this.indexOf(record) === this.getTotalCount() - 1;
    },

    isMoving: function () {
      return false;
    }
  }
});
