/// <reference path="../pb_data/types.d.ts" />

/**
 * Creates a PocketBase superuser (access to the built-in /_/ dashboard —
 * separate from the app's own "admins" collection used by /admin) using the
 * same credentials by default, so there's a secure way to see PocketBase's
 * own request logs (Settings -> Logs) without ever needing to run the
 * server with --dev in production, which leaks raw internal error detail
 * straight into API responses. Idempotent — safe on every boot.
 */
migrate((app) => {
  const email = $os.getenv("PB_ADMIN_EMAIL") || "johriretailers@gmail.com"
  const password = $os.getenv("PB_ADMIN_PASSWORD") || "JohriGolds@123"

  let exists = false
  try {
    app.findFirstRecordByFilter("_superusers", "email = {:email}", { email })
    exists = true
  } catch (err) {
    exists = false
  }
  if (!exists) {
    const collection = app.findCollectionByNameOrId("_superusers")
    const record = new Record(collection)
    record.set("email", email)
    record.set("password", password)
    app.save(record)
  }
}, (app) => {
  // No down-migration — this is additive first-boot seeding.
})
