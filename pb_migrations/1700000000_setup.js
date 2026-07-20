/// <reference path="../pb_data/types.d.ts" />

/**
 * One-shot, idempotent first-boot setup: imports the app's collections and
 * seeds a working admin login + starter settings + starter offers so a fresh
 * deploy is immediately usable. Safe to leave in place permanently — every
 * step checks for existing data before creating anything, so re-running this
 * migration (e.g. PocketBase restarting) never duplicates records.
 *
 * Configurable via environment variables (all optional, sensible defaults
 * below); read with $os.getenv rather than plain top-level bindings because
 * this callback — like routerAdd hook callbacks — does not close over this
 * file's outer scope (see README's PocketBase limitations section).
 */
migrate((app) => {
  const schema = require(`${__hooks}/../pb_schema.json`)
  app.importCollections(schema, false)

  const adminEmail = $os.getenv("PB_ADMIN_EMAIL") || "johriretailers@gmail.com"
  const adminPassword = $os.getenv("PB_ADMIN_PASSWORD") || "JohriGolds@123"
  const businessName = $os.getenv("PB_BUSINESS_NAME") || "Johri Jewellers"
  const whatsappNumber = $os.getenv("PB_WHATSAPP_NUMBER") || "919161191676"

  let hasAdmin = false
  try {
    app.findFirstRecordByFilter("admins", "email = {:email}", { email: adminEmail })
    hasAdmin = true
  } catch (err) {
    hasAdmin = false
  }
  if (!hasAdmin) {
    const adminsCol = app.findCollectionByNameOrId("admins")
    const admin = new Record(adminsCol)
    admin.set("email", adminEmail)
    admin.set("password", adminPassword)
    admin.set("name", "Owner")
    app.save(admin)
  }

  let hasSettings = false
  try {
    app.findFirstRecordByFilter("settings", "id != ''", {})
    hasSettings = true
  } catch (err) {
    hasSettings = false
  }
  if (!hasSettings) {
    const settingsCol = app.findCollectionByNameOrId("settings")
    const settings = new Record(settingsCol)
    settings.set("businessName", businessName)
    settings.set("whatsappNumber", whatsappNumber)
    settings.set("primaryColor", "#b99a5f")
    settings.set("secondaryColor", "#101010")
    settings.set("accentColor", "#f4e6b2")
    settings.set(
      "terms",
      "Valid on a single purchase at " +
        businessName +
        ". One coupon per guest. Cannot be combined with other offers. Please present this coupon in store. Subject to store discretion.",
    )
    settings.set("introSeconds", 3.4)
    app.save(settings)
  }

  let hasOffers = false
  try {
    app.findFirstRecordByFilter("offers", "id != ''", {})
    hasOffers = true
  } catch (err) {
    hasOffers = false
  }
  if (!hasOffers) {
    const offersCol = app.findCollectionByNameOrId("offers")
    const defaults = [
      { title: "10% Off Making Charges", probability: 3, wheelColor: "#6b5a96" },
      { title: "Free Silver Coin", probability: 1, wheelColor: "#cbbce0" },
      { title: "500 Off", probability: 3, wheelColor: "#8a76b8" },
      { title: "Free Jewellery Cleaning", probability: 4, wheelColor: "#e6ddf4" },
      { title: "5% Off Diamonds", probability: 2, wheelColor: "#9f8cc4" },
      { title: "Surprise Gift", probability: 2, wheelColor: "#d8c39a" },
    ]
    defaults.forEach((o) => {
      const offer = new Record(offersCol)
      offer.set("title", o.title)
      offer.set("probability", o.probability)
      offer.set("wheelColor", o.wheelColor)
      offer.set("active", true)
      offer.set("validityDays", 30)
      app.save(offer)
    })
  }
}, (app) => {
  // Intentionally no down-migration: this is additive first-boot seeding,
  // not something you want auto-reverted.
})
