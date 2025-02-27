/**
 * <p>A plugin for Field Components which creates clones of the Field for as
 * long as the user keeps filling them. Leaving the final one blank ends the repeating series.</p>
 * <p>Usage:</p>
 * <pre><code>
    {
        xtype: 'combo',
        plugins: [ Ext.ux.FieldReplicator ],
        triggerAction: 'all',
        fieldLabel: 'Select recipient',
        store: recipientStore
    }
 * </code></pre>
 */
Ext.define("Ext.ux.FieldReplicator", {
  alias: "plugin.fieldreplicator",

  init: function (field) {
    // Assign the field an id grouping it with fields cloned from it. If it already
    // has an id that means it is itself a clone.
    if (!field.replicatorId) {
      field.replicatorId = Ext.id();
    }

    field.on("blur", this.onBlur, this);
  },

  onBlur: function (field) {
    var ownerCt = field.ownerCt,
      replicatorId = field.replicatorId,
      isEmpty = Ext.isEmpty(field.getRawValue()),
      siblings = ownerCt.query("[replicatorId=" + replicatorId + "]"),
      isLastInGroup = siblings[siblings.length - 1] === field,
      clone,
      idx;

    // If a field before the final one was blanked out, remove it
    if (isEmpty && !isLastInGroup) {
      Ext.Function.defer(field.destroy, 10, field); //delay to allow tab key to move focus first
    }
    // If the field is the last in the list and has a value, add a cloned field after it
    else if (!isEmpty && isLastInGroup) {
      if (field.onReplicate) {
        field.onReplicate();
      }
      clone = field.cloneConfig({ replicatorId: replicatorId });
      idx = ownerCt.items.indexOf(field);
      ownerCt.add(idx + 1, clone);
    }
  }
});
