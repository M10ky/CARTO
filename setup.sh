#!/usr/bin/env bash
# ============================================================

echo "▶ Création de l'arborescence des dossiers..."

# ---------------- APP (routes) ----------------
mkdir -p "app/(dashboard)/cluster"
mkdir -p "app/(dashboard)/employees/[id]"
mkdir -p "app/(dashboard)/assets/[id]"
mkdir -p "app/(dashboard)/import"
mkdir -p "app/(dashboard)/maintenance"
mkdir -p "app/(dashboard)/settings"

mkdir -p "app/api/seats/[id]"
mkdir -p "app/api/employees/[id]"
mkdir -p "app/api/assets/[id]"
mkdir -p "app/api/assignments/[id]"
mkdir -p "app/api/import/upload"
mkdir -p "app/api/import/mapping"
mkdir -p "app/api/import/commit"
mkdir -p "app/api/maintenance"
mkdir -p "app/api/search"
mkdir -p "app/api/stats"

# ---------------- COMPONENTS ----------------
mkdir -p "components/ui"
mkdir -p "components/layout"
mkdir -p "components/cartography"
mkdir -p "components/drawer"
mkdir -p "components/import"
mkdir -p "components/employees"
mkdir -p "components/assets"
mkdir -p "components/shared"

# ---------------- LIB ----------------
mkdir -p "lib/db"
mkdir -p "lib/validators"
mkdir -p "lib/excel"
mkdir -p "lib/utils"
mkdir -p "lib/constants"

# ---------------- TYPES ----------------
mkdir -p "types"

# ---------------- PRISMA ----------------
mkdir -p "prisma/migrations"
mkdir -p "prisma/seed"

# ---------------- PUBLIC ----------------
mkdir -p "public/icons"
mkdir -p "public/templates"

echo "▶ Création des fichiers vides (squelette)..."

# --- App pages ---
touch "app/(dashboard)/layout.tsx"
touch "app/(dashboard)/page.tsx"
touch "app/(dashboard)/cluster/page.tsx"
touch "app/(dashboard)/employees/page.tsx"
touch "app/(dashboard)/employees/[id]/page.tsx"
touch "app/(dashboard)/assets/page.tsx"
touch "app/(dashboard)/assets/[id]/page.tsx"
touch "app/(dashboard)/import/page.tsx"
touch "app/(dashboard)/maintenance/page.tsx"
touch "app/(dashboard)/settings/page.tsx"
touch "app/globals.css"
touch "app/layout.tsx"
touch "app/page.tsx"

# --- API routes ---
touch "app/api/seats/route.ts"
touch "app/api/seats/[id]/route.ts"
touch "app/api/employees/route.ts"
touch "app/api/employees/[id]/route.ts"
touch "app/api/assets/route.ts"
touch "app/api/assets/[id]/route.ts"
touch "app/api/assignments/route.ts"
touch "app/api/assignments/[id]/route.ts"
touch "app/api/import/upload/route.ts"
touch "app/api/import/mapping/route.ts"
touch "app/api/import/commit/route.ts"
touch "app/api/maintenance/route.ts"
touch "app/api/search/route.ts"
touch "app/api/stats/route.ts"

# --- Components: layout ---
touch "components/layout/Header.tsx"
touch "components/layout/Sidebar.tsx"
touch "components/layout/KpiBar.tsx"

# --- Components: cartography ---
touch "components/cartography/ClusterCanvas.tsx"
touch "components/cartography/WingSection.tsx"
touch "components/cartography/ZoneBlock.tsx"
touch "components/cartography/RowBlock.tsx"
touch "components/cartography/SeatCard.tsx"
touch "components/cartography/ZoneNav.tsx"
touch "components/cartography/FiltersPanel.tsx"
touch "components/cartography/SearchBar.tsx"
touch "components/cartography/LocateMeButton.tsx"

# --- Components: drawer ---
touch "components/drawer/SeatDrawer.tsx"
touch "components/drawer/OccupantFields.tsx"
touch "components/drawer/PcAssetFields.tsx"
touch "components/drawer/LocationFields.tsx"
touch "components/drawer/StatusPills.tsx"
touch "components/drawer/DrawerFooterActions.tsx"

# --- Components: import ---
touch "components/import/UploadDropzone.tsx"
touch "components/import/ColumnMappingTable.tsx"
touch "components/import/StagingPreviewTable.tsx"
touch "components/import/ImportSummary.tsx"
touch "components/import/ImportErrorsList.tsx"

# --- Components: employees / assets ---
touch "components/employees/EmployeeTable.tsx"
touch "components/employees/EmployeeForm.tsx"
touch "components/assets/AssetTable.tsx"
touch "components/assets/AssetForm.tsx"
touch "components/assets/MaintenanceHistory.tsx"

# --- Components: shared ---
touch "components/shared/DataTable.tsx"
touch "components/shared/EmptyState.tsx"
touch "components/shared/ConfirmDialog.tsx"
touch "components/shared/StatusBadge.tsx"

# --- Lib: db ---
touch "lib/db/prisma.ts"
touch "lib/db/queries.ts"

# --- Lib: validators (Zod) ---
touch "lib/validators/seat.schema.ts"
touch "lib/validators/employee.schema.ts"
touch "lib/validators/pcAsset.schema.ts"
touch "lib/validators/importRow.schema.ts"

# --- Lib: excel ---
touch "lib/excel/parseWorkbook.ts"
touch "lib/excel/columnMatcher.ts"
touch "lib/excel/dataCleaner.ts"
touch "lib/excel/templateGenerator.ts"

# --- Lib: utils / constants ---
touch "lib/utils/cn.ts"
touch "lib/utils/formatters.ts"
touch "lib/utils/seatCode.ts"
touch "lib/constants/wings.ts"
touch "lib/constants/roles.ts"

# --- Types ---
touch "types/seat.ts"
touch "types/employee.ts"
touch "types/pcAsset.ts"
touch "types/import.ts"
touch "types/api.ts"

# --- Prisma ---
touch "prisma/seed/seed.ts"

# --- Public ---
touch "public/templates/modele_import_pc.xlsx"

echo ""
echo "✅ Arborescence créée avec succès !"
echo ""