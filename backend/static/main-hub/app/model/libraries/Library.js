Ext.define("MainHub.model.libraries.Library", {
  extend: "MainHub.model.Record",

  idProperty: "id",

  fields: [
    {
      name: "request_id",
      type: "int"
    },
    {
      name: "request_name",
      type: "string"
    },
    {
      name: "create_time",
      type: "date"
    },
    {
      name: "library_protocol",
      type: "int"
    },
    {
      name: "library_protocol_name",
      type: "string"
    },
    {
      name: "library_type",
      type: "int"
    },
    {
      name: "library_type_name",
      type: "string"
    },
    {
      name: "amplification_cycles",
      type: "int",
      allowNull: true
    },
    {
      name: "organism",
      type: "int"
    },
    {
      name: "organism_name",
      type: "string"
    },
    {
      name: "index_type",
      type: "int"
    },
    {
      name: "index_type_name",
      type: "string"
    },
    {
      name: "index_reads",
      type: "int",
      allowNull: true
    },
    {
      name: "index_i7",
      type: "string"
    },
    {
      name: "index_i5",
      type: "string"
    },
    {
      name: "equal_representation_nucleotides",
      type: "bool",
      allowNull: true
    },
    {
      name: "concentration",
      type: "float",
      allowNull: true
    },
    {
      name: "concentration_method",
      type: "int"
    },
    {
      name: "concentration_method_name",
      type: "string"
    },
    {
      name: "mean_fragment_size",
      type: "int",
      allowNull: true
    },
    {
      name: "qpcr_result",
      type: "float",
      allowNull: true
    },
    {
      name: "read_length",
      type: "int"
    },
    {
      name: "read_length_name",
      type: "string"
    },
    {
      name: "sequencing_depth",
      type: "float",
      allowNull: true
    },
    {
      name: "comments",
      type: "string"
    },
    {
      name: "nucleic_acid_type_name",
      type: "string"
    },
    {
      name: "nucleic_acid_type",
      type: "int"
    },
    {
      name: "rna_quality",
      type: "float",
      allowNull: true,
      defaultValue: null
    },
    {
      name: "pool",
      type: "string",
      defaultValue: ""
    }
  ]
});
