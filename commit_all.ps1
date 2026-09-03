$files = @(
  @{ path = "backend/package.json"; msg = "Update backend package.json" },
  @{ path = "backend/src/db/schema/customs.ts"; msg = "Update customs schema for Digital Customs Documentation (FR-06)" },
  @{ path = "backend/src/routes/admin.routes.ts"; msg = "Update admin routes" },
  @{ path = "backend/src/routes/customs.routes.ts"; msg = "Update customs routes to support real document status over mock data" },
  @{ path = "backend/src/routes/shipper.routes.ts"; msg = "Fix TypeScript errors and update shipper active shipment query" },
  @{ path = "backend/src/routes/telemetry.routes.ts"; msg = "Fix TypeScript relation type errors in telemetry routes" },
  @{ path = "backend/test/verification.test.ts"; msg = "Update verification test" },
  @{ path = "web/playwright-report/index.html"; msg = "Update playwright report" },
  @{ path = "web/src/views/admin-console/AuditLogs.tsx"; msg = "Update AuditLogs component" },
  @{ path = "web/src/views/admin-console/DisputeMediation.tsx"; msg = "Update DisputeMediation component" },
  @{ path = "web/src/views/shipper-portal/CustomsTab.tsx"; msg = "Refactor CustomsTab to render actual database status instead of mock hashes" },
  @{ path = "web/src/views/shipper-portal/components/FreightOrderForm.tsx"; msg = "Refactor FreightOrderForm to fetch dynamic spot quote from AI backend API" },
  @{ path = "web/test-results/.last-run.json"; msg = "Update test results" },
  @{ path = "web/tests/shipper.spec.ts"; msg = "Update shipper spec tests" },
  @{ path = "backend/package-lock.json"; msg = "Update backend package-lock.json dependencies" },
  @{ path = "backend/seed_shipment.ts"; msg = "Add script to seed active IN_TRANSIT shipment for testing" }
)

foreach ($f in $files) {
  git add $f.path
  git commit -m $f.msg
}
