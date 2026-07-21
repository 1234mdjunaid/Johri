/// <reference path="../pb_data/types.d.ts" />

/**
 * Adds the "counters" collection (used for sequential coupon numbers,
 * JHR-000001, JHR-000002, ...) to an already-deployed instance, and seeds
 * its single coupon_seq row. Re-importing the full schema with
 * deleteMissing=false only adds what's new/changed — existing collections
 * and their data are left alone. Idempotent: safe on every boot.
 */
migrate((app) => {
  const schema = require(`${__hooks}/../pb_schema.json`)
  app.importCollections(schema, false)

  let counter = null
  try {
    counter = app.findFirstRecordByFilter("counters", "key = 'coupon_seq'", {})
  } catch (err) {
    counter = null
  }
  if (!counter) {
    const collection = app.findCollectionByNameOrId("counters")
    const record = new Record(collection)
    record.set("key", "coupon_seq")
    record.set("value", 0)
    app.save(record)
  }
}, (app) => {
  // No down-migration — additive.
})
