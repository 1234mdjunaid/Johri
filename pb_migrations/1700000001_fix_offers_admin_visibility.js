/// <reference path="../pb_data/types.d.ts" />

/**
 * Fixes a bug in the original schema: offers.listRule/viewRule were
 * "active = true" with no admin exception, so disabling an offer in
 * /admin → Offers made it vanish from the admin's own list too, not just
 * the public wheel. Runs automatically once on next boot against any
 * already-deployed instance (migrations are tracked and only applied once).
 */
migrate((app) => {
  const collection = app.findCollectionByNameOrId("offers")
  collection.listRule = "active = true || @request.auth.collectionName = 'admins'"
  collection.viewRule = "active = true || @request.auth.collectionName = 'admins'"
  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("offers")
  collection.listRule = "active = true"
  collection.viewRule = "active = true"
  app.save(collection)
})
